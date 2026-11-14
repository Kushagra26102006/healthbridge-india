import { Types } from 'mongoose';
import {
  PharmacyProfileModel,
  PharmacyInventoryModel,
  PharmacyOrderModel,
  PrescriptionModel,
  UserModel,
  PatientProfileModel,
  AuditLogModel,
  FacilityModel,
} from '../../../database/models';
import { AppError } from '../../../shared/errors/app-error';
import { HttpStatus } from '../../../shared/constants/http-status';
import { ErrorCode } from '../../../shared/errors/error-codes';
import type {
  PharmacyProfileDto,
  UpdatePharmacyProfileDto,
  PharmacyDashboardSummaryDto,
  PharmacyInventoryItemDto,
  CreatePharmacyInventoryItemDto,
  PharmacyInventoryFilterDto,
  PharmacyPrescriptionQueueItemDto,
  PharmacyOrderDto,
  CreatePharmacyOrderDto,
  InventoryStockStatus,
} from '@healthbridge/shared-types';

export class PharmacyService {
  /**
   * Helper: audit log recorder
   */
  private async recordAudit(params: {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLogModel.create({
        userId: new Types.ObjectId(params.actorId),
        userRole: 'PHARMACY',
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: params.metadata,
        timestamp: new Date(),
      });
    } catch {
      // Non-blocking for audit failures
    }
  }

