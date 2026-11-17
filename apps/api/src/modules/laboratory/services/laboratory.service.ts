/**
 * HealthBridge India — Laboratory Portal Service
 * Production LIMS architecture implementing Laboratory Profile, Test Catalogue,
 * Order Review, Test Assignment, Specimen Resolution, Sample Collection,
 * Barcode Generation, Accessioning, Rejection, and Collection Centers.
 */

import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  LaboratoryProfileModel,
  ILaboratoryProfileDocument,
} from '../../users/models/laboratory-profile.model';
import { LaboratoryStaffModel } from '../models/laboratory-staff.model';
import { LabTestModel } from '../models/lab-test.model';
import { LaboratoryOrderModel } from '../../healthcare/models/lab-order.model';
import { LabSampleModel } from '../models/lab-sample.model';
import { CollectionCenterModel } from '../models/collection-center.model';
import { UserModel } from '../../users/models/user.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { notificationService } from '../../notifications/services/notification.service';
import { AppError } from '../../../shared/errors/app-error';
import type {
  UpdateLaboratoryProfileDto,
  UploadLaboratoryDocumentDto,
  CreateLabTestDto,
  UpdateLabTestDto,
  LabTestFilterDto,
  AcceptLabOrderDto,
  RejectLabOrderDto,
  ClarificationLabOrderDto,
  AssignTestDto,
  LaboratoryOrderFilterDto,
  RegisterSampleCollectionDto,
  SampleAccessioningDto,
  SampleRejectionDto,
  LabSampleFilterDto,
  CollectionCenterDto,
  LaboratoryDashboardSummaryDto,
  PrintableSampleLabelDto,
} from '@healthbridge/shared-types';

export class LaboratoryService {
  // ===========================================================================
  // 1. HELPER: RESOLVE LABORATORY PROFILE
  // ===========================================================================

  /**
   * Resolves the authenticated laboratory profile by user ID.
   * Throws 404 if not found.
   */
  async resolveLaboratoryProfile(userId: string): Promise<ILaboratoryProfileDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const profile = await LaboratoryProfileModel.findOne({
      userId: userObjectId,
    });

    if (profile) return profile;

    // Check if user is an active staff member of a laboratory
    const staff = await LaboratoryStaffModel.findOne({
      userId: userObjectId,
      status: 'ACTIVE',
    });
    if (staff) {
      const staffLab = await LaboratoryProfileModel.findById(staff.laboratoryId);
      if (staffLab) return staffLab;
    }

