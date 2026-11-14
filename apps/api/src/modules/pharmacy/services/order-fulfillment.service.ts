import { Types } from 'mongoose';
import crypto from 'crypto';
import {
  PharmacyOrderModel,
  IPharmacyOrderDocument,
  PrescriptionModel,
  UserModel,
  DispensingRecordModel,
  NotificationModel,
  AuditLogModel,
  PharmacyProfileModel,
} from '../../../database/models';
import { AppError } from '../../../shared/errors/app-error';
import type {
  PharmacyOrderStatus,
  PharmacyOrderDto,
  PharmacyOrderItemDto,
  OrderStatusEventDto,
  CreateOrderFromPrescriptionDto,
  OrderReviewDto,
  OrderFulfillmentUpdateDto,
  VerifyPickupDto,
  CancelOrderDto,
  OrderFilterDto,
  PharmacyOrderMetricsDto,
} from '@healthbridge/shared-types';

const toIsoSafe = (val?: Date | string | null): string => {
  if (!val) return new Date().toISOString();
  return val instanceof Date ? val.toISOString() : new Date(val).toISOString();
};

const VALID_STATE_TRANSITIONS: Record<PharmacyOrderStatus, PharmacyOrderStatus[]> = {
  PENDING: ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PARTIALLY_FULFILLED', 'READY_FOR_PICKUP', 'CANCELLED'],
  PARTIALLY_FULFILLED: ['PROCESSING', 'READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export class OrderFulfillmentService {
  /**
   * CREATE ORDER FROM PRESCRIPTION
   * Integrates with Prescription module, preventing duplicate active orders.
   */
  async createOrderFromPrescription(
    actor: { userId: string; role: string; name: string },
    dto: CreateOrderFromPrescriptionDto
  ): Promise<PharmacyOrderDto> {
    if (!Types.ObjectId.isValid(dto.prescriptionId)) {
      throw AppError.badRequest('Invalid prescription ID format');
    }

    const prescription = await PrescriptionModel.findById(dto.prescriptionId);
    if (!prescription) {
      throw AppError.notFound('Prescription not found');
    }

    // Prescription validation: Must be issued/active and not expired/cancelled
    const allowedStatuses = ['ISSUED', 'ACTIVE', 'PARTIALLY_DISPENSED'];
    if (!allowedStatuses.includes(prescription.status)) {
      throw AppError.badRequest(
        `Cannot create order from prescription in status '${prescription.status}'. Must be an issued active prescription.`
      );
    }

    // Determine pharmacy ID
    let pharmacyId: Types.ObjectId;
    let pharmacyName = 'HealthBridge Partner Pharmacy';

    if (actor.role === 'PHARMACY') {
      pharmacyId = new Types.ObjectId(actor.userId);
      const pharmProfile = await PharmacyProfileModel.findOne({ userId: pharmacyId });
      if (pharmProfile?.pharmacyName) pharmacyName = pharmProfile.pharmacyName;
    } else if (dto.pharmacyId && Types.ObjectId.isValid(dto.pharmacyId)) {
      pharmacyId = new Types.ObjectId(dto.pharmacyId);
      const pharmProfile = await PharmacyProfileModel.findOne({ userId: pharmacyId });
      if (pharmProfile?.pharmacyName) pharmacyName = pharmProfile.pharmacyName;
      else {
        const pharmUser = await UserModel.findById(pharmacyId);
        if (pharmUser?.name) pharmacyName = pharmUser.name;
      }
    } else {
      throw AppError.badRequest('Pharmacy selection is required to route this prescription order');
    }

    // Prevent duplicate non-terminal order for the same prescription and pharmacy
    const existingOrder = await PharmacyOrderModel.findOne({
      prescriptionId: prescription._id,
      pharmacyId,
      status: { $nin: ['CANCELLED', 'REJECTED'] },
    });

    if (existingOrder) {
      throw AppError.conflict(
        `An active order (${existingOrder.orderNumber}) is already being processed for this prescription at this pharmacy.`
      );
    }

    // Fetch patient details
    const patientUser = (await UserModel.findById(prescription.patientId)) as any;
    const patientName = patientUser?.name || patientUser?.fullName || 'Authorized Patient';
    const patientPhone = patientUser?.phone;

    // Fetch doctor details
    let doctorName = 'Treating Physician';
    if (prescription.doctorId) {
      const docUser = await UserModel.findById(prescription.doctorId);
      if (docUser?.name) doctorName = docUser.name;
    }

    // Map prescription medications to order items preserving doctor dosage instructions
    const items = (prescription.medications || []).map((med: any) => {
      const requestedQuantity = med.quantity || 1;
      const unitPrice = 25; // Standard base price if not pre-assigned
      return {
        prescriptionMedicationId: med._id?.toString() || new Types.ObjectId().toString(),
        medicationCatalogId: med.medicationCatalogId,
        medicationName: med.name,
        genericName: med.genericName,
        brandName: med.brandName,
        strength: med.strength || 'Standard',
        dosageForm: med.dosageForm || 'Tablet',
        quantity: requestedQuantity,
        requestedQuantity,
        fulfilledQuantity: 0,
        remainingQuantity: requestedQuantity,
        fulfillmentStatus: 'UNFULFILLED' as const,
        unitPrice,
        totalPrice: requestedQuantity * unitPrice,
        instructions: med.instructions || `${med.frequency || 'Daily'} - ${med.duration || 'As directed'}`,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // Standard 5% GST on medicines
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;

    // Generate unique order number
    const count = await PharmacyOrderModel.countDocuments({ pharmacyId });
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

    const initialEvent = {
      previousStatus: undefined,
      newStatus: 'PENDING' as PharmacyOrderStatus,
      actorId: new Types.ObjectId(actor.userId),
      actorName: actor.name,
      actorRole: actor.role,
      reason: 'Order created from doctor-issued prescription',
      timestamp: new Date(),
    };

    const order = await PharmacyOrderModel.create({
      orderNumber,
      pharmacyId,
      pharmacyName,
      patientId: prescription.patientId,
      patientName,
      patientPhone,
      prescriptionId: prescription._id,
      prescriptionNumber: prescription.prescriptionNumber,
      doctorId: prescription.doctorId,
      doctorName,
      items,
      subtotal,
      tax,
      discount: 0,
      totalAmount,
      fulfillmentType: dto.fulfillmentType || 'IN_STORE_PICKUP',
      deliveryAddress: dto.deliveryAddress,
      status: 'PENDING',
      notes: dto.notes,
      statusHistory: [initialEvent],
    });

    // In-App Notifications
    await Promise.all([
      NotificationModel.create({
        userId: pharmacyId,
        title: 'New Pharmacy Order Received',
        message: `Order #${orderNumber} for patient ${patientName} has been submitted for prescription #${prescription.prescriptionNumber}.`,
        type: 'PRESCRIPTION',
      }),
      NotificationModel.create({
        userId: prescription.patientId,
        title: 'Order Placed with Pharmacy',
        message: `Your prescription order #${orderNumber} has been received by ${pharmacyName} and is awaiting review.`,
        type: 'PRESCRIPTION',
      }),
    ]);

    // Audit Log
    await this.logAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'PHARMACY_ORDER_CREATED',
      resourceType: 'PharmacyOrder',
      resourceId: order._id.toString(),
      metadata: { orderNumber, prescriptionId: prescription._id.toString() },
    });

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * LIST PHARMACY ORDERS (QUEUE)
   */
  async getPharmacyOrders(
    pharmacyUserId: string,
    filter: OrderFilterDto
  ): Promise<{
    items: PharmacyOrderDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { pharmacyId };

    if (filter.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    if (filter.fulfillmentType) {
      query.fulfillmentType = filter.fulfillmentType;
    }
    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) (query.createdAt as any).$gte = new Date(filter.startDate);
      if (filter.endDate) (query.createdAt as any).$lte = new Date(filter.endDate);
    }
    if (filter.search && filter.search.trim()) {
      const reg = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { orderNumber: reg },
        { patientName: reg },
        { prescriptionNumber: reg },
        { 'items.medicationName': reg },
      ];
    }

    const [orders, total] = await Promise.all([
      PharmacyOrderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PharmacyOrderModel.countDocuments(query),
    ]);

    return {
      items: orders.map((o) => this.mapToPharmacyOrderDto(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * GET PHARMACY ORDER BY ID
   */
  async getPharmacyOrderById(pharmacyUserId: string, orderId: string): Promise<PharmacyOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest('Invalid order ID format');
    }

    const order = await PharmacyOrderModel.findOne({ _id: new Types.ObjectId(orderId), pharmacyId });
    if (!order) {
      throw AppError.notFound('Order not found or you lack permission to view it');
    }

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * ORDER REVIEW WORKFLOW (ACCEPT / REJECT)
   */
  async reviewOrder(
    pharmacyUserId: string,
    orderId: string,
    reviewerName: string,
    dto: OrderReviewDto
  ): Promise<PharmacyOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    if (!Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest('Invalid order ID format');
    }

    const order = await PharmacyOrderModel.findOne({ _id: new Types.ObjectId(orderId), pharmacyId });
    if (!order) {
      throw AppError.notFound('Order not found or you lack permission to review it');
    }

    if (order.status !== 'PENDING' && order.status !== 'UNDER_REVIEW') {
      throw AppError.badRequest(`Order cannot be reviewed in status '${order.status}'`);
    }

    const previousStatus = order.status;

    if (dto.action === 'REJECT') {
      if (!dto.reason || !dto.reason.trim()) {
        throw AppError.badRequest('A clear rejection explanation is required when rejecting an order');
      }

      order.status = 'REJECTED';
      order.rejectionReasonCode = dto.reasonCode || 'OTHER';
      order.rejectionReason = dto.reason.trim();
      order.rejectedAt = new Date();
      order.rejectedBy = pharmacyId;
      order.rejectedByName = reviewerName;

      order.statusHistory.push({
        previousStatus,
        newStatus: 'REJECTED',
        actorId: pharmacyId,
        actorName: reviewerName,
        actorRole: 'PHARMACY',
        reason: `Order rejected: ${dto.reason.trim()}`,
        timestamp: new Date(),
      });

      await order.save();

      // Notify patient
      await NotificationModel.create({
        userId: order.patientId,
        title: 'Order Could Not Be Fulfilled',
        message: `Your pharmacy order #${order.orderNumber} was rejected: ${dto.reason.trim()}. Please consult your doctor or choose another pharmacy.`,
        type: 'PRESCRIPTION',
      });

      await this.logAudit({
        actorId: pharmacyUserId,
        actorRole: 'PHARMACY',
        action: 'PHARMACY_ORDER_REJECTED',
        resourceType: 'PharmacyOrder',
        resourceId: order._id.toString(),
        metadata: { orderNumber: order.orderNumber, reason: dto.reason },
      });

      return this.mapToPharmacyOrderDto(order);
    }

    // ACCEPT ORDER
    this.assertValidTransition(order.status, 'ACCEPTED');
    order.status = 'ACCEPTED';
    if (dto.notes) order.internalOperationalNotes = dto.notes.trim();
    if (dto.estimatedReadiness) order.estimatedReadiness = new Date(dto.estimatedReadiness);

    order.statusHistory.push({
      previousStatus,
      newStatus: 'ACCEPTED',
      actorId: pharmacyId,
      actorName: reviewerName,
      actorRole: 'PHARMACY',
      reason: dto.notes || 'Order reviewed and accepted for fulfillment',
      timestamp: new Date(),
    });

    await order.save();

    // Notify patient
    await NotificationModel.create({
      userId: order.patientId,
      title: 'Order Accepted by Pharmacy',
      message: `Your pharmacy order #${order.orderNumber} has been accepted and scheduled for preparation.`,
      type: 'PRESCRIPTION',
    });

    await this.logAudit({
      actorId: pharmacyUserId,
      actorRole: 'PHARMACY',
      action: 'PHARMACY_ORDER_ACCEPTED',
      resourceType: 'PharmacyOrder',
      resourceId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber },
    });

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * REQUEST CLINICAL CLARIFICATION
   */
  async requestClarification(
    pharmacyUserId: string,
    orderId: string,
    notes: string,
    staffName: string
  ): Promise<PharmacyOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const order = await PharmacyOrderModel.findOne({ _id: new Types.ObjectId(orderId), pharmacyId });
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    order.clarificationRequested = true;
    order.clarificationNotes = notes.trim();
    order.status = 'UNDER_REVIEW';

    order.statusHistory.push({
      previousStatus: order.status,
      newStatus: 'UNDER_REVIEW',
      actorId: pharmacyId,
      actorName: staffName,
      actorRole: 'PHARMACY',
      reason: `Clarification requested: ${notes.trim()}`,
      timestamp: new Date(),
    });

    await order.save();

    // Notify Patient
    await NotificationModel.create({
      userId: order.patientId,
      title: 'Prescription Clarification Required',
      message: `The pharmacy has requested clarification regarding order #${order.orderNumber}: "${notes.trim()}".`,
      type: 'PRESCRIPTION',
    });

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * START PROCESSING ORDER
   */
  async startProcessing(
    pharmacyUserId: string,
    orderId: string,
    staffName: string
  ): Promise<PharmacyOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const order = await PharmacyOrderModel.findOne({ _id: new Types.ObjectId(orderId), pharmacyId });
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    this.assertValidTransition(order.status, 'PROCESSING');
    const previousStatus = order.status;
    order.status = 'PROCESSING';

    order.statusHistory.push({
      previousStatus,
      newStatus: 'PROCESSING',
      actorId: pharmacyId,
      actorName: staffName,
      actorRole: 'PHARMACY',
      reason: 'Pharmacy staff initiated preparation and packaging',
      timestamp: new Date(),
    });

    await order.save();

    await NotificationModel.create({
      userId: order.patientId,
      title: 'Order Processing',
      message: `Your order #${order.orderNumber} is now being packed and prepared by pharmacy staff.`,
      type: 'PRESCRIPTION',
    });

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * LINK FULFILLMENT WITH DISPENSING RECORD
   * Strictly reads existing DispensingRecordModel without secondary stock deductions.
   */
  async updateOrderFulfillment(
    pharmacyUserId: string,
    orderId: string,
    staffName: string,
    dto: OrderFulfillmentUpdateDto
  ): Promise<PharmacyOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const order = await PharmacyOrderModel.findOne({ _id: new Types.ObjectId(orderId), pharmacyId });
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    if (!Types.ObjectId.isValid(dto.dispensingRecordId)) {
      throw AppError.badRequest('Invalid dispensing record ID format');
    }

    const dispensingRecord = await DispensingRecordModel.findOne({
      _id: new Types.ObjectId(dto.dispensingRecordId),
      pharmacyId,
    });

    if (!dispensingRecord) {
      throw AppError.notFound('Dispensing record not found or belongs to another pharmacy');
    }

    // Verify matching prescription
    if (
      order.prescriptionId &&
      dispensingRecord.prescriptionId &&
      !order.prescriptionId.equals(dispensingRecord.prescriptionId)
    ) {
      throw AppError.badRequest('Dispensing record does not correspond to this order prescription');
    }

    // Update fulfillment quantities per item
    dispensingRecord.items.forEach((dispensedItem) => {
      const orderItem = order.items.find(
        (it) =>
          it.prescriptionMedicationId === dispensedItem.prescriptionMedicationId ||
          it.medicationName.toLowerCase() === dispensedItem.medicationName.toLowerCase()
      );

      if (orderItem) {
        orderItem.fulfilledQuantity += dispensedItem.quantityDispensed;
        orderItem.remainingQuantity = Math.max(0, orderItem.requestedQuantity - orderItem.fulfilledQuantity);
        orderItem.batchNumber = dispensedItem.batchNumber;
        orderItem.inventoryId = dispensedItem.inventoryId;
        orderItem.dispensingRecordId = dispensingRecord._id;

        if (orderItem.remainingQuantity === 0) {
          orderItem.fulfillmentStatus = 'FULFILLED';
        } else {
          orderItem.fulfillmentStatus = 'PARTIALLY_FULFILLED';
        }
      }
    });

    // Record dispensing reference
    if (!order.dispensingRecordIds.some((id) => id.equals(dispensingRecord._id))) {
      order.dispensingRecordIds.push(dispensingRecord._id);
    }

    // Determine target order status
    const allItemsFulfilled = order.items.every((it) => it.fulfillmentStatus === 'FULFILLED');
    const targetStatus: PharmacyOrderStatus = allItemsFulfilled ? 'READY_FOR_PICKUP' : 'PARTIALLY_FULFILLED';

    const previousStatus = order.status;
    order.status = targetStatus;

    // If fully fulfilled, automatically generate secure pickup code
    if (allItemsFulfilled) {
      this.generatePickupReferenceOnOrder(order, 'Please present pickup code at the counter.');
    }

    order.statusHistory.push({
      previousStatus,
      newStatus: targetStatus,
      actorId: pharmacyId,
      actorName: staffName,
      actorRole: 'PHARMACY',
      reason: `Fulfillment updated from dispensing record #${dispensingRecord.dispensingNumber}`,
      timestamp: new Date(),
    });

    await order.save();

    // Patient notification
    const notificationMsg = allItemsFulfilled
      ? `All medications for order #${order.orderNumber} have been packed and are ready for collection! Pickup Code: ${order.pickupDetails?.pickupReference}.`
      : `Partially fulfilled order #${order.orderNumber}. Some items were dispensed under #${dispensingRecord.dispensingNumber}.`;

    await NotificationModel.create({
      userId: order.patientId,
      title: allItemsFulfilled ? 'Order Ready for Pickup' : 'Order Partially Fulfilled',
      message: notificationMsg,
      type: 'PRESCRIPTION',
    });

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * MARK ORDER READY FOR PICKUP & GENERATE SECURE PICKUP CODE
   */
  async markReadyForPickup(
    pharmacyUserId: string,
    orderId: string,
    staffName: string,
    instructions?: string
  ): Promise<PharmacyOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const order = await PharmacyOrderModel.findOne({ _id: new Types.ObjectId(orderId), pharmacyId });
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    this.assertValidTransition(order.status, 'READY_FOR_PICKUP');
    const previousStatus = order.status;
    order.status = 'READY_FOR_PICKUP';

    this.generatePickupReferenceOnOrder(order, instructions);

    order.statusHistory.push({
      previousStatus,
      newStatus: 'READY_FOR_PICKUP',
      actorId: pharmacyId,
      actorName: staffName,
      actorRole: 'PHARMACY',
      reason: 'Medications packed and labeled for counter collection',
      timestamp: new Date(),
    });

    await order.save();

    await NotificationModel.create({
      userId: order.patientId,
      title: 'Order Ready for Pickup',
      message: `Your order #${order.orderNumber} is ready for pickup! Your verification code is ${order.pickupDetails?.pickupReference}.`,
      type: 'PRESCRIPTION',
    });

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * VERIFY PICKUP & COMPLETE HANDOVER
   * Verifies SHA-256 hash, attempts limit, expiry and records authorized collection.
   */
  async verifyAndCompletePickup(
    pharmacyUserId: string,
    orderId: string,
    staffId: string,
    staffName: string,
    dto: VerifyPickupDto
  ): Promise<PharmacyOrderDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const order = await PharmacyOrderModel.findOne({ _id: new Types.ObjectId(orderId), pharmacyId });
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    if (order.status !== 'READY_FOR_PICKUP') {
      throw AppError.badRequest(`Cannot perform pickup handover for order in status '${order.status}'`);
    }

    if (!order.pickupDetails) {
      throw AppError.badRequest('Pickup verification details are missing for this order');
    }

    // Check attempt lockout limit
    if (order.pickupDetails.verificationAttempts >= order.pickupDetails.maxAttempts) {
      throw AppError.forbidden(
        'Maximum pickup verification attempts exceeded. Please verify patient identity manually and contact supervisor.'
      );
    }

    // Check expiry
    if (order.pickupDetails.expiresAt && new Date() > order.pickupDetails.expiresAt) {
      throw AppError.badRequest('Pickup verification reference has expired. A new code must be generated.');
    }

    // Hash submitted code and compare
    const submittedCode = dto.pickupCode.trim().toUpperCase();
    const inputHash = crypto.createHash('sha256').update(submittedCode).digest('hex');

    if (inputHash !== order.pickupDetails.pickupCodeHash) {
      order.pickupDetails.verificationAttempts += 1;
      await order.save();
      const attemptsRemaining = order.pickupDetails.maxAttempts - order.pickupDetails.verificationAttempts;
      throw AppError.badRequest(`Invalid pickup verification code. ${attemptsRemaining} attempt(s) remaining.`);
    }

    // Verified successfully
    const previousStatus = order.status;
    order.status = 'COMPLETED';
    order.pickupDetails.isVerified = true;
    order.pickupDetails.verifiedAt = new Date();
    order.pickupDetails.collectedAt = new Date();
    order.pickupDetails.handedOverBy = new Types.ObjectId(staffId);
    order.pickupDetails.handedOverByName = staffName;
    if (dto.handoverNotes) order.pickupDetails.handoverNotes = dto.handoverNotes.trim();

    order.statusHistory.push({
      previousStatus,
      newStatus: 'COMPLETED',
      actorId: new Types.ObjectId(staffId),
      actorName: staffName,
      actorRole: 'PHARMACY',
      reason: 'Pickup code verified and medications handed over to patient',
      timestamp: new Date(),
    });

    await order.save();

    // Patient notification
    await NotificationModel.create({
      userId: order.patientId,
      title: 'Order Handover Completed',
      message: `Your order #${order.orderNumber} was successfully collected. Thank you for using HealthBridge!`,
      type: 'PRESCRIPTION',
    });

    await this.logAudit({
      actorId: staffId,
      actorRole: 'PHARMACY',
      action: 'PHARMACY_ORDER_HANDOVER_COMPLETED',
      resourceType: 'PharmacyOrder',
      resourceId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber, handedOverByName: staffName },
    });

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * CANCEL ORDER
   * Controlled cancellation with state guards and dispensing preservation.
   */
  async cancelOrder(
    actor: { userId: string; role: string; name: string },
    orderId: string,
    dto: CancelOrderDto
  ): Promise<PharmacyOrderDto> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest('Invalid order ID format');
    }

    const order = await PharmacyOrderModel.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    // Role Ownership check
    if (actor.role === 'PHARMACY' && !order.pharmacyId.equals(actor.userId)) {
      throw AppError.notFound('Order not found or you lack permission to cancel it');
    }
    if (actor.role === 'PATIENT' && !order.patientId.equals(actor.userId)) {
      throw AppError.notFound('Order not found or you lack permission to cancel it');
    }

    if (order.status === 'COMPLETED') {
      throw AppError.badRequest('Cannot cancel an order that has already been handed over and completed');
    }
    if (order.status === 'REJECTED' || order.status === 'CANCELLED') {
      throw AppError.badRequest(`Order is already in terminal state '${order.status}'`);
    }

    // Patient can only cancel if not in fulfillment processing
    if (actor.role === 'PATIENT') {
      const patientCancellableStatuses = ['PENDING', 'UNDER_REVIEW', 'ACCEPTED'];
      if (!patientCancellableStatuses.includes(order.status)) {
        throw AppError.badRequest(
          `Cannot cancel order in status '${order.status}'. Please contact the pharmacy directly.`
        );
      }
    }

    const previousStatus = order.status;
    order.status = 'CANCELLED';
    order.cancellationReason = dto.reason.trim();
    order.cancelledAt = new Date();
    order.cancelledBy = new Types.ObjectId(actor.userId);
    order.cancelledByName = actor.name;

    order.statusHistory.push({
      previousStatus,
      newStatus: 'CANCELLED',
      actorId: new Types.ObjectId(actor.userId),
      actorName: actor.name,
      actorRole: actor.role,
      reason: `Order cancelled by ${actor.role}: ${dto.reason.trim()}`,
      timestamp: new Date(),
    });

    await order.save();

    // Notify the other party
    const notifyUserId = actor.role === 'PATIENT' ? order.pharmacyId : order.patientId;
    await NotificationModel.create({
      userId: notifyUserId,
      title: 'Pharmacy Order Cancelled',
      message: `Order #${order.orderNumber} was cancelled by ${actor.name}: ${dto.reason.trim()}.`,
      type: 'PRESCRIPTION',
    });

    await this.logAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'PHARMACY_ORDER_CANCELLED',
      resourceType: 'PharmacyOrder',
      resourceId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber, reason: dto.reason },
    });

    return this.mapToPharmacyOrderDto(order);
  }

  /**
   * PATIENT-SIDE: LIST ORDERS
   */
  async getPatientOrders(
    patientUserId: string,
    filter: OrderFilterDto
  ): Promise<{
    items: PharmacyOrderDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const patientId = new Types.ObjectId(patientUserId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { patientId };
    if (filter.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    if (filter.search && filter.search.trim()) {
      const reg = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ orderNumber: reg }, { pharmacyName: reg }, { prescriptionNumber: reg }];
    }

    const [orders, total] = await Promise.all([
      PharmacyOrderModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PharmacyOrderModel.countDocuments(query),
    ]);

    return {
      items: orders.map((o) => this.mapToPatientOrderDto(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * PATIENT-SIDE: GET ORDER BY ID
   */
  async getPatientOrderById(patientUserId: string, orderId: string): Promise<PharmacyOrderDto> {
    const patientId = new Types.ObjectId(patientUserId);
    if (!Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest('Invalid order ID format');
    }

    const order = await PharmacyOrderModel.findOne({ _id: new Types.ObjectId(orderId), patientId });
    if (!order) {
      throw AppError.notFound('Order not found or you lack permission to view it');
    }

    return this.mapToPatientOrderDto(order);
  }

  /**
   * GET ORDER TIMELINE
   */
  async getOrderTimeline(
    userId: string,
    userRole: string,
    orderId: string
  ): Promise<OrderStatusEventDto[]> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw AppError.badRequest('Invalid order ID format');
    }

    const order = await PharmacyOrderModel.findById(orderId);
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    if (userRole === 'PHARMACY' && !order.pharmacyId.equals(userId)) {
      throw AppError.notFound('Order not found');
    }
    if (userRole === 'PATIENT' && !order.patientId.equals(userId)) {
      throw AppError.notFound('Order not found');
    }

    return (order.statusHistory || []).map((e) => ({
      id: e._id?.toString(),
      previousStatus: e.previousStatus,
      newStatus: e.newStatus,
      actorId: e.actorId?.toString(),
      actorName: e.actorName,
      actorRole: e.actorRole,
      reason: e.reason,
      timestamp: toIsoSafe(e.timestamp),
    }));
  }

  /**
   * ORDER FULFILLMENT ANALYTICS
   */
  async getOrderAnalytics(pharmacyUserId: string): Promise<PharmacyOrderMetricsDto> {
    const pharmacyId = new Types.ObjectId(pharmacyUserId);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingCount,
      underReviewCount,
      acceptedCount,
      processingCount,
      partiallyFulfilledCount,
      readyForPickupCount,
      completedOrders,
      rejectedCount,
      cancelledCount,
      todayOrders,
    ] = await Promise.all([
      PharmacyOrderModel.countDocuments({ pharmacyId }),
      PharmacyOrderModel.countDocuments({ pharmacyId, status: 'PENDING' }),
      PharmacyOrderModel.countDocuments({ pharmacyId, status: 'UNDER_REVIEW' }),
      PharmacyOrderModel.countDocuments({ pharmacyId, status: 'ACCEPTED' }),
      PharmacyOrderModel.countDocuments({ pharmacyId, status: 'PROCESSING' }),
      PharmacyOrderModel.countDocuments({ pharmacyId, status: 'PARTIALLY_FULFILLED' }),
      PharmacyOrderModel.countDocuments({ pharmacyId, status: 'READY_FOR_PICKUP' }),
      PharmacyOrderModel.find({ pharmacyId, status: 'COMPLETED' }),
      PharmacyOrderModel.countDocuments({ pharmacyId, status: 'REJECTED' }),
      PharmacyOrderModel.countDocuments({ pharmacyId, status: 'CANCELLED' }),
      PharmacyOrderModel.find({ pharmacyId, createdAt: { $gte: startOfToday } }),
    ]);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Calculate average turnaround hours for completed orders
    let totalProcessingHours = 0;
    let completedWithHistory = 0;

    completedOrders.forEach((ord) => {
      const createdTime = ord.createdAt?.getTime();
      const completedTime = ord.pickupDetails?.collectedAt?.getTime() || ord.updatedAt?.getTime();
      if (createdTime && completedTime && completedTime > createdTime) {
        totalProcessingHours += (completedTime - createdTime) / (1000 * 60 * 60);
        completedWithHistory += 1;
      }
    });

    const averageProcessingTimeHours =
      completedWithHistory > 0 ? Math.round((totalProcessingHours / completedWithHistory) * 10) / 10 : 2.5;

    const statusDistribution: Array<{ status: PharmacyOrderStatus; count: number }> = [
      { status: 'PENDING', count: pendingCount },
      { status: 'UNDER_REVIEW', count: underReviewCount },
      { status: 'ACCEPTED', count: acceptedCount },
      { status: 'PROCESSING', count: processingCount },
      { status: 'PARTIALLY_FULFILLED', count: partiallyFulfilledCount },
      { status: 'READY_FOR_PICKUP', count: readyForPickupCount },
      { status: 'COMPLETED', count: completedOrders.length },
      { status: 'REJECTED', count: rejectedCount },
      { status: 'CANCELLED', count: cancelledCount },
    ];

    return {
      totalOrders,
      pendingCount,
      underReviewCount,
      acceptedCount,
      processingCount,
      partiallyFulfilledCount,
      readyForPickupCount,
      completedCount: completedOrders.length,
      rejectedCount,
      cancelledCount,
      todayOrdersCount: todayOrders.length,
      todayRevenue,
      averageProcessingTimeHours,
      statusDistribution,
      dailyVolume: [
        { date: startOfToday.toISOString().slice(0, 10), count: todayOrders.length, amount: todayRevenue },
      ],
    };
  }

  /**
   * PRIVATE HELPER: Assert valid state transition
   */
  private assertValidTransition(current: PharmacyOrderStatus, target: PharmacyOrderStatus): void {
    const allowed = VALID_STATE_TRANSITIONS[current] || [];
    if (!allowed.includes(target)) {
      throw AppError.badRequest(
        `Invalid order status transition from '${current}' to '${target}'. Allowed transitions: ${allowed.join(', ') || 'None (Terminal state)'}`
      );
    }
  }

  /**
   * PRIVATE HELPER: Generate secure random pickup reference
   */
  private generatePickupReferenceOnOrder(order: IPharmacyOrderDocument, instructions?: string): void {
    const rawCode = `PKUP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const pickupCodeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

    order.pickupDetails = {
      pickupReference: rawCode,
      pickupCodeHash,
      pickupInstructions: instructions || 'Present this pickup code at the counter along with a valid ID.',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      verificationAttempts: 0,
      maxAttempts: 5,
      isVerified: false,
    };
  }

  /**
   * PRIVATE HELPER: Audit logging
   */
  private async logAudit(params: {
    actorId: string;
    actorRole: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLogModel.create({
        userId: new Types.ObjectId(params.actorId),
        userRole: params.actorRole,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: params.metadata,
        timestamp: new Date(),
      });
    } catch {
      // Do not fail request on audit write error
    }
  }

  /**
   * DTO MAPPERS
   */
  private mapToPharmacyOrderDto(doc: IPharmacyOrderDocument): PharmacyOrderDto {
    return {
      id: doc._id.toString(),
      orderNumber: doc.orderNumber,
      pharmacyId: doc.pharmacyId.toString(),
      pharmacyName: doc.pharmacyName,
      patientId: doc.patientId.toString(),
      patientName: doc.patientName || 'Patient',
      patientPhone: doc.patientPhone,
      prescriptionId: doc.prescriptionId?.toString(),
      prescriptionNumber: doc.prescriptionNumber,
      doctorId: doc.doctorId?.toString(),
      doctorName: doc.doctorName,
      facilityId: doc.facilityId?.toString(),
      facilityName: doc.facilityName,
      items: (doc.items || []).map((it) => this.mapOrderItem(it)),
      subtotal: doc.subtotal,
      tax: doc.tax,
      discount: doc.discount,
      totalAmount: doc.totalAmount,
      fulfillmentType: doc.fulfillmentType,
      deliveryAddress: doc.deliveryAddress,
      status: doc.status,
      notes: doc.notes,
      internalOperationalNotes: doc.internalOperationalNotes,
      clarificationRequested: doc.clarificationRequested,
      clarificationNotes: doc.clarificationNotes,
      rejectionReason: doc.rejectionReason,
      rejectionReasonCode: doc.rejectionReasonCode,
      rejectedAt: toIsoSafe(doc.rejectedAt),
      rejectedByName: doc.rejectedByName,
      cancellationReason: doc.cancellationReason,
      cancelledAt: toIsoSafe(doc.cancelledAt),
      cancelledByName: doc.cancelledByName,
      statusHistory: (doc.statusHistory || []).map((e) => ({
        id: e._id?.toString(),
        previousStatus: e.previousStatus,
        newStatus: e.newStatus,
        actorId: e.actorId?.toString(),
        actorName: e.actorName,
        actorRole: e.actorRole,
        reason: e.reason,
        timestamp: toIsoSafe(e.timestamp),
      })),
      pickupDetails: doc.pickupDetails
        ? {
            pickupReference: doc.pickupDetails.isVerified ? doc.pickupDetails.pickupReference : undefined,
            pickupInstructions: doc.pickupDetails.pickupInstructions,
            expiresAt: toIsoSafe(doc.pickupDetails.expiresAt),
            verificationAttempts: doc.pickupDetails.verificationAttempts,
            maxAttempts: doc.pickupDetails.maxAttempts,
            isVerified: doc.pickupDetails.isVerified,
            verifiedAt: toIsoSafe(doc.pickupDetails.verifiedAt),
            handedOverBy: doc.pickupDetails.handedOverBy?.toString(),
            handedOverByName: doc.pickupDetails.handedOverByName,
            collectedAt: toIsoSafe(doc.pickupDetails.collectedAt),
            handoverNotes: doc.pickupDetails.handoverNotes,
          }
        : undefined,
      dispensingRecordIds: (doc.dispensingRecordIds || []).map((id) => id.toString()),
      estimatedReadiness: toIsoSafe(doc.estimatedReadiness),
      createdAt: toIsoSafe(doc.createdAt),
      updatedAt: toIsoSafe(doc.updatedAt),
    };
  }

  private mapToPatientOrderDto(doc: IPharmacyOrderDocument): PharmacyOrderDto {
    return {
      id: doc._id.toString(),
      orderNumber: doc.orderNumber,
      pharmacyId: doc.pharmacyId.toString(),
      pharmacyName: doc.pharmacyName,
      patientId: doc.patientId.toString(),
      patientName: doc.patientName || 'Patient',
      patientPhone: doc.patientPhone,
      prescriptionId: doc.prescriptionId?.toString(),
      prescriptionNumber: doc.prescriptionNumber,
      doctorId: doc.doctorId?.toString(),
      doctorName: doc.doctorName,
      facilityId: doc.facilityId?.toString(),
      facilityName: doc.facilityName,
      items: (doc.items || []).map((it) => this.mapOrderItem(it)),
      subtotal: doc.subtotal,
      tax: doc.tax,
      discount: doc.discount,
      totalAmount: doc.totalAmount,
      fulfillmentType: doc.fulfillmentType,
      deliveryAddress: doc.deliveryAddress,
      status: doc.status,
      notes: doc.notes,
      // PRIVACY ENFORCEMENT: Internal operational notes are hidden from patients
      internalOperationalNotes: undefined,
      clarificationRequested: doc.clarificationRequested,
      clarificationNotes: doc.clarificationNotes,
      rejectionReason: doc.rejectionReason,
      rejectionReasonCode: doc.rejectionReasonCode,
      rejectedAt: toIsoSafe(doc.rejectedAt),
      rejectedByName: doc.rejectedByName,
      cancellationReason: doc.cancellationReason,
      cancelledAt: toIsoSafe(doc.cancelledAt),
      cancelledByName: doc.cancelledByName,
      statusHistory: (doc.statusHistory || []).map((e) => ({
        id: e._id?.toString(),
        previousStatus: e.previousStatus,
        newStatus: e.newStatus,
        actorId: e.actorId?.toString(),
        actorName: e.actorName,
        actorRole: e.actorRole,
        reason: e.reason,
        timestamp: toIsoSafe(e.timestamp),
      })),
      pickupDetails: doc.pickupDetails
        ? {
            // Patient CAN see their own pickupReference when ready for pickup
            pickupReference:
              doc.status === 'READY_FOR_PICKUP' || doc.pickupDetails.isVerified
                ? doc.pickupDetails.pickupReference
                : undefined,
            pickupInstructions: doc.pickupDetails.pickupInstructions,
            expiresAt: toIsoSafe(doc.pickupDetails.expiresAt),
            isVerified: doc.pickupDetails.isVerified,
            verifiedAt: toIsoSafe(doc.pickupDetails.verifiedAt),
            collectedAt: toIsoSafe(doc.pickupDetails.collectedAt),
          }
        : undefined,
      dispensingRecordIds: (doc.dispensingRecordIds || []).map((id) => id.toString()),
      estimatedReadiness: toIsoSafe(doc.estimatedReadiness),
      createdAt: toIsoSafe(doc.createdAt),
      updatedAt: toIsoSafe(doc.updatedAt),
    };
  }

  private mapOrderItem(it: any): PharmacyOrderItemDto {
    return {
      id: it._id?.toString(),
      prescriptionMedicationId: it.prescriptionMedicationId,
      inventoryId: it.inventoryId?.toString(),
      medicationCatalogId: it.medicationCatalogId?.toString(),
      medicationName: it.medicationName,
      genericName: it.genericName,
      brandName: it.brandName,
      strength: it.strength,
      dosageForm: it.dosageForm,
      quantity: it.quantity,
      requestedQuantity: it.requestedQuantity || it.quantity,
      fulfilledQuantity: it.fulfilledQuantity || 0,
      remainingQuantity: it.remainingQuantity !== undefined ? it.remainingQuantity : it.quantity,
      fulfillmentStatus: it.fulfillmentStatus || 'UNFULFILLED',
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
      batchNumber: it.batchNumber,
      dispensingRecordId: it.dispensingRecordId?.toString(),
      instructions: it.instructions,
    };
  }
}

export const orderFulfillmentService = new OrderFulfillmentService();