  /**
   * 1. Get or initialize authenticated pharmacy profile
   */
  async getProfile(userId: string): Promise<PharmacyProfileDto> {
    const userObjectId = new Types.ObjectId(userId);
    const user = await UserModel.findById(userObjectId);
    if (!user) {
      throw AppError.notFound('Pharmacy user account not found');
    }

    let profile = await PharmacyProfileModel.findOne({ userId: userObjectId });
    if (!profile) {
      // Initialize default pharmacy profile
      profile = await PharmacyProfileModel.create({
        userId: userObjectId,
        pharmacyName: user.name || 'HealthBridge Pharmacy',
        pharmacyLicenseNumber: `DL-${Date.now().toString().slice(-8)}`,
        contactEmail: user.email,
        contactPhone: user.phone,
        verificationStatus: 'PENDING',
        documentSubmissionStatus: 'NOT_SUBMITTED',
        openingTime: '08:00',
        closingTime: '22:00',
        is24Hours: false,
        weeklyAvailability: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
        supportedServices: ['IN_STORE_PICKUP', 'PRESCRIPTION_REFILL'],
      });
    }

    let facilityName: string | undefined;
    if (profile.facilityId) {
      const facility = await FacilityModel.findById(profile.facilityId);
      facilityName = facility?.name;
    }

    return {
      id: profile._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      pharmacyName: profile.pharmacyName || user.name,
      email: profile.contactEmail || user.email,
      phone: profile.contactPhone || user.phone,
      description: profile.description,
      logoUrl: profile.logoUrl,
      address: {
        line1: profile.address?.line1,
        city: profile.address?.city || 'New Delhi',
        state: profile.address?.state || 'Delhi',
        postalCode: profile.address?.postalCode || '110001',
        country: profile.address?.country || 'India',
      },
      pharmacyLicenseNumber: profile.pharmacyLicenseNumber,
      gstin: profile.gstin,
      issuingAuthority: profile.issuingAuthority || 'State Drugs Standard Control Organization',
      verificationStatus: profile.verificationStatus,
      isVerified: profile.verificationStatus === 'VERIFIED',
      documentSubmissionStatus: profile.documentSubmissionStatus,
      documents: (profile.documents || []).map((doc: any) => ({
        id: doc._id?.toString() || doc.id,
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
        documentUrl: doc.documentUrl,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : new Date().toISOString(),
        verificationStatus: doc.verificationStatus,
      })),
      facilityId: profile.facilityId?.toString(),
      facilityName,
      openingTime: profile.openingTime || '08:00',
      closingTime: profile.closingTime || '22:00',
      is24Hours: Boolean(profile.is24Hours),
      weeklyAvailability: profile.weeklyAvailability || [],
      supportedServices: profile.supportedServices || [],
      createdAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * 2. Update permitted pharmacy profile fields
   * Never allow pharmacy to self-verify or change license number
   */
  async updateProfile(userId: string, input: UpdatePharmacyProfileDto): Promise<PharmacyProfileDto> {
    const userObjectId = new Types.ObjectId(userId);
    let profile = await PharmacyProfileModel.findOne({ userId: userObjectId });
    if (!profile) {
      await this.getProfile(userId);
      profile = await PharmacyProfileModel.findOne({ userId: userObjectId });
    }

    if (!profile) {
      throw AppError.notFound('Pharmacy profile could not be loaded');
    }

    if (input.pharmacyName) profile.pharmacyName = input.pharmacyName.trim();
    if (input.description !== undefined) profile.description = input.description.trim();
    if (input.logoUrl !== undefined) profile.logoUrl = input.logoUrl;
    if (input.openingTime) profile.openingTime = input.openingTime;
    if (input.closingTime) profile.closingTime = input.closingTime;
    if (input.is24Hours !== undefined) profile.is24Hours = input.is24Hours;
    if (input.weeklyAvailability) profile.weeklyAvailability = input.weeklyAvailability;
    if (input.supportedServices) profile.supportedServices = input.supportedServices;

    if (input.address) {
      profile.address = {
        line1: input.address.line1 !== undefined ? input.address.line1 : profile.address?.line1,
        city: input.address.city || profile.address?.city || 'New Delhi',
        state: input.address.state || profile.address?.state || 'Delhi',
        postalCode: input.address.postalCode || profile.address?.postalCode || '110001',
        country: input.address.country || profile.address?.country || 'India',
      };
    }

    if (input.phone) {
      profile.contactPhone = input.phone.trim();
      await UserModel.updateOne({ _id: userObjectId }, { phone: input.phone.trim() });
    }

    await profile.save();

    await this.recordAudit({
      actorId: userId,
      action: 'PHARMACY_PROFILE_UPDATED',
      resourceType: 'PHARMACY_PROFILE',
      resourceId: profile._id.toString(),
      metadata: { pharmacyName: profile.pharmacyName },
    });

    return this.getProfile(userId);
  }

  /**
   * 3. Dashboard metrics, prescription queue preview, inventory alerts & recent activity
   */
  async getDashboardSummary(userId: string): Promise<PharmacyDashboardSummaryDto> {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);

    const [
      totalActiveMedicines,
      lowStockMedicines,
      outOfStockMedicines,
      expiringMedicines,
      pendingPrescriptions,
      processingOrders,
      completedDispensing,
      inventoryAlertDocs,
      recentOrderDocs,
      queuePrescriptionDocs,
    ] = await Promise.all([
      PharmacyInventoryModel.countDocuments({
        pharmacyId: userObjectId,
        status: { $ne: 'DISCONTINUED' },
      }),
      PharmacyInventoryModel.countDocuments({
        pharmacyId: userObjectId,
        status: 'LOW_STOCK',
      }),
      PharmacyInventoryModel.countDocuments({
        pharmacyId: userObjectId,
        status: 'OUT_OF_STOCK',
      }),
      PharmacyInventoryModel.countDocuments({
        pharmacyId: userObjectId,
        expiryDate: { $lte: thirtyDaysFromNow, $gt: now },
        status: { $ne: 'EXPIRED' },
      }),
      PrescriptionModel.countDocuments({
        status: 'ACTIVE',
      }),
      PharmacyOrderModel.countDocuments({
        pharmacyId: userObjectId,
        status: { $in: ['PENDING', 'ACCEPTED', 'PROCESSING'] },
      }),
      PharmacyOrderModel.countDocuments({
        pharmacyId: userObjectId,
        status: 'COMPLETED',
      }),
      PharmacyInventoryModel.find({
        pharmacyId: userObjectId,
        $or: [
          { status: 'LOW_STOCK' },
          { status: 'OUT_OF_STOCK' },
          { expiryDate: { $lte: thirtyDaysFromNow } },
        ],
      })
        .sort({ expiryDate: 1, availableQuantity: 1 })
        .limit(5)
        .lean(),
      PharmacyOrderModel.find({ pharmacyId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patientId', 'name phone')
        .lean(),
      PrescriptionModel.find({ status: 'ACTIVE' })
        .sort({ issuedAt: -1, createdAt: -1 })
        .limit(5)
        .populate('patientId', 'name phone')
        .populate('doctorId', 'name specialization')
        .populate('facilityId', 'name')
        .lean(),
    ]);

    // Format Prescription Queue Preview
    const prescriptionQueuePreview: PharmacyPrescriptionQueueItemDto[] = queuePrescriptionDocs.map((rx: any) => {
      const patient = rx.patientId as any;
      const doctor = rx.doctorId as any;
      const facility = rx.facilityId as any;

      return {
        id: rx._id.toString(),
        prescriptionNumber: rx.prescriptionNumber,
        patientId: patient?._id?.toString() || rx.patientId?.toString() || 'unknown',
        patientName: patient?.name || 'Authorized Patient',
        patientPhone: patient?.phone,
        doctorId: doctor?._id?.toString() || rx.doctorId?.toString() || 'unknown',
        doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Treating Physician',
        doctorSpecialization: Array.isArray(doctor?.specialization)
          ? doctor.specialization[0]
          : doctor?.specialization,
        facilityName: facility?.name,
        issueDate: rx.issuedAt ? new Date(rx.issuedAt).toISOString() : new Date(rx.createdAt).toISOString(),
        validUntil: rx.validUntil ? new Date(rx.validUntil).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        itemCount: rx.medications?.length || 0,
        status: rx.status,
        medications: (rx.medications || []).map((m: any) => ({
          medicationName: m.name,
          genericName: m.genericName,
          strength: m.strength,
          dosageForm: m.dosageForm || 'Tablet',
          quantity: m.quantity || 1,
          instructions: m.instructions,
        })),
        instructions: rx.instructions,
      };
    });

    // Format Inventory Alerts
    const inventoryAlerts = inventoryAlertDocs.map((item: any) => {
      const itemExpiry = new Date(item.expiryDate);
      let alertStatus: 'LOW_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY' = 'LOW_STOCK';
      if (itemExpiry < now) {
        alertStatus = 'EXPIRED';
      } else if (itemExpiry <= thirtyDaysFromNow) {
        alertStatus = 'NEAR_EXPIRY';
      }

      return {
        id: item._id.toString(),
        medicineName: item.medicationName,
        batchNumber: item.batchNumber,
        availableQuantity: item.availableQuantity,
        expiryDate: itemExpiry.toISOString(),
        alertStatus,
      };
    });

    // Format Recent Activity
    const recentActivity = recentOrderDocs.map((ord: any) => ({
      id: ord._id.toString(),
      action: `ORDER_${ord.status}`,
      description: `Order #${ord.orderNumber} (${ord.fulfillmentType === 'HOME_DELIVERY' ? 'Delivery' : 'Store Pickup'}) status is ${ord.status}`,
      timestamp: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
      referenceId: ord.orderNumber,
    }));

    return {
      metrics: {
        totalActiveMedicines,
        lowStockMedicines,
        outOfStockMedicines,
        pendingPrescriptions,
        processingOrders,
        completedDispensing,
        expiringMedicines,
      },
      prescriptionQueuePreview,
      inventoryAlerts,
      recentActivity,
    };
  }

  /**
   * 4. List pharmacy inventory with search, filters and pagination
   */
  async getInventory(
    userId: string,
    filter: PharmacyInventoryFilterDto
  ): Promise<{
    items: PharmacyInventoryItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      pharmacyId: userObjectId,
    };

    if (filter.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }

    if (filter.search) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { medicationName: regex },
        { brandName: regex },
        { genericName: regex },
        { batchNumber: regex },
      ];
    }

    if (filter.expiringWithinDays) {
      const days = Number(filter.expiringWithinDays);
      const targetDate = new Date(Date.now() + days * 86400000);
      query.expiryDate = { $lte: targetDate };
    }

    const [items, total] = await Promise.all([
      PharmacyInventoryModel.find(query)
        .sort({ medicationName: 1, expiryDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PharmacyInventoryModel.countDocuments(query),
    ]);

    const now = new Date();
    const mapped: PharmacyInventoryItemDto[] = items.map((item: any) => {
      const isExpired = new Date(item.expiryDate) < now;
      let status: InventoryStockStatus = item.status;
      if (isExpired && status !== 'EXPIRED') {
        status = 'EXPIRED';
      }

      return {
        id: item._id.toString(),
        pharmacyId: item.pharmacyId.toString(),
        medicationCatalogId: item.medicationCatalogId?.toString(),
        medicationName: item.medicationName,
        genericName: item.genericName,
        brandName: item.brandName,
        dosageForm: item.dosageForm,
        strength: item.strength,
        manufacturer: item.manufacturer,
        batchNumber: item.batchNumber,
        availableQuantity: item.availableQuantity,
        reservedQuantity: item.reservedQuantity || 0,
        reorderLevel: item.reorderLevel || 20,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        mrp: item.mrp,
        manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate).toISOString() : undefined,
        expiryDate: new Date(item.expiryDate).toISOString(),
        status,
        rackLocation: item.rackLocation,
        isExpired,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 5. Get single inventory item by ID (strictly scoped to pharmacy)
   */
  async getInventoryById(userId: string, inventoryId: string): Promise<PharmacyInventoryItemDto> {
    const userObjectId = new Types.ObjectId(userId);
    const item = await PharmacyInventoryModel.findOne({
      _id: new Types.ObjectId(inventoryId),
      pharmacyId: userObjectId,
    }).lean();

    if (!item) {
      throw AppError.notFound('Inventory item not found or you lack permission to view it');
    }

    const now = new Date();
    const isExpired = new Date(item.expiryDate) < now;

    return {
      id: item._id.toString(),
      pharmacyId: item.pharmacyId.toString(),
      medicationCatalogId: item.medicationCatalogId?.toString(),
      medicationName: item.medicationName,
      genericName: item.genericName,
      brandName: item.brandName,
      dosageForm: item.dosageForm,
      strength: item.strength,
      manufacturer: item.manufacturer,
      batchNumber: item.batchNumber,
      availableQuantity: item.availableQuantity,
      reservedQuantity: item.reservedQuantity || 0,
      reorderLevel: item.reorderLevel || 20,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      mrp: item.mrp,
      manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate).toISOString() : undefined,
      expiryDate: new Date(item.expiryDate).toISOString(),
      status: item.status,
      rackLocation: item.rackLocation,
      isExpired,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * 6. Create inventory batch item
   * Strict validation: quantity cannot be negative; duplicate batches for same medication prevented
   */
  async createInventoryItem(
    userId: string,
    input: CreatePharmacyInventoryItemDto
  ): Promise<PharmacyInventoryItemDto> {
    const userObjectId = new Types.ObjectId(userId);

    // Negative quantity guard
    if (input.availableQuantity < 0) {
      throw new AppError(
        'Available quantity cannot be negative',
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST
      );
    }

    const batch = input.batchNumber.trim().toUpperCase();

    // Check duplicate batch for this pharmacy
    const existing = await PharmacyInventoryModel.findOne({
      pharmacyId: userObjectId,
      batchNumber: batch,
      medicationName: input.medicationName.trim(),
    });

    if (existing) {
      throw new AppError(
        `Batch number '${batch}' for '${input.medicationName}' already exists in your inventory. Update existing stock instead.`,
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT
      );
    }

    const expiry = new Date(input.expiryDate);
    const now = new Date();
    const reorderLevel = input.reorderLevel !== undefined ? input.reorderLevel : 20;

    let initialStatus: InventoryStockStatus = 'IN_STOCK';
    if (expiry < now) {
      initialStatus = 'EXPIRED';
    } else if (input.availableQuantity === 0) {
      initialStatus = 'OUT_OF_STOCK';
    } else if (input.availableQuantity <= reorderLevel) {
      initialStatus = 'LOW_STOCK';
    }

    const created = await PharmacyInventoryModel.create({
      pharmacyId: userObjectId,
      medicationCatalogId: input.medicationCatalogId ? new Types.ObjectId(input.medicationCatalogId) : undefined,
      medicationName: input.medicationName.trim(),
      genericName: input.genericName?.trim(),
      brandName: input.brandName?.trim(),
      dosageForm: input.dosageForm.trim(),
      strength: input.strength.trim(),
      manufacturer: input.manufacturer?.trim(),
      batchNumber: batch,
      availableQuantity: input.availableQuantity,
      reservedQuantity: 0,
      reorderLevel,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      mrp: input.mrp,
      manufacturingDate: input.manufacturingDate ? new Date(input.manufacturingDate) : undefined,
      expiryDate: expiry,
      status: initialStatus,
      rackLocation: input.rackLocation?.trim(),
    });

    await this.recordAudit({
      actorId: userId,
      action: 'INVENTORY_BATCH_CREATED',
      resourceType: 'PHARMACY_INVENTORY',
      resourceId: created._id.toString(),
      metadata: {
        medicationName: created.medicationName,
        batchNumber: created.batchNumber,
        quantity: created.availableQuantity,
      },
    });

    return this.getInventoryById(userId, created._id.toString());
  }

  /**
   * 7. Prescription queue for authorized pharmacy access
   * Returns active, doctor-issued prescriptions with minimum necessary patient info
   */
  async getPrescriptionQueue(
    _userId: string,
    filter: { page?: number; limit?: number; status?: string; search?: string }
  ): Promise<{
    items: PharmacyPrescriptionQueueItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      isDraft: false,
      status: { $in: ['ACTIVE', 'COMPLETED', 'DISPENSED'] },
    };

    if (filter.status && filter.status !== 'ALL') {
      if (filter.status === 'PENDING') {
        query.status = 'ACTIVE';
      } else {
        query.status = filter.status;
      }
    }

    if (filter.search) {
      const rxRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ prescriptionNumber: rxRegex }];
    }

    const [items, total] = await Promise.all([
      PrescriptionModel.find(query)
        .sort({ issuedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('patientId', 'name phone')
        .populate('doctorId', 'name specialization')
        .populate('facilityId', 'name')
        .lean(),
      PrescriptionModel.countDocuments(query),
    ]);

    const mapped: PharmacyPrescriptionQueueItemDto[] = items.map((rx: any) => {
      const patient = rx.patientId as any;
      const doctor = rx.doctorId as any;
      const facility = rx.facilityId as any;

      return {
        id: rx._id.toString(),
        prescriptionNumber: rx.prescriptionNumber,
        patientId: patient?._id?.toString() || rx.patientId?.toString() || 'unknown',
        patientName: patient?.name || 'Authorized Patient',
        patientPhone: patient?.phone,
        doctorId: doctor?._id?.toString() || rx.doctorId?.toString() || 'unknown',
        doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Treating Physician',
        doctorSpecialization: Array.isArray(doctor?.specialization)
          ? doctor.specialization[0]
          : doctor?.specialization,
        facilityName: facility?.name,
        issueDate: rx.issuedAt ? new Date(rx.issuedAt).toISOString() : new Date(rx.createdAt).toISOString(),
        validUntil: rx.validUntil ? new Date(rx.validUntil).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        itemCount: rx.medications?.length || 0,
        status: rx.status,
        medications: (rx.medications || []).map((m: any) => ({
          medicationName: m.name || m.medicationName || 'Medication',
          genericName: m.genericName,
          strength: m.strength,
          dosageForm: m.dosageForm || 'Tablet',
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          quantity: m.quantity || 1,
          instructions: m.instructions,
        })),
        instructions: rx.instructions,
      };
    });

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 8. Retrieve authorized prescription details with minimal necessary patient data
   * Doctor clinical instructions remain strictly immutable
   */
  async getPrescriptionDetail(
    _userId: string,
    prescriptionId: string
  ): Promise<PharmacyPrescriptionQueueItemDto> {
    const rx = await PrescriptionModel.findOne({
      _id: new Types.ObjectId(prescriptionId),
      isDraft: false,
    })
      .populate('patientId', 'name phone')
      .populate('doctorId', 'name specialization')
      .populate('facilityId', 'name')
      .lean();

    if (!rx) {
      throw AppError.notFound(
        'Prescription not found, is still in draft state, or you lack authorization to view it'
      );
    }

    const patient = rx.patientId as any;
    const doctor = rx.doctorId as any;
    const facility = rx.facilityId as any;

    let patientAge: number | undefined;
    let patientGender: string | undefined;

    if (patient?._id) {
      const patientProfile = await PatientProfileModel.findOne({ userId: patient._id }).lean();
      if (patientProfile) {
        patientGender = patientProfile.gender;
        if (patientProfile.dateOfBirth) {
          const diff = Date.now() - new Date(patientProfile.dateOfBirth).getTime();
          patientAge = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
        }
      }
    }

    return {
      id: rx._id.toString(),
      prescriptionNumber: rx.prescriptionNumber,
      patientId: patient?._id?.toString() || rx.patientId.toString(),
      patientName: patient?.name || 'Authorized Patient',
      patientAge,
      patientGender,
      patientPhone: patient?.phone,
      doctorId: doctor?._id?.toString() || rx.doctorId.toString(),
      doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Treating Physician',
      doctorSpecialization: Array.isArray(doctor?.specialization)
        ? doctor.specialization[0]
        : doctor?.specialization,
      facilityName: facility?.name,
      issueDate: rx.issuedAt ? new Date(rx.issuedAt).toISOString() : new Date(rx.createdAt).toISOString(),
      validUntil: rx.validUntil ? new Date(rx.validUntil).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
      itemCount: rx.medications?.length || 0,
      status: rx.status,
      medications: (rx.medications || []).map((m: any) => ({
        medicationName: m.name || m.medicationName || 'Medication',
        genericName: m.genericName,
        strength: m.strength,
        dosageForm: m.dosageForm || 'Tablet',
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        quantity: m.quantity || 1,
        instructions: m.instructions,
      })),
      instructions: rx.instructions,
    };
  }

  /**
   * 9. List pharmacy orders (strictly scoped to authenticated pharmacy)
   */
  async getOrders(
    userId: string,
    filter: { page?: number; limit?: number; status?: string; search?: string }
  ): Promise<{
    items: PharmacyOrderDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      pharmacyId: userObjectId,
    };

    if (filter.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }

    if (filter.search) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ orderNumber: regex }];
    }

    const [items, total] = await Promise.all([
      PharmacyOrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('patientId', 'name phone')
        .populate('prescriptionId', 'prescriptionNumber')
        .lean(),
      PharmacyOrderModel.countDocuments(query),
    ]);

    const mapped: PharmacyOrderDto[] = items.map((ord: any) => {
      const patient = ord.patientId as any;
      const rx = ord.prescriptionId as any;

      return {
        id: ord._id.toString(),
        orderNumber: ord.orderNumber,
        pharmacyId: ord.pharmacyId.toString(),
        patientId: patient?._id?.toString() || ord.patientId.toString(),
        patientName: patient?.name || 'Customer / Patient',
        patientPhone: patient?.phone,
        prescriptionId: rx?._id?.toString() || ord.prescriptionId?.toString(),
        prescriptionNumber: rx?.prescriptionNumber,
        items: (ord.items || []).map((i: any) => ({
          id: i._id?.toString(),
          inventoryId: i.inventoryId?.toString(),
          medicationCatalogId: i.medicationCatalogId?.toString(),
          medicationName: i.medicationName,
          strength: i.strength,
          dosageForm: i.dosageForm,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          batchNumber: i.batchNumber,
        })),
        subtotal: ord.subtotal,
        tax: ord.tax || 0,
        discount: ord.discount || 0,
        totalAmount: ord.totalAmount,
        fulfillmentType: ord.fulfillmentType,
        deliveryAddress: ord.deliveryAddress,
        status: ord.status,
        notes: ord.notes,
        createdAt: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: ord.updatedAt ? new Date(ord.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 10. Get single pharmacy order (strictly scoped to pharmacy)
   */
  async getOrderById(userId: string, orderId: string): Promise<PharmacyOrderDto> {
    const userObjectId = new Types.ObjectId(userId);
    const ord = await PharmacyOrderModel.findOne({
      _id: new Types.ObjectId(orderId),
      pharmacyId: userObjectId,
    })
      .populate('patientId', 'name phone')
      .populate('prescriptionId', 'prescriptionNumber')
      .lean();

    if (!ord) {
      throw AppError.notFound('Order not found or you lack permission to view it');
    }

    const patient = ord.patientId as any;
    const rx = ord.prescriptionId as any;

    return {
      id: ord._id.toString(),
      orderNumber: ord.orderNumber,
      pharmacyId: ord.pharmacyId.toString(),
      patientId: patient?._id?.toString() || ord.patientId.toString(),
      patientName: patient?.name || 'Customer / Patient',
      patientPhone: patient?.phone,
      prescriptionId: rx?._id?.toString() || ord.prescriptionId?.toString(),
      prescriptionNumber: rx?.prescriptionNumber,
      items: (ord.items || []).map((i: any) => ({
        id: i._id?.toString(),
        inventoryId: i.inventoryId?.toString(),
        medicationCatalogId: i.medicationCatalogId?.toString(),
        medicationName: i.medicationName,
        strength: i.strength,
        dosageForm: i.dosageForm,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        batchNumber: i.batchNumber,
      })),
      subtotal: ord.subtotal,
      tax: ord.tax || 0,
      discount: ord.discount || 0,
      totalAmount: ord.totalAmount,
      fulfillmentType: ord.fulfillmentType,
      deliveryAddress: ord.deliveryAddress,
      status: ord.status,
      notes: ord.notes,
      createdAt: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: ord.updatedAt ? new Date(ord.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * 11. Create a new pharmacy order
   */
  async createOrder(userId: string, input: CreatePharmacyOrderDto): Promise<PharmacyOrderDto> {
    const userObjectId = new Types.ObjectId(userId);

    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST standard medicine tax
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;

    const count = await PharmacyOrderModel.countDocuments({ pharmacyId: userObjectId });
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count + 1).padStart(4, '0')}`;

    const order = await PharmacyOrderModel.create({
      orderNumber,
      pharmacyId: userObjectId,
      patientId: new Types.ObjectId(input.patientId),
      prescriptionId: input.prescriptionId ? new Types.ObjectId(input.prescriptionId) : undefined,
      items: input.items.map((i) => ({
        inventoryId: i.inventoryId ? new Types.ObjectId(i.inventoryId) : undefined,
        medicationCatalogId: i.medicationCatalogId ? new Types.ObjectId(i.medicationCatalogId) : undefined,
        medicationName: i.medicationName.trim(),
        strength: i.strength.trim(),
        dosageForm: i.dosageForm.trim(),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.quantity * i.unitPrice,
        batchNumber: i.batchNumber?.trim(),
      })),
      subtotal,
      tax,
      discount: 0,
      totalAmount,
      fulfillmentType: input.fulfillmentType || 'IN_STORE_PICKUP',
      deliveryAddress: input.deliveryAddress,
      status: 'PENDING',
      notes: input.notes?.trim(),
    });

    await this.recordAudit({
      actorId: userId,
      action: 'PHARMACY_ORDER_CREATED',
      resourceType: 'PHARMACY_ORDER',
      resourceId: order._id.toString(),
      metadata: { orderNumber: order.orderNumber, totalAmount: order.totalAmount },
    });

    return this.getOrderById(userId, order._id.toString());
  }
}

export const pharmacyService = new PharmacyService();
export default pharmacyService;