    throw AppError.notFound('Laboratory profile not found for authenticated user');
  }

  // ===========================================================================
  // 2. LABORATORY PROFILE & REGISTRATION MANAGEMENT
  // ===========================================================================

  /**
   * Retrieves full laboratory profile including licensing and documents.
   */
  async getProfile(userId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);
    return profile.toJSON();
  }

  /**
   * Updates permitted laboratory profile fields.
   * Enforces STRICT ZERO SELF-APPROVAL INVARIANT.
   */
  async updateProfile(userId: string, dto: UpdateLaboratoryProfileDto) {
    // Defense-in-depth: Reject any attempt to modify statutory verification status directly
    if (
      (dto as any).verificationStatus !== undefined ||
      (dto as any).documentSubmissionStatus !== undefined
    ) {
      throw AppError.forbidden(
        'Self-approval or manual tampering with statutory verification status is strictly prohibited'
      );
    }

    const profile = await this.resolveLaboratoryProfile(userId);

    if (dto.laboratoryName) profile.laboratoryName = dto.laboratoryName;
    if (dto.description !== undefined) profile.description = dto.description;
    if (dto.logo !== undefined) profile.logo = dto.logo;
    if (dto.contactEmail !== undefined) profile.contactEmail = dto.contactEmail;
    if (dto.contactPhone) profile.contactPhone = dto.contactPhone;
    if (dto.websiteUrl !== undefined) profile.websiteUrl = dto.websiteUrl;

    if (dto.address) {
      profile.address = {
        street: dto.address.street ?? profile.address.street,
        city: dto.address.city ?? profile.address.city,
        state: dto.address.state ?? profile.address.state,
        postalCode: dto.address.postalCode ?? profile.address.postalCode,
        country: dto.address.country ?? profile.address.country,
        coordinates: dto.address.coordinates ?? profile.address.coordinates,
      };
    }

    if (dto.registrationNumber !== undefined) profile.registrationNumber = dto.registrationNumber;
    if (dto.licenseIssueDate) profile.licenseIssueDate = new Date(dto.licenseIssueDate);
    if (dto.licenseExpiryDate) profile.licenseExpiryDate = new Date(dto.licenseExpiryDate);
    if (dto.issuingAuthority !== undefined) profile.issuingAuthority = dto.issuingAuthority;

    if (dto.accreditationInfo) {
      profile.accreditationInfo = {
        nablAccredited: dto.accreditationInfo.nablAccredited ?? profile.accreditationInfo?.nablAccredited ?? false,
        nablCertificateNumber: dto.accreditationInfo.nablCertificateNumber ?? profile.accreditationInfo?.nablCertificateNumber,
        nablExpiryDate: dto.accreditationInfo.nablExpiryDate ? new Date(dto.accreditationInfo.nablExpiryDate) : profile.accreditationInfo?.nablExpiryDate,
        capAccredited: dto.accreditationInfo.capAccredited ?? profile.accreditationInfo?.capAccredited ?? false,
        icmrApproved: dto.accreditationInfo.icmrApproved ?? profile.accreditationInfo?.icmrApproved ?? false,
        isoCertified: dto.accreditationInfo.isoCertified ?? profile.accreditationInfo?.isoCertified ?? false,
      };
    }

    if (dto.facilityName) profile.facilityName = dto.facilityName;
    if (dto.facilityType) profile.facilityType = dto.facilityType;
    if (dto.supportedDiagnosticServices) profile.supportedDiagnosticServices = dto.supportedDiagnosticServices;
    if (dto.operatingHours) profile.operatingHours = dto.operatingHours as any;
    if (dto.collectionCenterDetails) profile.collectionCenterDetails = dto.collectionCenterDetails as any;

    await profile.save();

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LABORATORY_PROFILE_UPDATED',
      resourceType: 'LaboratoryProfile',
      resourceId: profile._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: { laboratoryName: profile.laboratoryName },
    });

    return profile.toJSON();
  }

  /**
   * Retrieves current statutory verification and document submission status.
   */
  async getVerificationStatus(userId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);
    return {
      verificationStatus: profile.verificationStatus,
      documentSubmissionStatus: profile.documentSubmissionStatus,
      laboratoryLicenseNumber: profile.laboratoryLicenseNumber,
      accreditationInfo: profile.accreditationInfo,
      documentsCount: profile.documents?.length || 0,
    };
  }

  /**
   * Uploads statutory licensing or accreditation verification document.
   */
  async uploadDocument(userId: string, dto: UploadLaboratoryDocumentDto) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const documentId = crypto.randomUUID();
    const newDoc = {
      documentId,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      documentUrl: dto.documentUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      uploadedAt: new Date(),
      verificationStatus: 'PENDING' as const,
    };

    profile.documents.push(newDoc as any);
    profile.documentSubmissionStatus = 'SUBMITTED';
    await profile.save();

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LABORATORY_DOCUMENT_UPLOADED',
      resourceType: 'LaboratoryDocument',
      resourceId: documentId,
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: { documentType: dto.documentType, documentNumber: dto.documentNumber },
    });

    return newDoc;
  }

  /**
   * Deletes a submitted statutory document.
   */
  async deleteDocument(userId: string, documentId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const docIndex = profile.documents.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) {
      throw AppError.notFound('Statutory document not found');
    }

    profile.documents.splice(docIndex, 1);
    if (profile.documents.length === 0) {
      profile.documentSubmissionStatus = 'NOT_SUBMITTED';
    }
    await profile.save();

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LABORATORY_DOCUMENT_DELETED',
      resourceType: 'LaboratoryDocument',
      resourceId: documentId,
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
    });

    return { message: 'Statutory document removed successfully' };
  }

  // ===========================================================================
  // 3. DIAGNOSTIC TEST CATALOGUE MANAGEMENT
  // ===========================================================================

  /**
   * Creates a new diagnostic test in the laboratory catalogue.
   * Enforces scoped uniqueness on { laboratoryId, testCode }.
   */
  async createTest(userId: string, dto: CreateLabTestDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const upperCode = dto.testCode.trim().toUpperCase();

    const existing = await LabTestModel.findOne({
      laboratoryId: profile._id,
      testCode: upperCode,
    });

    if (existing) {
      throw AppError.conflict(
        `A diagnostic test with code '${upperCode}' already exists in your catalogue`
      );
    }

    const test = await LabTestModel.create({
      ...dto,
      testCode: upperCode,
      laboratoryId: profile._id,
      facilityId: profile.facilityId,
    });

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LAB_TEST_CREATED',
      resourceType: 'LabTest',
      resourceId: test._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: { testCode: upperCode, testName: dto.testName },
    });

    return test.toJSON();
  }

  /**
   * Lists diagnostic tests for the authenticated laboratory with filters & pagination.
   */
  async listTests(userId: string, filter: LabTestFilterDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const query: any = { laboratoryId: profile._id };

    if (filter.search) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ testName: regex }, { testCode: regex }, { description: regex }];
    }

    if (filter.category) {
      query.category = filter.category;
    }

    if (filter.specimenType) {
      query.specimenType = filter.specimenType;
    }

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    const sortField = filter.sortBy || 'testName';
    const sortOrder = filter.sortOrder === 'desc' ? -1 : 1;

    const [items, total] = await Promise.all([
      LabTestModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      LabTestModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single diagnostic test details.
   */
  async getTestById(userId: string, testId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const test = await LabTestModel.findOne({
      _id: testId,
      laboratoryId: profile._id,
    });

    if (!test) {
      throw AppError.notFound('Diagnostic test not found in laboratory catalogue');
    }

    return test.toJSON();
  }

  /**
   * Updates diagnostic test information.
   */
  async updateTest(userId: string, testId: string, dto: UpdateLabTestDto) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const test = await LabTestModel.findOne({
      _id: testId,
      laboratoryId: profile._id,
    });

    if (!test) {
      throw AppError.notFound('Diagnostic test not found in laboratory catalogue');
    }

    if (dto.testName) test.testName = dto.testName;
    if (dto.category) test.category = dto.category;
    if (dto.description !== undefined) test.description = dto.description;
    if (dto.specimenType) test.specimenType = dto.specimenType;
    if (dto.collectionMethod !== undefined) test.collectionMethod = dto.collectionMethod;
    if (dto.preparationInstructions !== undefined) test.preparationInstructions = dto.preparationInstructions;
    if (dto.containerRequirements !== undefined) test.containerRequirements = dto.containerRequirements;
    if (dto.fastingRequirement !== undefined) test.fastingRequirement = dto.fastingRequirement;
    if (dto.fastingDurationHours !== undefined) test.fastingDurationHours = dto.fastingDurationHours;
    if (dto.expectedTurnaroundTime) test.expectedTurnaroundTime = dto.expectedTurnaroundTime;
    if (dto.price !== undefined) test.price = dto.price;
    if (dto.isActive !== undefined) test.isActive = dto.isActive;
    if (dto.performingDepartment !== undefined) test.performingDepartment = dto.performingDepartment;
    if (dto.parameters) test.parameters = dto.parameters as any;
    if (dto.referenceRanges) test.referenceRanges = dto.referenceRanges as any;

    await test.save();

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LAB_TEST_UPDATED',
      resourceType: 'LabTest',
      resourceId: test._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: { testCode: test.testCode },
    });

    return test.toJSON();
  }

  /**
   * Toggles active/inactive availability of a diagnostic test.
   */
  async toggleTestStatus(userId: string, testId: string, isActive?: boolean) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const test = await LabTestModel.findOne({
      _id: testId,
      laboratoryId: profile._id,
    });

    if (!test) {
      throw AppError.notFound('Diagnostic test not found');
    }

    test.isActive = isActive !== undefined ? isActive : !test.isActive;
    await test.save();

    return test.toJSON();
  }

  /**
   * Deletes a diagnostic test from the catalogue.
   */
  async deleteTest(userId: string, testId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const result = await LabTestModel.deleteOne({
      _id: testId,
      laboratoryId: profile._id,
    });

    if (result.deletedCount === 0) {
      throw AppError.notFound('Diagnostic test not found in catalogue');
    }

    return { message: 'Diagnostic test deleted successfully' };
  }

  // ===========================================================================
  // 4. LABORATORY ORDER REVIEW & TEST ASSIGNMENT WORKFLOW
  // ===========================================================================

  /**
   * Lists diagnostic orders assigned or accessible to this laboratory.
   */
  async listOrders(userId: string, filter: LaboratoryOrderFilterDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    // Accessible orders: assigned to laboratory user ID or laboratory profile ID, or facility-associated
    const labIds = [profile.userId, profile._id];
    const query: any = {
      $or: [
        { laboratoryId: { $in: labIds } },
        { laboratoryId: null, facilityId: profile.facilityId },
      ],
    };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.priority) {
      query.priority = filter.priority;
    }

    if (filter.search) {
      query.orderNumber = new RegExp(filter.search.trim(), 'i');
    }

    if (filter.startDate || filter.endDate) {
      query.orderedAt = {};
      if (filter.startDate) query.orderedAt.$gte = new Date(filter.startDate);
      if (filter.endDate) query.orderedAt.$lte = new Date(filter.endDate);
    }

    const sortField = filter.sortBy || 'orderedAt';
    const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;

    const [orders, total] = await Promise.all([
      LaboratoryOrderModel.find(query)
        .populate('patientId', 'name phone abhaAddress')
        .populate('orderedBy', 'name phone')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      LaboratoryOrderModel.countDocuments(query),
    ]);

    const formattedItems = orders.map((order: any) => ({
      ...order,
      id: order._id.toString(),
      patient: order.patientId
        ? {
            id: order.patientId._id?.toString(),
            name: order.patientId.name || 'Patient',
            phone: order.patientId.phone,
            abhaAddress: order.patientId.abhaAddress,
          }
        : undefined,
      doctor: order.orderedBy
        ? {
            id: order.orderedBy._id?.toString(),
            name: order.orderedBy.name
              ? (order.orderedBy.name.startsWith('Dr.') ? order.orderedBy.name : `Dr. ${order.orderedBy.name}`)
              : 'Doctor',
            phone: order.orderedBy.phone,
          }
        : undefined,
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single laboratory order with restricted patient clinical context.
   */
  async getOrderById(userId: string, orderId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const labIds = [profile.userId.toString(), profile._id.toString()];

    const order = await LaboratoryOrderModel.findById(orderId)
      .populate('patientId', 'name phone abhaAddress')
      .populate('orderedBy', 'name phone')
      .lean();

    if (!order) {
      throw AppError.notFound('Laboratory order not found');
    }

    // Validate access authorization: must be assigned to this laboratory
    if (order.laboratoryId && !labIds.includes(order.laboratoryId.toString())) {
      throw AppError.forbidden('Access forbidden: Order is assigned to another laboratory');
    }

    return {
      ...order,
      id: order._id.toString(),
      patient: (order as any).patientId
        ? {
            id: (order as any).patientId._id?.toString(),
            name: (order as any).patientId.name || 'Patient',
            phone: (order as any).patientId.phone,
            abhaAddress: (order as any).patientId.abhaAddress,
          }
        : undefined,
      doctor: (order as any).orderedBy
        ? {
            id: (order as any).orderedBy._id?.toString(),
            name: (order as any).orderedBy.name
              ? ((order as any).orderedBy.name.startsWith('Dr.') ? (order as any).orderedBy.name : `Dr. ${(order as any).orderedBy.name}`)
              : 'Doctor',
            phone: (order as any).orderedBy.phone,
          }
        : undefined,
    };
  }

  /**
   * Accepts a laboratory order after clinical & operational review.
   */
  async acceptOrder(userId: string, orderId: string, dto?: AcceptLabOrderDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const labIds = [profile.userId.toString(), profile._id.toString()];

    const order = await LaboratoryOrderModel.findById(orderId);
    if (!order) {
      throw AppError.notFound('Laboratory order not found');
    }

    if (order.laboratoryId && !labIds.includes(order.laboratoryId.toString())) {
      throw AppError.forbidden('Access forbidden: Order belongs to another laboratory');
    }

    if (order.status === 'CANCELLED' || order.status === 'COMPLETED') {
      throw AppError.badRequest(
        `Cannot accept order in terminal state: ${order.status}`
      );
    }

    if (order.status === 'REJECTED') {
      throw AppError.badRequest('Cannot accept a previously rejected laboratory order');
    }

    const previousStatus = order.status;
    order.status = 'ACCEPTED';
    order.laboratoryId = profile.userId;
    order.acceptedAt = new Date();

    // Initialize test assignments for all requested tests if not present
    if (!order.testAssignments || order.testAssignments.length === 0) {
      order.testAssignments = order.tests.map((t) => ({
        testCode: t.testCode,
        testName: t.testName,
        specimenType: (t.specimenType as any) || 'BLOOD',
        status: 'PENDING' as const,
        priority: order.priority || 'ROUTINE',
      })) as any;
    }

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: 'ACCEPTED',
      changedBy: new Types.ObjectId(userId),
      changedByName: profile.laboratoryName,
      timestamp: new Date(),
      reason: dto?.notes || 'Order reviewed and accepted by laboratory',
    });

    await order.save();

    // Audit Logging
    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LAB_ORDER_ACCEPTED',
      resourceType: 'LaboratoryOrder',
      resourceId: order._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: { orderNumber: order.orderNumber, previousStatus },
    });

    // Privacy-safe notifications
    try {
      await Promise.all([
        notificationService.publishEvent({
          recipientId: order.patientId.toString(),
          recipientRole: 'PATIENT',
          category: 'LAB',
          eventType: 'LAB_ORDER_ACCEPTED',
          title: 'Diagnostic Order Accepted',
          message: `Your diagnostic test order #${order.orderNumber} has been accepted by ${profile.laboratoryName}.`,
          priority: 'MEDIUM',
          relatedEntity: {
            entityType: 'LAB_ORDER',
            entityId: order._id.toString(),
            referenceNumber: order.orderNumber,
          },
          linkUrl: '/patient/lab-orders',
        }),
        notificationService.publishEvent({
          recipientId: order.orderedBy.toString(),
          recipientRole: 'DOCTOR',
          category: 'LAB',
          eventType: 'LAB_ORDER_ACCEPTED',
          title: 'Laboratory Accepted Test Order',
          message: `Order #${order.orderNumber} has been accepted by ${profile.laboratoryName}.`,
          priority: 'LOW',
          relatedEntity: {
            entityType: 'LAB_ORDER',
            entityId: order._id.toString(),
            referenceNumber: order.orderNumber,
          },
          linkUrl: '/doctor/lab-orders',
        }),
      ]);
    } catch {
      // Notification failure must not block the transactional operation
    }

    return order.toJSON();
  }

  /**
   * Rejects a laboratory order with mandatory reason code & explanation.
   */
  async rejectOrder(userId: string, orderId: string, dto: RejectLabOrderDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const labIds = [profile.userId.toString(), profile._id.toString()];

    const order = await LaboratoryOrderModel.findById(orderId);
    if (!order) {
      throw AppError.notFound('Laboratory order not found');
    }

    if (order.laboratoryId && !labIds.includes(order.laboratoryId.toString())) {
      throw AppError.forbidden('Access forbidden: Order belongs to another laboratory');
    }

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw AppError.badRequest(`Cannot reject order in ${order.status} state`);
    }

    const previousStatus = order.status;
    order.status = 'REJECTED';
    order.rejectionReasonCode = dto.reasonCode;
    order.rejectionReason = dto.reason;

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: 'REJECTED',
      changedBy: new Types.ObjectId(userId),
      changedByName: profile.laboratoryName,
      timestamp: new Date(),
      reason: `[${dto.reasonCode}] ${dto.reason}`,
    });

    await order.save();

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LAB_ORDER_REJECTED',
      resourceType: 'LaboratoryOrder',
      resourceId: order._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: {
        orderNumber: order.orderNumber,
        previousStatus,
        reasonCode: dto.reasonCode,
      },
    });

    try {
      await notificationService.publishEvent({
        recipientId: order.orderedBy.toString(),
        recipientRole: 'DOCTOR',
        category: 'LAB',
        eventType: 'LAB_ORDER_REJECTED',
        title: 'Laboratory Order Rejected',
        message: `Order #${order.orderNumber} was rejected by ${profile.laboratoryName}: ${dto.reason}`,
        priority: 'HIGH',
        relatedEntity: {
          entityType: 'LAB_ORDER',
          entityId: order._id.toString(),
          referenceNumber: order.orderNumber,
        },
        linkUrl: '/doctor/lab-orders',
      });
    } catch {
      // Ignore notification failures
    }

    return order.toJSON();
  }

  /**
   * Requests clinical or operational clarification for a laboratory order.
   */
  async requestClarification(userId: string, orderId: string, dto: ClarificationLabOrderDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const labIds = [profile.userId.toString(), profile._id.toString()];

    const order = await LaboratoryOrderModel.findById(orderId);
    if (!order) {
      throw AppError.notFound('Laboratory order not found');
    }

    if (order.laboratoryId && !labIds.includes(order.laboratoryId.toString())) {
      throw AppError.forbidden('Access forbidden: Order belongs to another laboratory');
    }

    order.status = 'CLARIFICATION_REQUESTED';
    order.clarificationNotes = dto.notes;

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: 'CLARIFICATION_REQUESTED',
      changedBy: new Types.ObjectId(userId),
      changedByName: profile.laboratoryName,
      timestamp: new Date(),
      reason: dto.notes,
    });

    await order.save();

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LAB_ORDER_CLARIFICATION_REQUESTED',
      resourceType: 'LaboratoryOrder',
      resourceId: order._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: { orderNumber: order.orderNumber },
    });

    try {
      await notificationService.publishEvent({
        recipientId: order.orderedBy.toString(),
        recipientRole: 'DOCTOR',
        category: 'LAB',
        eventType: 'LAB_ORDER_CLARIFICATION_REQUESTED',
        title: 'Laboratory Clarification Requested',
        message: `Order #${order.orderNumber} requires clarification: ${dto.notes}`,
        priority: 'HIGH',
        relatedEntity: {
          entityType: 'LAB_ORDER',
          entityId: order._id.toString(),
          referenceNumber: order.orderNumber,
        },
        linkUrl: '/doctor/lab-orders',
      });
    } catch {
      // Ignore notification errors
    }

    return order.toJSON();
  }

  /**
   * Assigns requested tests to internal processing departments or technicians.
   */
  async assignTests(userId: string, orderId: string, dto: AssignTestDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const labIds = [profile.userId.toString(), profile._id.toString()];

    const order = await LaboratoryOrderModel.findById(orderId);
    if (!order) {
      throw AppError.notFound('Laboratory order not found');
    }

    if (order.laboratoryId && !labIds.includes(order.laboratoryId.toString())) {
      throw AppError.forbidden('Access forbidden: Order belongs to another laboratory');
    }

    // Verify requested test exists in the order
    const testItem = order.tests.find((t) => t.testCode === dto.testCode);
    if (!testItem) {
      throw AppError.badRequest(
        `Cannot assign unrequested test code '${dto.testCode}' to this order`
      );
    }

    order.testAssignments = order.testAssignments || [];
    const existingAssignmentIndex = order.testAssignments.findIndex(
      (a) => a.testCode === dto.testCode
    );

    let technicianName: string | undefined;
    if (dto.technicianId) {
      const techUser = await UserModel.findById(dto.technicianId);
      if (techUser) {
        technicianName = techUser.name;
      }
    }

    const assignmentData = {
      testCode: testItem.testCode,
      testName: testItem.testName,
      specimenType: (testItem.specimenType as any) || 'BLOOD',
      department: dto.department,
      status: 'ASSIGNED' as const,
      priority: dto.priority || order.priority || 'ROUTINE',
      assignedTechnicianId: dto.technicianId ? new Types.ObjectId(dto.technicianId) : undefined,
      assignedTechnicianName: technicianName,
      assignedAt: new Date(),
      assignedBy: new Types.ObjectId(userId),
    };

    if (existingAssignmentIndex >= 0) {
      const existing = order.testAssignments[existingAssignmentIndex] as any;
      order.testAssignments[existingAssignmentIndex] = {
        ...(existing?.toObject ? existing.toObject() : existing),
        ...assignmentData,
      } as any;
    } else {
      order.testAssignments.push(assignmentData as any);
    }

    await order.save();

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'LAB_TEST_ASSIGNED',
      resourceType: 'LaboratoryOrder',
      resourceId: order._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: {
        orderNumber: order.orderNumber,
        testCode: dto.testCode,
        department: dto.department,
      },
    });

    return order.toJSON();
  }

  // ===========================================================================
  // 5. SPECIMEN RESOLUTION & SAMPLE COLLECTION WORKFLOW
  // ===========================================================================

  /**
   * Resolves specimen and preparation requirements for an order from the test catalogue.
   */
  async resolveSpecimenRequirements(userId: string, orderId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const order = await this.getOrderById(userId, orderId);

    const testCodes = order.tests.map((t: any) => t.testCode);
    const catalogueTests = await LabTestModel.find({
      laboratoryId: profile._id,
      testCode: { $in: testCodes },
    }).lean();

    const requirements = order.tests.map((testItem: any) => {
      const match = catalogueTests.find((c) => c.testCode === testItem.testCode);
      return {
        testCode: testItem.testCode,
        testName: testItem.testName,
        specimenType: match?.specimenType || testItem.specimenType || 'BLOOD',
        collectionMethod: match?.collectionMethod || 'Venipuncture / Standard',
        containerRequirements: match?.containerRequirements || 'Standard sterile container',
        preparationInstructions: match?.preparationInstructions || 'No special preparation needed',
        fastingRequirement: match?.fastingRequirement || false,
        fastingDurationHours: match?.fastingDurationHours,
      };
    });

    return requirements;
  }

  /**
   * Registers a specimen collection event and generates an opaque Code 128 barcode.
   */
  async registerSampleCollection(userId: string, dto: RegisterSampleCollectionDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const user = await UserModel.findById(userId);

    const order = await LaboratoryOrderModel.findById(dto.orderId);
    if (!order) {
      throw AppError.notFound('Laboratory order not found');
    }

    const labIds = [profile.userId.toString(), profile._id.toString()];
    if (order.laboratoryId && !labIds.includes(order.laboratoryId.toString())) {
      throw AppError.forbidden('Access forbidden: Order belongs to another laboratory');
    }

    // Verify test codes are in the order
    const orderedCodes = order.tests.map((t) => t.testCode);
    const validCodes = dto.testCodes.every((c) => orderedCodes.includes(c));
    if (!validCodes) {
      throw AppError.badRequest('Sample contains test codes not present in the order');
    }

    // Generate unique sample reference & unique opaque Code 128 barcode
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const sampleNumber = `SMP-${dateStr}-${randomHex}`;
    const barcode = `BC128-SMP-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const actorName = user?.name || profile.laboratoryName;

    const sample = await LabSampleModel.create({
      sampleNumber,
      barcode,
      orderId: order._id,
      orderNumber: order.orderNumber,
      laboratoryId: profile._id,
      patientId: order.patientId,
      testCodes: dto.testCodes,
      specimenType: dto.specimenType,
      collectionMethod: dto.collectionMethod,
      containerType: dto.containerType,
      status: 'COLLECTED',
      collectionCenterId: dto.collectionCenterId ? new Types.ObjectId(dto.collectionCenterId) : undefined,
      collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
      collectedById: new Types.ObjectId(userId),
      collectedByName: actorName,
      notes: dto.notes,
      events: [
        {
          eventType: 'REGISTERED',
          newStatus: 'COLLECTION_PENDING',
          actorId: new Types.ObjectId(userId),
          actorName,
          timestamp: new Date(),
          notes: 'Sample registered for order',
        },
        {
          eventType: 'BARCODE_GENERATED',
          newStatus: 'COLLECTION_PENDING',
          actorId: new Types.ObjectId(userId),
          actorName,
          timestamp: new Date(),
          notes: `Opaque barcode ${barcode} generated`,
        },
        {
          eventType: 'COLLECTED',
          previousStatus: 'COLLECTION_PENDING',
          newStatus: 'COLLECTED',
          actorId: new Types.ObjectId(userId),
          actorName,
          timestamp: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
          notes: dto.notes || 'Specimen collected successfully',
        },
      ],
    });

    // Update order status & collection status
    order.collectionStatus = 'COLLECTED';
    if (order.status === 'ORDERED' || order.status === 'ACCEPTED') {
      order.status = 'SAMPLE_COLLECTED';
    }
    await order.save();

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'SAMPLE_COLLECTED',
      resourceType: 'LabSample',
      resourceId: sample._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: {
        sampleNumber,
        barcode,
        orderNumber: order.orderNumber,
        specimenType: dto.specimenType,
      },
    });

    try {
      await notificationService.publishEvent({
        recipientId: order.patientId.toString(),
        recipientRole: 'PATIENT',
        category: 'LAB',
        eventType: 'SAMPLE_COLLECTED',
        title: 'Sample Collected',
        message: `Your ${dto.specimenType.toLowerCase()} sample for order #${order.orderNumber} has been collected.`,
        priority: 'LOW',
        relatedEntity: {
          entityType: 'LAB_SAMPLE',
          entityId: sample._id.toString(),
          referenceNumber: sampleNumber,
        },
        linkUrl: '/patient/lab-orders',
      });
    } catch {
      // Ignore notification failures
    }

    return sample.toJSON();
  }

  /**
   * Generates printable sample label containing only minimal operational information.
   * STRICT PRIVACY: Encodes no sensitive patient diagnosis or clinical history.
   */
  async getPrintableLabelData(userId: string, sampleId: string): Promise<PrintableSampleLabelDto> {
    const profile = await this.resolveLaboratoryProfile(userId);

    const sample = await LabSampleModel.findOne({
      _id: sampleId,
      laboratoryId: profile._id,
    }).populate('patientId', 'name');

    if (!sample) {
      throw AppError.notFound('Sample not found for this laboratory');
    }

    const patient = sample.patientId as any;
    const patientIdentifier = patient
      ? (patient.name ? `${patient.name.slice(0, 2).toUpperCase()}-${sample.patientId.toString().slice(-4)}` : `PT-${sample.patientId.toString().slice(-4)}`)
      : 'PT-ANON';

    return {
      sampleNumber: sample.sampleNumber,
      barcode: sample.barcode,
      specimenType: sample.specimenType,
      orderNumber: sample.orderNumber,
      collectedAt: sample.collectedAt?.toISOString() || sample.createdAt.toISOString(),
      laboratoryName: profile.laboratoryName,
      patientIdentifier,
    };
  }

  // ===========================================================================
  // 6. BARCODE RESOLUTION, ACCESSIONING & REJECTION
  // ===========================================================================

  /**
   * Scans and resolves a sample by its unique barcode reference.
   * Enforces cross-laboratory ownership checks.
   */
  async resolveBarcode(userId: string, barcode: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const sample = await LabSampleModel.findOne({
      barcode: barcode.trim(),
      laboratoryId: profile._id,
    }).lean();

    if (!sample) {
      throw AppError.notFound(
        'Invalid barcode or sample does not belong to this laboratory'
      );
    }

    return sample;
  }

  /**
   * Performs laboratory sample accessioning and receipt confirmation.
   */
  async accessionSample(userId: string, dto: SampleAccessioningDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const user = await UserModel.findById(userId);

    const sample = await LabSampleModel.findOne({
      barcode: dto.barcode.trim(),
      laboratoryId: profile._id,
    });

    if (!sample) {
      throw AppError.notFound('Sample not found with the scanned barcode');
    }

    // Idempotent acceptance: if already accessioned, return existing record
    if (sample.status === 'ACCESSIONED' || sample.status === 'PROCESSING') {
      return sample.toJSON();
    }

    if (sample.status === 'REJECTED' || sample.status === 'COMPLETED') {
      throw AppError.badRequest(`Cannot accession sample in '${sample.status}' state`);
    }

    const previousStatus = sample.status;
    const actorName = user?.name || profile.laboratoryName;

    sample.status = 'ACCESSIONED';
    sample.receivedAt = dto.receivedAt ? new Date(dto.receivedAt) : new Date();
    sample.receivedById = new Types.ObjectId(userId);
    sample.receivedByName = actorName;
    sample.accessionedAt = new Date();
    sample.accessionedById = new Types.ObjectId(userId);
    sample.accessionedByName = actorName;

    sample.events.push({
      eventType: 'RECEIVED',
      previousStatus,
      newStatus: 'RECEIVED',
      actorId: new Types.ObjectId(userId),
      actorName,
      timestamp: sample.receivedAt,
      notes: 'Sample received at diagnostic center',
    } as any);

    sample.events.push({
      eventType: 'ACCESSIONED',
      previousStatus: 'RECEIVED',
      newStatus: 'ACCESSIONED',
      actorId: new Types.ObjectId(userId),
      actorName,
      timestamp: sample.accessionedAt,
      notes: dto.notes || 'Specimen accessioned into laboratory workflow',
    } as any);

    await sample.save();

    // Update parent order status to IN_ANALYSIS
    await LaboratoryOrderModel.findByIdAndUpdate(sample.orderId, {
      status: 'IN_ANALYSIS',
      collectionStatus: 'ACCESSIONED',
    });

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'SAMPLE_ACCESSIONED',
      resourceType: 'LabSample',
      resourceId: sample._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: { sampleNumber: sample.sampleNumber, barcode: sample.barcode },
    });

    return sample.toJSON();
  }

  /**
   * Controlled sample rejection with required reason code and optional recollection request.
   * NEVER deletes the rejected sample. Preserves historical event trail.
   */
  async rejectSample(userId: string, sampleId: string, dto: SampleRejectionDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const user = await UserModel.findById(userId);

    const sample = await LabSampleModel.findOne({
      _id: sampleId,
      laboratoryId: profile._id,
    });

    if (!sample) {
      throw AppError.notFound('Sample not found');
    }

    const previousStatus = sample.status;
    const actorName = user?.name || profile.laboratoryName;

    sample.status = 'REJECTED';
    sample.rejectionReasonCode = dto.reasonCode;
    sample.rejectionReason = dto.explanation;
    sample.recollectionRequested = !!dto.requestRecollection;

    sample.events.push({
      eventType: 'REJECTED',
      previousStatus,
      newStatus: 'REJECTED',
      actorId: new Types.ObjectId(userId),
      actorName,
      timestamp: new Date(),
      reason: `[${dto.reasonCode}] ${dto.explanation}`,
    } as any);

    if (dto.requestRecollection) {
      sample.events.push({
        eventType: 'RECOLLECTION_REQUESTED',
        previousStatus: 'REJECTED',
        newStatus: 'REJECTED',
        actorId: new Types.ObjectId(userId),
        actorName,
        timestamp: new Date(),
        reason: 'Recollection requested due to sample rejection',
      } as any);
    }

    await sample.save();

    // Update order collection status
    await LaboratoryOrderModel.findByIdAndUpdate(sample.orderId, {
      collectionStatus: 'REJECTED',
    });

    await AuditLogModel.create({
      actorId: new Types.ObjectId(userId),
      action: 'SAMPLE_REJECTED',
      resourceType: 'LabSample',
      resourceId: sample._id.toString(),
      timestamp: new Date(),
      requestId: crypto.randomUUID(),
      outcome: 'SUCCESS',
      metadata: {
        sampleNumber: sample.sampleNumber,
        reasonCode: dto.reasonCode,
        requestRecollection: dto.requestRecollection,
      },
    });

    try {
      await notificationService.publishEvent({
        recipientId: sample.patientId.toString(),
        recipientRole: 'PATIENT',
        category: 'LAB',
        eventType: 'SAMPLE_REJECTED',
        title: 'Sample Processing Issue',
        message: `Your ${sample.specimenType.toLowerCase()} sample could not be processed: ${dto.explanation}. ${dto.requestRecollection ? 'Please schedule a recollection.' : ''}`,
        priority: 'HIGH',
        relatedEntity: {
          entityType: 'LAB_SAMPLE',
          entityId: sample._id.toString(),
          referenceNumber: sample.sampleNumber,
        },
        linkUrl: '/patient/lab-orders',
      });
    } catch {
      // Ignore notification failures
    }

    return sample.toJSON();
  }

  /**
   * Retrieves complete sample audit timeline.
   */
  async getSampleTimeline(userId: string, sampleId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const sample = await LabSampleModel.findOne({
      _id: sampleId,
      laboratoryId: profile._id,
    }).lean();

    if (!sample) {
      throw AppError.notFound('Sample not found');
    }

    return sample.events || [];
  }

  /**
   * Lists samples belonging to the authenticated laboratory with filters & pagination.
   */
  async listSamples(userId: string, filter: LabSampleFilterDto) {
    const profile = await this.resolveLaboratoryProfile(userId);
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const query: any = { laboratoryId: profile._id };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.specimenType) {
      query.specimenType = filter.specimenType;
    }

    if (filter.orderId) {
      query.orderId = filter.orderId;
    }

    if (filter.search) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ sampleNumber: regex }, { barcode: regex }, { orderNumber: regex }];
    }

    const sortField = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      LabSampleModel.find(query)
        .populate('patientId', 'name')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      LabSampleModel.countDocuments(query),
    ]);

    const formattedItems = items.map((s: any) => ({
      ...s,
      id: s._id.toString(),
      patientName: s.patientId?.name || 'Patient',
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves a single sample by its identifier.
   */
  async getSampleById(userId: string, sampleId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const sample = await LabSampleModel.findOne({
      _id: sampleId,
      laboratoryId: profile._id,
    })
      .populate('patientId', 'name')
      .lean();

    if (!sample) {
      throw AppError.notFound('Sample not found');
    }

    return {
      ...sample,
      id: sample._id.toString(),
      patientName: (sample as any).patientId?.name || 'Patient',
    };
  }

  /**
   * Retrieves summary counts of samples by status.
   */
  async getSampleSummary(userId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const counts = await LabSampleModel.aggregate([
      { $match: { laboratoryId: profile._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = counts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const values = Object.values(statusMap) as number[];

    return {
      totalSamples: values.reduce((a: number, b: number) => a + b, 0),
      collectionPending: statusMap['COLLECTION_PENDING'] || 0,
      collected: statusMap['COLLECTED'] || 0,
      received: statusMap['RECEIVED'] || 0,
      accessioned: statusMap['ACCESSIONED'] || 0,
      processing: statusMap['PROCESSING'] || 0,
      completed: statusMap['COMPLETED'] || 0,
      rejected: statusMap['REJECTED'] || 0,
    };
  }

  // ===========================================================================
  // 7. COLLECTION CENTER MANAGEMENT
  // ===========================================================================

  /**
   * Registers a collection center for the laboratory.
   */
  async createCollectionCenter(userId: string, dto: CollectionCenterDto) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const existing = await CollectionCenterModel.findOne({
      laboratoryId: profile._id,
      name: dto.name.trim(),
    });

    if (existing) {
      throw AppError.conflict(
        `Collection center with name '${dto.name}' already exists for this laboratory`
      );
    }

    const center = await CollectionCenterModel.create({
      ...dto,
      laboratoryId: profile._id,
    });

    return center.toJSON();
  }

  /**
   * Lists collection centers for the laboratory.
   */
  async listCollectionCenters(userId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const centers = await CollectionCenterModel.find({
      laboratoryId: profile._id,
    })
      .sort({ name: 1 })
      .lean();

    return centers.map((c: any) => ({ ...c, id: c._id.toString() }));
  }

  /**
   * Updates collection center details.
   */
  async updateCollectionCenter(userId: string, centerId: string, dto: Partial<CollectionCenterDto>) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const center = await CollectionCenterModel.findOne({
      _id: centerId,
      laboratoryId: profile._id,
    });

    if (!center) {
      throw AppError.notFound('Collection center not found');
    }

    if (dto.name) center.name = dto.name;
    if (dto.address) center.address = { ...center.address, ...dto.address };
    if (dto.contactPhone) center.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) center.contactEmail = dto.contactEmail;
    if (dto.contactPerson !== undefined) center.contactPerson = dto.contactPerson;
    if (dto.operatingHours !== undefined) center.operatingHours = dto.operatingHours;
    if (dto.collectionServices) center.collectionServices = dto.collectionServices;
    if (dto.isActive !== undefined) center.isActive = dto.isActive;

    await center.save();
    return center.toJSON();
  }

  // ===========================================================================
  // 8. DASHBOARD ANALYTICS & RECENT ACTIVITY
  // ===========================================================================

  /**
   * Generates real-time operational dashboard analytics via database aggregations.
   */
  async getDashboardSummary(userId: string): Promise<LaboratoryDashboardSummaryDto> {
    const profile = await this.resolveLaboratoryProfile(userId);
    const labIds = [profile.userId, profile._id];

    const orderFilter = {
      $or: [
        { laboratoryId: { $in: labIds } },
        { laboratoryId: null, facilityId: profile.facilityId },
      ],
    };

    const [
      totalActiveTests,
      newOrders,
      pendingOrderReviews,
      acceptedOrders,
      samplesAwaitingCollection,
      samplesReceived,
      samplesAccessioned,
      completedOrders,
      recentOrders,
      testCategoryCounts,
    ] = await Promise.all([
      LabTestModel.countDocuments({ laboratoryId: profile._id, isActive: true }),
      LaboratoryOrderModel.countDocuments({ ...orderFilter, status: 'ORDERED' }),
      LaboratoryOrderModel.countDocuments({ ...orderFilter, status: 'ORDERED' }),
      LaboratoryOrderModel.countDocuments({ ...orderFilter, status: 'ACCEPTED' }),
      LabSampleModel.countDocuments({ laboratoryId: profile._id, status: 'COLLECTION_PENDING' }),
      LabSampleModel.countDocuments({ laboratoryId: profile._id, status: 'RECEIVED' }),
      LabSampleModel.countDocuments({ laboratoryId: profile._id, status: 'ACCESSIONED' }),
      LaboratoryOrderModel.countDocuments({ ...orderFilter, status: 'COMPLETED' }),
      LaboratoryOrderModel.find(orderFilter)
        .populate('patientId', 'name')
        .populate('orderedBy', 'name')
        .sort({ orderedAt: -1 })
        .limit(5)
        .lean(),
      LabTestModel.aggregate([
        { $match: { laboratoryId: profile._id, isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const formattedRecentOrders = recentOrders.map((o: any) => ({
      ...o,
      id: o._id.toString(),
      patient: o.patientId
        ? {
            id: o.patientId._id?.toString(),
            name: o.patientId.name || 'Patient',
          }
        : undefined,
      doctor: o.orderedBy
        ? {
            id: o.orderedBy._id?.toString(),
            name: o.orderedBy.name
              ? (o.orderedBy.name.startsWith('Dr.') ? o.orderedBy.name : `Dr. ${o.orderedBy.name}`)
              : 'Doctor',
          }
        : undefined,
    }));

    const testCatalogueSummary = testCategoryCounts.map((c) => ({
      category: c._id,
      count: c.count,
    }));

    return {
      totalActiveTests,
      newOrders,
      pendingOrderReviews,
      acceptedOrders,
      samplesAwaitingCollection,
      samplesReceived,
      samplesAccessioned,
      activeWorklistItems: samplesAccessioned,
      resultsDraftCount: 0,
      resultsSubmittedCount: 0,
      criticalAlertsCount: 0,
      completedOrders,
      recentOrders: formattedRecentOrders as any,
      testCatalogueSummary,
    };
  }

  /**
   * Retrieves recent audit activity for the laboratory.
   */
  async getRecentActivity(userId: string) {
    const profile = await this.resolveLaboratoryProfile(userId);

    const logs = await AuditLogModel.find({
      $or: [
        { actorId: new Types.ObjectId(userId) },
        { resourceId: profile._id.toString() },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(15)
      .lean();

    return logs.map((log: any) => ({
      id: log._id.toString(),
      action: log.action,
      description: `Action ${log.action} performed on ${log.resourceType}`,
      actorName: profile.laboratoryName,
      timestamp: log.timestamp.toISOString(),
      resourceType: log.resourceType,
      resourceId: log.resourceId,
    }));
  }
}

export const laboratoryService = new LaboratoryService();
export default laboratoryService;
