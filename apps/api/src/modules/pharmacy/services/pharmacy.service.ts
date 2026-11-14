import { Types } from 'mongoose';
import {
  PharmacyProfileModel,
  PharmacyInventoryModel,
  PharmacyInventoryTransactionModel,
  PharmacyOrderModel,
  PrescriptionModel,
  UserModel,
  PatientProfileModel,
  DoctorProfileModel,
  AuditLogModel,
  FacilityModel,
  MedicationCatalogModel,
  DispensingRecordModel,
  NotificationModel,
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
  MedicineCatalogItemDto,
  CreateMedicineCatalogDto,
  UpdateMedicineCatalogDto,
  MedicineCatalogFilterDto,
  PharmacyStockInDto,
  PharmacyStockAdjustmentDto,
  QuarantineBatchDto,
  ReleaseBatchDto,
  PharmacyInventoryTransactionDto,
  InventoryTransactionFilterDto,
  PharmacyExpiryReportSummaryDto,
  PharmacyExpiryReportItemDto,
  ExpiryHorizon,
  PharmacyAlertsSummaryDto,
  PharmacyInventoryAnalyticsDto,
  MedicineMatchStatus,
  CandidateBatchOptionDto,
  MedicineMatchResultDto,
  PrescriptionVerificationDto,
  PrescriptionVerificationItemDto,
  DispensePrescriptionDto,
  DispensingRecordDto,
  DispensingFilterDto,
  CancelDispensingDto,
} from '@healthbridge/shared-types';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function toIsoSafe(d: any, fallback = new Date()): string {
  if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString();
  if (d && !isNaN(new Date(d).getTime())) return new Date(d).toISOString();
  return fallback.toISOString();
}

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
   * Helper: generate unique sequential-like transaction reference
   */
  private generateTransactionReference(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
    return `TXN-${dateStr}-${randomSuffix}`;
  }

  /**
   * Helper: map inventory Mongoose doc to PharmacyInventoryItemDto
   */
  private mapInventoryItem(item: any): PharmacyInventoryItemDto {
    const now = new Date();
    const isExpired = new Date(item.expiryDate) < now;
    let status: InventoryStockStatus = item.status;
    if (item.isQuarantined || status === 'QUARANTINED') {
      status = 'QUARANTINED';
    } else if (isExpired && status !== 'EXPIRED') {
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
      supplier: item.supplier,
      invoiceNumber: item.invoiceNumber,
      batchNumber: item.batchNumber,
      availableQuantity: item.availableQuantity,
      receivedQuantity: item.receivedQuantity,
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
      isQuarantined: Boolean(item.isQuarantined),
      quarantineReason: item.quarantineReason,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Helper: map MedicationCatalog doc to MedicineCatalogItemDto
   */
  private mapMedicineItem(med: any): MedicineCatalogItemDto {
    return {
      id: med._id.toString(),
      name: med.name,
      genericName: med.genericName,
      brandName: med.brandName,
      dosageForm: med.dosageForm,
      strength: med.strength,
      route: med.route || 'Oral',
      manufacturer: med.manufacturer,
      category: med.category || med.therapeuticClass || 'General',
      composition: med.composition,
      packSize: med.packSize || med.packageSize,
      unitOfMeasurement: med.unitOfMeasurement || med.standardDosageUnit || 'tablet',
      packageSize: med.packageSize,
      schedule: med.schedule || 'Schedule H',
      therapeuticClass: med.therapeuticClass,
      standardDosageUnit: med.standardDosageUnit,
      description: med.description || med.instructionsHint,
      instructionsHint: med.instructionsHint,
      requiresPrescription: med.requiresPrescription !== undefined ? med.requiresPrescription : true,
      isActive: med.isActive !== undefined ? med.isActive : true,
      createdAt: med.createdAt ? new Date(med.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: med.updatedAt ? new Date(med.updatedAt).toISOString() : new Date().toISOString(),
    };
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
   * 2. Update pharmacy profile
   */
  async updateProfile(userId: string, input: UpdatePharmacyProfileDto): Promise<PharmacyProfileDto> {
    const userObjectId = new Types.ObjectId(userId);
    const profile = await PharmacyProfileModel.findOne({ userId: userObjectId });
    if (!profile) {
      throw AppError.notFound('Pharmacy profile not found');
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
   * 3. Dashboard summary metrics, queue preview, alerts, activity
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
      _recentOrderDocs,
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
      PrescriptionModel.find({
        status: 'ACTIVE',
        isDraft: false,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patientId', 'name phone')
        .populate('doctorId', 'name specialization')
        .lean(),
    ]);

    const prescriptionQueuePreview: PharmacyPrescriptionQueueItemDto[] = queuePrescriptionDocs.map((rx: any) => {
      const patient = rx.patientId as any;
      const doctor = rx.doctorId as any;
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

    const inventoryAlerts = inventoryAlertDocs.map((item: any) => {
      const isExpired = new Date(item.expiryDate) < now;
      let alertStatus: 'LOW_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY' = 'LOW_STOCK';
      if (isExpired) {
        alertStatus = 'EXPIRED';
      } else if (new Date(item.expiryDate) <= thirtyDaysFromNow) {
        alertStatus = 'NEAR_EXPIRY';
      }

      return {
        id: item._id.toString(),
        medicineName: item.medicationName,
        batchNumber: item.batchNumber,
        availableQuantity: item.availableQuantity,
        expiryDate: new Date(item.expiryDate).toISOString(),
        alertStatus,
      };
    });

    const recentAuditDocs = await AuditLogModel.find({
      userId: userObjectId,
      action: { $in: ['INVENTORY_BATCH_CREATED', 'STOCK_ADJUSTED', 'STOCK_RECEIVED', 'PHARMACY_ORDER_CREATED'] },
    })
      .sort({ timestamp: -1 })
      .limit(6)
      .lean();

    const recentActivity = recentAuditDocs.map((log: any) => ({
      id: log._id.toString(),
      action: log.action,
      description: log.metadata?.medicationName
        ? `${log.action.replace(/_/g, ' ')}: ${log.metadata.medicationName} (Batch: ${log.metadata.batchNumber || 'N/A'})`
        : log.action.replace(/_/g, ' '),
      timestamp: new Date(log.timestamp || log.createdAt).toISOString(),
      referenceId: log.resourceId,
    }));

    return {
      metrics: {
        totalActiveMedicines,
        lowStockMedicines,
        outOfStockMedicines,
        expiringMedicines,
        pendingPrescriptions,
        processingOrders,
        completedDispensing,
      },
      prescriptionQueuePreview,
      inventoryAlerts,
      recentActivity,
    };
  }

  /**
   * 4. Medicine Catalogue Operations
   */
  async getMedicines(filter: MedicineCatalogFilterDto): Promise<{
    items: MedicineCatalogItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filter.search) {
      const reg = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ name: reg }, { genericName: reg }, { brandName: reg }];
    }
    if (filter.genericName) {
      query.genericName = new RegExp(filter.genericName.trim(), 'i');
    }
    if (filter.brandName) {
      query.brandName = new RegExp(filter.brandName.trim(), 'i');
    }
    if (filter.category) {
      query.$or = [
        { category: new RegExp(filter.category.trim(), 'i') },
        { therapeuticClass: new RegExp(filter.category.trim(), 'i') },
      ];
    }
    if (filter.dosageForm) {
      query.dosageForm = new RegExp(`^${filter.dosageForm.trim()}$`, 'i');
    }
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    const sortField = filter.sortBy || 'name';
    const sortOrder = filter.sortOrder === 'desc' ? -1 : 1;

    const [items, total] = await Promise.all([
      MedicationCatalogModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      MedicationCatalogModel.countDocuments(query),
    ]);

    return {
      items: items.map((m: any) => this.mapMedicineItem(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getMedicineById(id: string): Promise<MedicineCatalogItemDto> {
    const med = await MedicationCatalogModel.findById(id).lean();
    if (!med) {
      throw AppError.notFound(`Medicine '${id}' not found in catalog`);
    }
    return this.mapMedicineItem(med);
  }

  async createMedicine(input: CreateMedicineCatalogDto): Promise<MedicineCatalogItemDto> {
    // Duplicate check on brandName, strength, dosageForm, manufacturer
    const existing = await MedicationCatalogModel.findOne({
      brandName: { $regex: new RegExp(`^${input.brandName.trim()}$`, 'i') },
      strength: input.strength.trim(),
      dosageForm: { $regex: new RegExp(`^${input.dosageForm.trim()}$`, 'i') },
      manufacturer: { $regex: new RegExp(`^${input.manufacturer.trim()}$`, 'i') },
    });

    if (existing) {
      throw AppError.conflict(
        `Medicine '${input.brandName} (${input.strength} ${input.dosageForm})' by '${input.manufacturer}' already exists in catalog`
      );
    }

    const created = await MedicationCatalogModel.create({
      name: input.name.trim(),
      genericName: input.genericName.trim(),
      brandName: input.brandName.trim(),
      dosageForm: input.dosageForm.trim().toUpperCase(),
      strength: input.strength.trim(),
      route: input.route?.trim() || 'Oral',
      manufacturer: input.manufacturer.trim(),
      category: input.category?.trim() || input.therapeuticClass?.trim() || 'General',
      composition: input.composition?.trim(),
      packSize: input.packSize?.trim(),
      unitOfMeasurement: input.unitOfMeasurement?.trim() || 'tablet',
      packageSize: input.packSize?.trim() || 'Standard Pack',
      schedule: input.schedule?.trim() || 'Schedule H',
      therapeuticClass: input.therapeuticClass?.trim() || input.category?.trim(),
      standardDosageUnit: input.unitOfMeasurement?.trim() || 'tablet',
      description: input.description?.trim(),
      requiresPrescription: input.requiresPrescription !== undefined ? input.requiresPrescription : true,
      isActive: input.isActive !== undefined ? input.isActive : true,
    });

    return this.mapMedicineItem(created);
  }

  async updateMedicine(id: string, input: UpdateMedicineCatalogDto): Promise<MedicineCatalogItemDto> {
    const med = await MedicationCatalogModel.findById(id);
    if (!med) {
      throw AppError.notFound(`Medicine '${id}' not found`);
    }

    if (input.name) med.name = input.name.trim();
    if (input.genericName) med.genericName = input.genericName.trim();
    if (input.brandName) med.brandName = input.brandName.trim();
    if (input.dosageForm) med.dosageForm = input.dosageForm.trim().toUpperCase();
    if (input.strength) med.strength = input.strength.trim();
    if (input.route) med.route = input.route.trim();
    if (input.manufacturer) med.manufacturer = input.manufacturer.trim();
    if (input.category) med.category = input.category.trim();
    if (input.composition !== undefined) med.composition = input.composition.trim();
    if (input.packSize !== undefined) med.packSize = input.packSize.trim();
    if (input.unitOfMeasurement !== undefined) med.unitOfMeasurement = input.unitOfMeasurement.trim();
    if (input.schedule !== undefined) med.schedule = input.schedule.trim();
    if (input.therapeuticClass !== undefined) med.therapeuticClass = input.therapeuticClass.trim();
    if (input.description !== undefined) med.description = input.description.trim();
    if (input.requiresPrescription !== undefined) med.requiresPrescription = input.requiresPrescription;
    if (input.isActive !== undefined) med.isActive = input.isActive;

    await med.save();
    return this.mapMedicineItem(med);
  }

  /**
   * 5. Inventory Batch Management
   */
  async getInventory(
    userId: string,
    filter: PharmacyInventoryFilterDto = {}
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

    const query: Record<string, unknown> = { pharmacyId: userObjectId };

    if (filter.status && filter.status !== 'ALL') {
      if (filter.status === 'ACTIVE') {
        query.status = { $in: ['IN_STOCK', 'LOW_STOCK'] };
      } else {
        query.status = filter.status;
      }
    }

    if (filter.search) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { medicationName: searchRegex },
        { genericName: searchRegex },
        { brandName: searchRegex },
        { batchNumber: searchRegex },
        { rackLocation: searchRegex },
      ];
    }

    if (filter.dosageForm) {
      query.dosageForm = new RegExp(`^${filter.dosageForm.trim()}$`, 'i');
    }

    if (filter.rackLocation) {
      query.rackLocation = new RegExp(filter.rackLocation.trim(), 'i');
    }

    if (filter.expiringWithinDays) {
      const futureDate = new Date(Date.now() + filter.expiringWithinDays * 86400000);
      query.expiryDate = { $lte: futureDate };
      query.status = { $ne: 'EXPIRED' };
    }

    const sortOrder = filter.sortOrder === 'desc' ? -1 : 1;
    let sortObj: Record<string, 1 | -1> = { medicationName: 1, expiryDate: 1 };
    if (filter.sortBy) {
      sortObj = { [filter.sortBy]: sortOrder };
    }

    const [items, total] = await Promise.all([
      PharmacyInventoryModel.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      PharmacyInventoryModel.countDocuments(query),
    ]);

    const mapped = items.map((item: any) => this.mapInventoryItem(item));

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getInventoryById(userId: string, inventoryId: string): Promise<PharmacyInventoryItemDto> {
    const userObjectId = new Types.ObjectId(userId);
    const item = await PharmacyInventoryModel.findOne({
      _id: new Types.ObjectId(inventoryId),
      pharmacyId: userObjectId,
    }).lean();

    if (!item) {
      throw AppError.notFound('Inventory item not found or you lack permission to view it');
    }

    return this.mapInventoryItem(item);
  }

  async createInventoryItem(
    userId: string,
    input: CreatePharmacyInventoryItemDto
  ): Promise<PharmacyInventoryItemDto> {
    const userObjectId = new Types.ObjectId(userId);

    if (input.availableQuantity < 0) {
      throw new AppError('Available quantity cannot be negative', HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST);
    }

    const batch = input.batchNumber.trim().toUpperCase();

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
      supplier: input.supplier?.trim(),
      invoiceNumber: input.invoiceNumber?.trim(),
      batchNumber: batch,
      availableQuantity: input.availableQuantity,
      receivedQuantity: input.receivedQuantity || input.availableQuantity,
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

    // Record transaction in ledger
    await PharmacyInventoryTransactionModel.create({
      transactionReference: this.generateTransactionReference(),
      pharmacyId: userObjectId,
      inventoryId: created._id,
      medicationCatalogId: created.medicationCatalogId,
      medicationName: created.medicationName,
      batchNumber: created.batchNumber,
      transactionType: 'STOCK_RECEIVED',
      quantityChange: created.availableQuantity,
      previousQuantity: 0,
      newQuantity: created.availableQuantity,
      reason: 'Initial batch registration',
      referenceEntity: 'BATCH_CREATION',
      performedBy: userObjectId,
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
   * 6. Stock-In Operation (Receiving New Stock from Supplier / Invoice)
   */
  async receiveStock(userId: string, input: PharmacyStockInDto): Promise<PharmacyInventoryItemDto> {
    const userObjectId = new Types.ObjectId(userId);

    if (input.receivedQuantity <= 0) {
      throw AppError.badRequest('Received quantity must be greater than zero');
    }
    if (input.purchasePrice < 0 || input.sellingPrice < 0) {
      throw AppError.badRequest('Pricing cannot be negative');
    }

    const batch = input.batchNumber.trim().toUpperCase();
    const expiry = new Date(input.expiryDate);
    if (isNaN(expiry.getTime())) {
      throw AppError.badRequest('Invalid expiry date');
    }

    let catalogId: Types.ObjectId | undefined;
    if (input.medicationCatalogId) {
      catalogId = new Types.ObjectId(input.medicationCatalogId);
    }

    // Check if this batch already exists for this pharmacy
    const existing = await PharmacyInventoryModel.findOne({
      pharmacyId: userObjectId,
      batchNumber: batch,
      medicationName: input.medicationName.trim(),
    });

    let targetBatch: any;
    let previousQuantity = 0;
    let newQuantity = 0;

    if (existing) {
      previousQuantity = existing.availableQuantity;
      newQuantity = previousQuantity + input.receivedQuantity;

      existing.availableQuantity = newQuantity;
      existing.receivedQuantity = (existing.receivedQuantity || previousQuantity) + input.receivedQuantity;
      existing.purchasePrice = input.purchasePrice;
      existing.sellingPrice = input.sellingPrice;
      if (input.mrp !== undefined) existing.mrp = input.mrp;
      if (input.supplier) existing.supplier = input.supplier.trim();
      if (input.rackLocation) existing.rackLocation = input.rackLocation.trim();
      if (input.invoiceReference) existing.invoiceNumber = input.invoiceReference.trim();

      // Recalculate status
      const now = new Date();
      if (existing.isQuarantined || existing.status === 'QUARANTINED') {
        existing.status = 'QUARANTINED';
      } else if (new Date(existing.expiryDate) < now) {
        existing.status = 'EXPIRED';
      } else if (newQuantity === 0) {
        existing.status = 'OUT_OF_STOCK';
      } else if (newQuantity <= existing.reorderLevel) {
        existing.status = 'LOW_STOCK';
      } else {
        existing.status = 'IN_STOCK';
      }

      await existing.save();
      targetBatch = existing;
    } else {
      previousQuantity = 0;
      newQuantity = input.receivedQuantity;

      const now = new Date();
      let status: InventoryStockStatus = 'IN_STOCK';
      if (expiry < now) {
        status = 'EXPIRED';
      } else if (newQuantity <= (input.reorderLevel || 20)) {
        status = 'LOW_STOCK';
      }

      targetBatch = await PharmacyInventoryModel.create({
        pharmacyId: userObjectId,
        medicationCatalogId: catalogId,
        medicationName: input.medicationName.trim(),
        genericName: input.genericName?.trim(),
        brandName: input.brandName?.trim(),
        dosageForm: input.dosageForm.trim(),
        strength: input.strength.trim(),
        manufacturer: input.manufacturer?.trim(),
        supplier: input.supplier?.trim(),
        invoiceNumber: input.invoiceReference?.trim(),
        batchNumber: batch,
        receivedQuantity: input.receivedQuantity,
        availableQuantity: newQuantity,
        reservedQuantity: 0,
        reorderLevel: input.reorderLevel || 20,
        purchasePrice: input.purchasePrice,
        sellingPrice: input.sellingPrice,
        mrp: input.mrp,
        manufacturingDate: input.manufacturingDate ? new Date(input.manufacturingDate) : undefined,
        expiryDate: expiry,
        status,
        rackLocation: input.rackLocation?.trim(),
      });
    }

    // Append-only ledger transaction
    const txnRef = this.generateTransactionReference();
    await PharmacyInventoryTransactionModel.create({
      transactionReference: txnRef,
      pharmacyId: userObjectId,
      inventoryId: targetBatch._id,
      medicationCatalogId: targetBatch.medicationCatalogId,
      medicationName: targetBatch.medicationName,
      batchNumber: targetBatch.batchNumber,
      transactionType: 'STOCK_RECEIVED',
      quantityChange: input.receivedQuantity,
      previousQuantity,
      newQuantity,
      reason: input.notes || `Stock intake received from ${input.supplier || 'supplier'}`,
      referenceEntity: 'SUPPLIER_INVOICE',
      referenceId: input.invoiceReference || txnRef,
      performedBy: userObjectId,
      notes: input.notes,
    });

    await this.recordAudit({
      actorId: userId,
      action: 'STOCK_RECEIVED',
      resourceType: 'PHARMACY_INVENTORY',
      resourceId: targetBatch._id.toString(),
      metadata: {
        batchNumber: targetBatch.batchNumber,
        receivedQuantity: input.receivedQuantity,
        newQuantity,
        invoiceReference: input.invoiceReference,
      },
    });

    return this.mapInventoryItem(targetBatch);
  }

  /**
   * 7. Stock Adjustment Operation (Increase, Decrease, Damage, Expired, Quarantine, Release)
   */
  async adjustStock(userId: string, input: PharmacyStockAdjustmentDto): Promise<PharmacyInventoryItemDto> {
    const userObjectId = new Types.ObjectId(userId);

    if (input.quantity <= 0) {
      throw AppError.badRequest('Adjustment quantity must be greater than zero');
    }
    if (!input.reason || input.reason.trim().length < 3) {
      throw AppError.badRequest('A specific reason of at least 3 characters is mandatory for every adjustment');
    }

    const batch = await PharmacyInventoryModel.findOne({
      _id: new Types.ObjectId(input.inventoryId),
      pharmacyId: userObjectId,
    });

    if (!batch) {
      throw AppError.notFound('Inventory batch not found or you lack permission to adjust it');
    }

    const previousQuantity = batch.availableQuantity;
    let newQuantity = previousQuantity;
    let quantityChange = 0;
    let txnType: any = 'STOCK_ADJUSTED';

    switch (input.adjustmentType) {
      case 'INCREASE':
        quantityChange = input.quantity;
        newQuantity = previousQuantity + input.quantity;
        txnType = 'STOCK_ADJUSTED';
        break;

      case 'DECREASE':
      case 'CORRECTION':
        if (previousQuantity < input.quantity) {
          throw AppError.badRequest(
            `Cannot decrease ${input.quantity} units; only ${previousQuantity} available in batch ${batch.batchNumber}`
          );
        }
        quantityChange = -input.quantity;
        newQuantity = previousQuantity - input.quantity;
        txnType = 'STOCK_ADJUSTED';
        break;

      case 'DAMAGE':
        if (previousQuantity < input.quantity) {
          throw AppError.badRequest(
            `Cannot record ${input.quantity} damaged units; only ${previousQuantity} available`
          );
        }
        quantityChange = -input.quantity;
        newQuantity = previousQuantity - input.quantity;
        txnType = 'STOCK_DAMAGED';
        break;

      case 'EXPIRED_REMOVAL':
        if (previousQuantity < input.quantity) {
          throw AppError.badRequest(
            `Cannot remove ${input.quantity} expired units; only ${previousQuantity} in batch`
          );
        }
        quantityChange = -input.quantity;
        newQuantity = previousQuantity - input.quantity;
        txnType = 'STOCK_EXPIRED';
        break;

      case 'QUARANTINE':
        batch.isQuarantined = true;
        batch.quarantineReason = input.reason.trim();
        batch.status = 'QUARANTINED';
        quantityChange = 0;
        txnType = 'STOCK_QUARANTINED';
        break;

      case 'RELEASE_QUARANTINE':
        batch.isQuarantined = false;
        batch.quarantineReason = undefined;
        quantityChange = 0;
        txnType = 'STOCK_RELEASED';
        break;

      default:
        throw AppError.badRequest('Unsupported adjustment type');
    }

    batch.availableQuantity = newQuantity;

    // Recalculate stock status unless quarantined
    if (batch.isQuarantined) {
      batch.status = 'QUARANTINED';
    } else {
      const now = new Date();
      if (new Date(batch.expiryDate) < now) {
        batch.status = 'EXPIRED';
      } else if (newQuantity === 0) {
        batch.status = 'OUT_OF_STOCK';
      } else if (newQuantity <= batch.reorderLevel) {
        batch.status = 'LOW_STOCK';
      } else {
        batch.status = 'IN_STOCK';
      }
    }

    await batch.save();

    // Append-only ledger transaction
    const txnRef = this.generateTransactionReference();
    await PharmacyInventoryTransactionModel.create({
      transactionReference: txnRef,
      pharmacyId: userObjectId,
      inventoryId: batch._id,
      medicationCatalogId: batch.medicationCatalogId,
      medicationName: batch.medicationName,
      batchNumber: batch.batchNumber,
      transactionType: txnType,
      quantityChange,
      previousQuantity,
      newQuantity,
      reason: input.reason.trim(),
      referenceEntity: 'MANUAL_ADJUSTMENT',
      referenceId: txnRef,
      performedBy: userObjectId,
      notes: input.notes?.trim(),
    });

    await this.recordAudit({
      actorId: userId,
      action: txnType,
      resourceType: 'PHARMACY_INVENTORY',
      resourceId: batch._id.toString(),
      metadata: {
        batchNumber: batch.batchNumber,
        adjustmentType: input.adjustmentType,
        quantityChange,
        newQuantity,
        reason: input.reason,
      },
    });

    return this.mapInventoryItem(batch);
  }

  async quarantineBatch(
    userId: string,
    inventoryId: string,
    dto: QuarantineBatchDto
  ): Promise<PharmacyInventoryItemDto> {
    return this.adjustStock(userId, {
      inventoryId,
      adjustmentType: 'QUARANTINE',
      quantity: 1, // Placeholder quantity for status flag toggle
      reason: dto.reason,
      notes: dto.notes,
    });
  }

  async releaseQuarantinedBatch(
    userId: string,
    inventoryId: string,
    dto: ReleaseBatchDto
  ): Promise<PharmacyInventoryItemDto> {
    return this.adjustStock(userId, {
      inventoryId,
      adjustmentType: 'RELEASE_QUARANTINE',
      quantity: 1,
      reason: dto.reason,
      notes: dto.notes,
    });
  }

  /**
   * 8. Inventory Transaction Ledger (Append-Only)
   */
  async getTransactions(
    userId: string,
    filter: InventoryTransactionFilterDto = {}
  ): Promise<{
    items: PharmacyInventoryTransactionDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { pharmacyId: userObjectId };

    if (filter.inventoryId) {
      query.inventoryId = new Types.ObjectId(filter.inventoryId);
    }
    if (filter.transactionType && filter.transactionType !== 'ALL') {
      query.transactionType = filter.transactionType;
    }
    if (filter.batchNumber) {
      query.batchNumber = new RegExp(`^${filter.batchNumber.trim()}$`, 'i');
    }
    if (filter.search) {
      const reg = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ medicationName: reg }, { batchNumber: reg }, { transactionReference: reg }, { reason: reg }];
    }
    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) (query.createdAt as any).$gte = new Date(filter.startDate);
      if (filter.endDate) (query.createdAt as any).$lte = new Date(filter.endDate);
    }

    const [txns, total] = await Promise.all([
      PharmacyInventoryTransactionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name email')
        .lean(),
      PharmacyInventoryTransactionModel.countDocuments(query),
    ]);

    const mapped: PharmacyInventoryTransactionDto[] = txns.map((t: any) => ({
      id: t._id.toString(),
      transactionReference: t.transactionReference,
      pharmacyId: t.pharmacyId.toString(),
      inventoryId: t.inventoryId.toString(),
      medicationCatalogId: t.medicationCatalogId?.toString(),
      medicationName: t.medicationName,
      batchNumber: t.batchNumber,
      transactionType: t.transactionType,
      quantityChange: t.quantityChange,
      previousQuantity: t.previousQuantity,
      newQuantity: t.newQuantity,
      reason: t.reason,
      referenceEntity: t.referenceEntity,
      referenceId: t.referenceId,
      performedBy: t.performedBy?._id?.toString() || t.performedBy?.toString(),
      performedByName: (t.performedBy as any)?.name || 'Authorized Pharmacist',
      notes: t.notes,
      createdAt: new Date(t.createdAt).toISOString(),
    }));

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getTransactionById(userId: string, transactionId: string): Promise<PharmacyInventoryTransactionDto> {
    const userObjectId = new Types.ObjectId(userId);
    const t = await PharmacyInventoryTransactionModel.findOne({
      _id: new Types.ObjectId(transactionId),
      pharmacyId: userObjectId,
    })
      .populate('performedBy', 'name email')
      .lean();

    if (!t) {
      throw AppError.notFound(`Inventory transaction '${transactionId}' not found`);
    }

    return {
      id: t._id.toString(),
      transactionReference: t.transactionReference,
      pharmacyId: t.pharmacyId.toString(),
      inventoryId: t.inventoryId.toString(),
      medicationCatalogId: t.medicationCatalogId?.toString(),
      medicationName: t.medicationName,
      batchNumber: t.batchNumber,
      transactionType: t.transactionType,
      quantityChange: t.quantityChange,
      previousQuantity: t.previousQuantity,
      newQuantity: t.newQuantity,
      reason: t.reason,
      referenceEntity: t.referenceEntity,
      referenceId: t.referenceId,
      performedBy: t.performedBy?._id?.toString() || t.performedBy?.toString(),
      performedByName: (t.performedBy as any)?.name || 'Authorized Pharmacist',
      notes: t.notes,
      createdAt: new Date(t.createdAt).toISOString(),
    };
  }

  /**
   * 9. Expiry Monitoring & Reports
   */
  async getExpiryReport(
    userId: string,
    filter: { horizon?: string; search?: string; page?: number; limit?: number } = {}
  ): Promise<PharmacyExpiryReportSummaryDto> {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();
    const d7 = new Date(now.getTime() + 7 * 86400000);
    const d30 = new Date(now.getTime() + 30 * 86400000);
    const d90 = new Date(now.getTime() + 90 * 86400000);

    const query: Record<string, unknown> = { pharmacyId: userObjectId };
    if (filter.search) {
      const reg = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ medicationName: reg }, { batchNumber: reg }];
    }

    const allBatches = await PharmacyInventoryModel.find(query)
      .sort({ expiryDate: 1, availableQuantity: -1 })
      .lean();

    let expiredCount = 0;
    let expiring7DaysCount = 0;
    let expiring30DaysCount = 0;
    let expiring90DaysCount = 0;
    let safeCount = 0;
    let expiredUnits = 0;
    let expiring30DaysUnits = 0;

    const classified: PharmacyExpiryReportItemDto[] = [];

    for (const b of allBatches) {
      const exp = new Date(b.expiryDate);
      const diffMs = exp.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let horizon: ExpiryHorizon = 'SAFE';
      if (exp <= now) {
        horizon = 'EXPIRED';
        expiredCount++;
        expiredUnits += b.availableQuantity;
      } else if (exp <= d7) {
        horizon = 'EXPIRING_7_DAYS';
        expiring7DaysCount++;
        expiring30DaysUnits += b.availableQuantity;
      } else if (exp <= d30) {
        horizon = 'EXPIRING_30_DAYS';
        expiring30DaysCount++;
        expiring30DaysUnits += b.availableQuantity;
      } else if (exp <= d90) {
        horizon = 'EXPIRING_90_DAYS';
        expiring90DaysCount++;
      } else {
        horizon = 'SAFE';
        safeCount++;
      }

      if (!filter.horizon || filter.horizon === 'ALL' || filter.horizon === horizon) {
        classified.push({
          id: b._id.toString(),
          inventoryId: b._id.toString(),
          medicationName: b.medicationName,
          genericName: b.genericName,
          brandName: b.brandName,
          dosageForm: b.dosageForm,
          strength: b.strength,
          batchNumber: b.batchNumber,
          availableQuantity: b.availableQuantity,
          purchasePrice: b.purchasePrice,
          sellingPrice: b.sellingPrice,
          expiryDate: exp.toISOString(),
          daysUntilExpiry,
          horizon,
          status: b.status,
          rackLocation: b.rackLocation,
        });
      }
    }

    return {
      expiredCount,
      expiring7DaysCount,
      expiring30DaysCount,
      expiring90DaysCount,
      safeCount,
      expiredUnits,
      expiring30DaysUnits,
      items: classified,
    };
  }

  /**
   * 10. Low-Stock & Critical Alerts Summary
   */
  async getAlertsSummary(userId: string): Promise<PharmacyAlertsSummaryDto> {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();
    const d30 = new Date(now.getTime() + 30 * 86400000);

    const [lowStockDocs, outOfStockDocs, nearExpiryDocs, expiredDocs, quarantinedDocs] = await Promise.all([
      PharmacyInventoryModel.find({
        pharmacyId: userObjectId,
        status: 'LOW_STOCK',
      }).lean(),
      PharmacyInventoryModel.find({
        pharmacyId: userObjectId,
        availableQuantity: 0,
      }).lean(),
      PharmacyInventoryModel.find({
        pharmacyId: userObjectId,
        expiryDate: { $lte: d30, $gt: now },
        status: { $ne: 'EXPIRED' },
      }).lean(),
      PharmacyInventoryModel.find({
        pharmacyId: userObjectId,
        $or: [{ status: 'EXPIRED' }, { expiryDate: { $lte: now } }],
      }).lean(),
      PharmacyInventoryModel.find({
        pharmacyId: userObjectId,
        $or: [{ status: 'QUARANTINED' }, { isQuarantined: true }],
      }).lean(),
    ]);

    const lowStockAlerts = lowStockDocs.map((i: any) => ({
      inventoryId: i._id.toString(),
      medicationName: i.medicationName,
      batchNumber: i.batchNumber,
      availableQuantity: i.availableQuantity,
      reorderLevel: i.reorderLevel,
      rackLocation: i.rackLocation,
    }));

    const outOfStockAlerts = outOfStockDocs.map((i: any) => ({
      inventoryId: i._id.toString(),
      medicationName: i.medicationName,
      batchNumber: i.batchNumber,
      rackLocation: i.rackLocation,
    }));

    const nearExpiryAlerts = nearExpiryDocs.map((i: any) => {
      const exp = new Date(i.expiryDate);
      const daysRemaining = Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        inventoryId: i._id.toString(),
        medicationName: i.medicationName,
        batchNumber: i.batchNumber,
        expiryDate: exp.toISOString(),
        daysRemaining,
        availableQuantity: i.availableQuantity,
        rackLocation: i.rackLocation,
      };
    });

    const expiredAlerts = expiredDocs.map((i: any) => ({
      inventoryId: i._id.toString(),
      medicationName: i.medicationName,
      batchNumber: i.batchNumber,
      expiryDate: new Date(i.expiryDate).toISOString(),
      availableQuantity: i.availableQuantity,
      rackLocation: i.rackLocation,
    }));

    const quarantinedAlerts = quarantinedDocs.map((i: any) => ({
      inventoryId: i._id.toString(),
      medicationName: i.medicationName,
      batchNumber: i.batchNumber,
      availableQuantity: i.availableQuantity,
      reason: i.quarantineReason || 'Under Quality Investigation',
      rackLocation: i.rackLocation,
    }));

    const totalAlertsCount =
      lowStockAlerts.length +
      outOfStockAlerts.length +
      nearExpiryAlerts.length +
      expiredAlerts.length +
      quarantinedAlerts.length;

    return {
      lowStockAlerts,
      outOfStockAlerts,
      nearExpiryAlerts,
      expiredAlerts,
      quarantinedAlerts,
      totalAlertsCount,
    };
  }

  /**
   * 11. Inventory Analytics & Stock Valuation
   * Stock Valuation Rule:
   * Estimated Valuation = sum(availableQuantity * purchasePrice) strictly for eligible (active/in-stock/low-stock) stock.
   * Expired and Quarantined valuations are segregated and reported separately.
   */
  async getInventoryAnalytics(userId: string): Promise<PharmacyInventoryAnalyticsDto> {
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();
    const d30 = new Date(now.getTime() + 30 * 86400000);

    const allBatches = await PharmacyInventoryModel.find({ pharmacyId: userObjectId }).lean();

    const uniqueMedsSet = new Set<string>();
    let totalActiveBatches = 0;
    let totalAvailableUnits = 0;
    let lowStockBatchesCount = 0;
    let outOfStockMedicinesCount = 0;
    let nearExpiryBatchesCount = 0;
    let expiredBatchesCount = 0;
    let quarantinedBatchesCount = 0;

    let estimatedValuation = 0;
    let quarantinedValuation = 0;
    let expiredValuation = 0;

    const dosageFormMap: Record<string, { count: number; units: number }> = {};
    const statusMap: Record<string, number> = {};

    for (const b of allBatches) {
      uniqueMedsSet.add(b.medicationName.toLowerCase());
      const pPrice = Number(b.purchasePrice) || 0;
      const isExpired = new Date(b.expiryDate) < now || b.status === 'EXPIRED';
      const isQuarantined = Boolean(b.isQuarantined) || b.status === 'QUARANTINED';

      // Status counters
      statusMap[b.status] = (statusMap[b.status] || 0) + 1;

      // Dosage form counts
      const formKey = (b.dosageForm || 'OTHER').toUpperCase();
      if (!dosageFormMap[formKey]) {
        dosageFormMap[formKey] = { count: 0, units: 0 };
      }
      dosageFormMap[formKey].count += 1;
      dosageFormMap[formKey].units += b.availableQuantity;

      if (isQuarantined) {
        quarantinedBatchesCount++;
        quarantinedValuation += b.availableQuantity * pPrice;
      } else if (isExpired) {
        expiredBatchesCount++;
        expiredValuation += b.availableQuantity * pPrice;
      } else {
        totalAvailableUnits += b.availableQuantity;
        if (b.availableQuantity > 0) {
          totalActiveBatches++;
          estimatedValuation += b.availableQuantity * pPrice;
        } else {
          outOfStockMedicinesCount++;
        }

        if (b.availableQuantity > 0 && b.availableQuantity <= b.reorderLevel) {
          lowStockBatchesCount++;
        }

        if (new Date(b.expiryDate) <= d30) {
          nearExpiryBatchesCount++;
        }
      }
    }

    const dosageFormDistribution = Object.entries(dosageFormMap).map(([dosageForm, val]) => ({
      dosageForm,
      count: val.count,
      units: val.units,
    }));

    const stockStatusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Recent stock transactions
    const recentTxns = await PharmacyInventoryTransactionModel.find({ pharmacyId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('performedBy', 'name')
      .lean();

    const recentStockMovements: PharmacyInventoryTransactionDto[] = recentTxns.map((t: any) => ({
      id: t._id.toString(),
      transactionReference: t.transactionReference,
      pharmacyId: t.pharmacyId.toString(),
      inventoryId: t.inventoryId.toString(),
      medicationCatalogId: t.medicationCatalogId?.toString(),
      medicationName: t.medicationName,
      batchNumber: t.batchNumber,
      transactionType: t.transactionType,
      quantityChange: t.quantityChange,
      previousQuantity: t.previousQuantity,
      newQuantity: t.newQuantity,
      reason: t.reason,
      referenceEntity: t.referenceEntity,
      referenceId: t.referenceId,
      performedBy: t.performedBy?._id?.toString() || t.performedBy?.toString(),
      performedByName: t.performedBy?.name || 'Pharmacist',
      notes: t.notes,
      createdAt: new Date(t.createdAt).toISOString(),
    }));

    return {
      totalUniqueMedicines: uniqueMedsSet.size,
      totalActiveBatches,
      totalAvailableUnits,
      lowStockBatchesCount,
      outOfStockMedicinesCount,
      nearExpiryBatchesCount,
      expiredBatchesCount,
      quarantinedBatchesCount,
      estimatedValuation: Math.round(estimatedValuation * 100) / 100,
      quarantinedValuation: Math.round(quarantinedValuation * 100) / 100,
      expiredValuation: Math.round(expiredValuation * 100) / 100,
      dosageFormDistribution,
      stockStatusDistribution,
      recentStockMovements,
    };
  }

  /**
   * 12. Prescription queue for authorized pharmacy access (Preserved from Task 01)
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
   * 13. Retrieve authorized prescription details
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
      throw AppError.notFound('Prescription not found, is still in draft state, or you lack authorization to view it');
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
   * 14. Pharmacy Orders (Preserved from Task 01)
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

    const query: Record<string, unknown> = { pharmacyId: userObjectId };
    if (filter.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    if (filter.search) {
      const reg = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ orderNumber: reg }, { notes: reg }];
    }

    const [orders, total] = await Promise.all([
      PharmacyOrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('patientId', 'name phone')
        .populate('prescriptionId', 'prescriptionNumber')
        .lean(),
      PharmacyOrderModel.countDocuments(query),
    ]);

    const mapped: PharmacyOrderDto[] = orders.map((ord: any) => {
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

  async createOrder(userId: string, input: CreatePharmacyOrderDto): Promise<PharmacyOrderDto> {
    const userObjectId = new Types.ObjectId(userId);

    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
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

  /**
   * ============================================================================
   * DAY 5 TASK 03: PRESCRIPTION VERIFICATION, MATCHING & DISPENSING METHODS
   * ============================================================================
   */

  private mapDispensingRecordToDto(record: any): DispensingRecordDto {
    return {
      id: record._id.toString(),
      dispensingNumber: record.dispensingNumber,
      pharmacyId: record.pharmacyId.toString(),
      pharmacyName: record.pharmacyName,
      pharmacyLicenseNumber: record.pharmacyLicenseNumber,
      pharmacyGstin: record.pharmacyGstin,
      pharmacyAddress: record.pharmacyAddress,
      prescriptionId: record.prescriptionId.toString(),
      prescriptionNumber: record.prescriptionNumber,
      patientId: record.patientId.toString(),
      patientName: record.patientName,
      patientPhone: record.patientPhone,
      patientGender: record.patientGender,
      patientAge: record.patientAge,
      doctorId: record.doctorId.toString(),
      doctorName: record.doctorName,
      doctorSpecialization: record.doctorSpecialization,
      facilityName: record.facilityName,
      dispensedBy: record.dispensedBy.toString(),
      dispenserName: record.dispenserName,
      dispensedAt: toIsoSafe(record.dispensedAt),
      dispensingStatus: record.dispensingStatus,
      items: (record.items || []).map((it: any) => ({
        id: it._id?.toString() || it.prescriptionMedicationId,
        prescriptionMedicationId: it.prescriptionMedicationId,
        medicationCatalogId: it.medicationCatalogId?.toString(),
        inventoryId: it.inventoryId.toString(),
        medicationName: it.medicationName,
        genericName: it.genericName,
        brandName: it.brandName,
        strength: it.strength,
        dosageForm: it.dosageForm,
        batchNumber: it.batchNumber,
        prescribedQuantity: it.prescribedQuantity,
        previouslyDispensedQuantity: it.previouslyDispensedQuantity || 0,
        quantityDispensed: it.quantityDispensed,
        remainingQuantity: it.remainingQuantity,
        dispensedUnit: it.dispensedUnit || 'Units',
        batchExpiryDate: toIsoSafe(it.batchExpiryDate),
        sellingPriceSnapshot: it.sellingPriceSnapshot,
        itemTotal: it.itemTotal,
        dosageInstructions: it.dosageInstructions,
      })),
      totalItems: record.totalItems,
      totalQuantityDispensed: record.totalQuantityDispensed,
      totalAmount: record.totalAmount,
      notes: record.notes,
      idempotencyKey: record.idempotencyKey,
      cancellationReason: record.cancellationReason,
      cancelledAt: record.cancelledAt ? toIsoSafe(record.cancelledAt) : undefined,
      cancelledByName: record.cancelledByName,
      createdAt: toIsoSafe(record.createdAt),
    };
  }

  /**
   * 1. Prescription Verification & Authenticity Check
   */
  async verifyPrescription(
    _userId: string,
    prescriptionId: string
  ): Promise<PrescriptionVerificationDto> {
    const rx = await PrescriptionModel.findById(prescriptionId)
      .populate('patientId', 'name phone')
      .populate('doctorId', 'name specialization')
      .populate('facilityId', 'name')
      .lean();

    if (!rx) {
      throw AppError.notFound('Prescription not found');
    }

    const patient = rx.patientId as any;
    const doctor = rx.doctorId as any;
    const facility = rx.facilityId as any;

    let patientAge: number | undefined;
    let patientGender: string | undefined;

    if (patient?._id) {
      const pProfile = await PatientProfileModel.findOne({ userId: patient._id }).lean();
      if (pProfile) {
        patientGender = pProfile.gender;
        if (pProfile.dateOfBirth) {
          const diff = Date.now() - new Date(pProfile.dateOfBirth).getTime();
          patientAge = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
        }
      }
    }

    let doctorLicense: string | undefined;
    if (doctor?._id) {
      const dProfile = await DoctorProfileModel.findOne({ userId: doctor._id }).lean();
      if (dProfile) {
        doctorLicense = dProfile.registrationNumber;
      }
    }

    const existingDispensings = await DispensingRecordModel.find({
      prescriptionId: rx._id,
      dispensingStatus: { $ne: 'CANCELLED' },
    }).lean();

    const previouslyDispensedMap: Record<string, number> = {};
    for (const disp of existingDispensings) {
      for (const item of disp.items || []) {
        const k = item.prescriptionMedicationId;
        previouslyDispensedMap[k] = (previouslyDispensedMap[k] || 0) + item.quantityDispensed;
      }
    }

    const items: PrescriptionVerificationItemDto[] = (rx.medications || []).map((m: any) => {
      const medId = m._id?.toString() || m.name;
      const prescribedQty = m.quantity || 1;
      const previouslyDispensed = previouslyDispensedMap[medId] || 0;
      const remainingQty = Math.max(0, prescribedQty - previouslyDispensed);
      return {
        prescribedMedicationId: medId,
        medicationName: m.name || m.medicationName || 'Medication',
        genericName: m.genericName,
        strength: m.strength,
        dosageForm: m.dosageForm || 'Tablet',
        dosage: m.dosage || 'As directed',
        frequency: m.frequency || '1-0-1',
        duration: m.duration || '5 days',
        prescribedQuantity: prescribedQty,
        previouslyDispensedQuantity: previouslyDispensed,
        remainingQuantity: remainingQty,
        isFullyDispensed: remainingQty === 0,
        instructions: m.instructions,
      };
    });

    const totalPrescribedUnits = items.reduce((sum, it) => sum + it.prescribedQuantity, 0);
    const totalRemainingUnits = items.reduce((sum, it) => sum + it.remainingQuantity, 0);

    const prescriptionExists = true;
    const isNotDraft = !rx.isDraft;
    const doctorExists = Boolean(doctor?._id || rx.doctorId);
    const patientExists = Boolean(patient?._id || rx.patientId);
    const notExpired = rx.validUntil ? new Date(rx.validUntil).getTime() > Date.now() : true;
    const notCancelled = rx.status !== 'CANCELLED' && rx.status !== 'DISCONTINUED';
    const notFullyDispensed =
      rx.status !== 'DISPENSED' && rx.status !== 'COMPLETED' && totalRemainingUnits > 0;
    const pharmacyPermitted = true;

    const isEligibleForDispensing =
      isNotDraft && doctorExists && patientExists && notExpired && notCancelled && notFullyDispensed;

    const verificationErrors: string[] = [];
    if (!isNotDraft) verificationErrors.push('Prescription is still in draft state and has not been issued.');
    if (!doctorExists) verificationErrors.push('Prescribing doctor identity could not be verified.');
    if (!patientExists) verificationErrors.push('Patient identity could not be verified.');
    if (!notExpired) verificationErrors.push('Prescription has expired past its validity window.');
    if (!notCancelled) verificationErrors.push(`Prescription has been marked as ${rx.status.toLowerCase()}.`);
    if (!notFullyDispensed) verificationErrors.push('Prescription has already been fully dispensed.');

    let verificationStatus: 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'ALREADY_DISPENSED' | 'REVOKED' = 'VERIFIED';
    if (!notExpired) {
      verificationStatus = 'EXPIRED';
    } else if (!notCancelled) {
      verificationStatus = 'REVOKED';
    } else if (!notFullyDispensed) {
      verificationStatus = 'ALREADY_DISPENSED';
    } else if (!isEligibleForDispensing) {
      verificationStatus = 'REJECTED';
    }

    return {
      prescriptionId: rx._id.toString(),
      prescriptionNumber: rx.prescriptionNumber,
      isEligibleForDispensing,
      verificationStatus,
      verificationChecks: {
        prescriptionExists,
        isNotDraft,
        doctorExists,
        patientExists,
        notExpired,
        notCancelled,
        notFullyDispensed,
        pharmacyPermitted,
      },
      verificationErrors,
      patient: {
        id: patient?._id?.toString() || rx.patientId.toString(),
        name: patient?.name || 'Authorized Patient',
        phone: patient?.phone,
        age: patientAge,
        gender: patientGender,
      },
      doctor: {
        id: doctor?._id?.toString() || rx.doctorId.toString(),
        name: doctor?.name ? `Dr. ${doctor.name}` : 'Treating Physician',
        specialization: Array.isArray(doctor?.specialization)
          ? doctor.specialization[0]
          : doctor?.specialization,
        licenseNumber: doctorLicense,
      },
      facilityName: facility?.name,
      issueDate: toIsoSafe(rx.issuedAt || rx.createdAt),
      validUntil: toIsoSafe(rx.validUntil, new Date(Date.now() + 30 * 86400000)),
      prescriptionStatus: rx.status,
      instructions: rx.instructions || '',
      items,
      totalItemsCount: items.length,
      totalPrescribedUnits,
      totalRemainingUnits,
    };
  }

  /**
   * 2. Medicine Matching Engine & FEFO Batch Recommendation
   */
  async matchPrescriptionInventory(
    userId: string,
    prescriptionId: string
  ): Promise<MedicineMatchResultDto[]> {
    const userObjectId = new Types.ObjectId(userId);
    const rx = await PrescriptionModel.findById(prescriptionId).lean();
    if (!rx) {
      throw AppError.notFound('Prescription not found');
    }

    const existingDispensings = await DispensingRecordModel.find({
      prescriptionId: rx._id,
      dispensingStatus: { $ne: 'CANCELLED' },
    }).lean();

    const previouslyDispensedMap: Record<string, number> = {};
    for (const disp of existingDispensings) {
      for (const item of disp.items || []) {
        const k = item.prescriptionMedicationId;
        previouslyDispensedMap[k] = (previouslyDispensedMap[k] || 0) + item.quantityDispensed;
      }
    }

    const results: MedicineMatchResultDto[] = [];

    for (const m of (rx.medications || []) as any[]) {
      const medId = m._id?.toString() || m.name;
      const prescribedQuantity = m.quantity || 1;
      const previouslyDispensedQuantity = previouslyDispensedMap[medId] || 0;
      const remainingQuantity = Math.max(0, prescribedQuantity - previouslyDispensedQuantity);

      const nameRegex = new RegExp(escapeRegex(m.name || ''), 'i');
      const genericRegex = m.genericName ? new RegExp(escapeRegex(m.genericName), 'i') : nameRegex;

      const orConditions: any[] = [
        { medicationName: nameRegex },
        { genericName: genericRegex },
        { brandName: nameRegex },
      ];
      if (m.medicationCatalogId) {
        orConditions.push({ medicationCatalogId: m.medicationCatalogId });
      }

      const allCandidates = await PharmacyInventoryModel.find({
        pharmacyId: userObjectId,
        $or: orConditions,
        status: { $ne: 'DISCONTINUED' },
      })
        .sort({ expiryDate: 1, availableQuantity: -1 })
        .lean();

      const now = Date.now();
      const validBatches = allCandidates.filter(
        (b) =>
          new Date(b.expiryDate).getTime() > now &&
          !b.isQuarantined &&
          b.status !== 'EXPIRED' &&
          b.status !== 'QUARANTINED' &&
          b.availableQuantity > 0
      );

      const totalValidStock = validBatches.reduce((sum, b) => sum + b.availableQuantity, 0);
      const hasExpiredCandidates = allCandidates.some(
        (b) => new Date(b.expiryDate).getTime() <= now || b.status === 'EXPIRED'
      );
      const hasQuarantinedCandidates = allCandidates.some(
        (b) => b.isQuarantined || b.status === 'QUARANTINED'
      );

      let matchStatus: MedicineMatchStatus = 'NO_MATCH';
      let matchMessage = 'No matching medicine found in inventory.';

      if (allCandidates.length === 0) {
        matchStatus = 'NO_MATCH';
        matchMessage = 'No matching medicine found in pharmacy inventory.';
      } else if (validBatches.length === 0) {
        if (hasQuarantinedCandidates && !hasExpiredCandidates) {
          matchStatus = 'QUARANTINED_ONLY';
          matchMessage = 'Matching inventory exists but all batches are currently quarantined.';
        } else if (hasExpiredCandidates) {
          matchStatus = 'EXPIRED_ONLY';
          matchMessage = 'Matching inventory exists but all batches are expired.';
        } else {
          matchStatus = 'INSUFFICIENT_STOCK';
          matchMessage = 'Matching medicine found, but zero available stock in inventory.';
        }
      } else if (totalValidStock < remainingQuantity) {
        matchStatus = 'INSUFFICIENT_STOCK';
        matchMessage = `Insufficient stock: only ${totalValidStock} units available for ${remainingQuantity} remaining prescribed.`;
      } else {
        const exactMatch = validBatches.some(
          (b) =>
            b.medicationName.toLowerCase() === (m.name || '').toLowerCase() ||
            (b.brandName && b.brandName.toLowerCase() === (m.brandName || m.name || '').toLowerCase())
        );
        if (exactMatch) {
          matchStatus = 'EXACT_MATCH';
          matchMessage = `Exact medicine match available (${totalValidStock} units in stock across ${validBatches.length} batch${validBatches.length > 1 ? 'es' : ''}).`;
        } else {
          matchStatus = 'ACCEPTABLE_MATCH';
          matchMessage = `Acceptable generic match available (${totalValidStock} units in stock). No silent substitution permitted.`;
        }
      }

      let suggestedBatch: CandidateBatchOptionDto | undefined;
      const candidateBatches: CandidateBatchOptionDto[] = validBatches.map((b, idx) => {
        const isFefoSuggested = idx === 0;
        const dto: CandidateBatchOptionDto = {
          inventoryId: b._id.toString(),
          batchNumber: b.batchNumber,
          medicationName: b.medicationName,
          strength: b.strength,
          dosageForm: b.dosageForm,
          availableQuantity: b.availableQuantity,
          expiryDate: new Date(b.expiryDate).toISOString(),
          sellingPrice: b.sellingPrice,
          purchasePrice: b.purchasePrice,
          mrp: b.mrp,
          rackLocation: b.rackLocation,
          supplier: b.supplier,
          isFefoSuggested,
        };
        if (isFefoSuggested) {
          suggestedBatch = dto;
        }
        return dto;
      });

      results.push({
        prescribedMedicationId: medId,
        medicationName: m.name || 'Medication',
        genericName: m.genericName,
        brandName: m.brandName,
        strength: m.strength,
        dosageForm: m.dosageForm || 'Tablet',
        prescribedQuantity,
        previouslyDispensedQuantity,
        remainingQuantity,
        dosageInstructions: m.instructions || `${m.dosage || ''} ${m.frequency || ''}`.trim(),
        matchStatus,
        matchMessage,
        candidateBatches,
        suggestedBatch,
      });
    }

    return results;
  }

  /**
   * 3. Dispense Prescription Workflow
   */
  async dispensePrescription(
    userId: string,
    input: DispensePrescriptionDto
  ): Promise<DispensingRecordDto> {
    const userObjectId = new Types.ObjectId(userId);

    // Idempotency check: if key already exists for this pharmacy, return recorded fulfillment
    if (input.idempotencyKey && input.idempotencyKey.trim()) {
      const existing = await DispensingRecordModel.findOne({
        pharmacyId: userObjectId,
        idempotencyKey: input.idempotencyKey.trim(),
      });
      if (existing) {
        return this.mapDispensingRecordToDto(existing);
      }
    }

    const rx = await PrescriptionModel.findById(input.prescriptionId)
      .populate('patientId', 'name phone')
      .populate('doctorId', 'name specialization')
      .populate('facilityId', 'name')
      .lean();

    if (!rx) {
      throw AppError.notFound('Prescription not found');
    }

    if (rx.isDraft) {
      throw AppError.badRequest('Prescription is still in draft state and cannot be dispensed');
    }

    if (rx.status === 'CANCELLED' || rx.status === 'DISCONTINUED') {
      throw AppError.badRequest(
        `Prescription has been marked as ${rx.status.toLowerCase()} and cannot be dispensed`
      );
    }

    if (rx.validUntil && new Date(rx.validUntil).getTime() <= Date.now()) {
      throw AppError.badRequest('Prescription has expired past its validity window');
    }

    const patient = rx.patientId as any;
    const doctor = rx.doctorId as any;
    const facility = rx.facilityId as any;

    let patientAge: number | undefined;
    let patientGender: string | undefined;

    if (patient?._id) {
      const pProfile = await PatientProfileModel.findOne({ userId: patient._id }).lean();
      if (pProfile) {
        patientGender = pProfile.gender;
        if (pProfile.dateOfBirth) {
          const diff = Date.now() - new Date(pProfile.dateOfBirth).getTime();
          patientAge = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
        }
      }
    }

    const existingDispensings = await DispensingRecordModel.find({
      prescriptionId: rx._id,
      dispensingStatus: { $ne: 'CANCELLED' },
    }).lean();

    const previouslyDispensedMap: Record<string, number> = {};
    for (const disp of existingDispensings) {
      for (const item of disp.items || []) {
        const k = item.prescriptionMedicationId;
        previouslyDispensedMap[k] = (previouslyDispensedMap[k] || 0) + item.quantityDispensed;
      }
    }

    const verifiedItemsToDispense: Array<{
      prescribedMed: any;
      medId: string;
      prescribedQty: number;
      prevDispensed: number;
      remainingQty: number;
      batch: any;
      quantityToDispense: number;
      dosageInstructions?: string;
    }> = [];

    for (const item of input.items) {
      const prescribedMed = (rx.medications || []).find(
        (m: any) =>
          m._id?.toString() === item.prescriptionMedicationId ||
          m.name === item.prescriptionMedicationId
      );

      if (!prescribedMed) {
        throw AppError.badRequest(
          `Prescribed medication ID ${item.prescriptionMedicationId} not found in prescription`
        );
      }

      const medId = (prescribedMed as any)._id?.toString() || prescribedMed.name;
      const prescribedQty = prescribedMed.quantity || 1;
      const prevDispensed = previouslyDispensedMap[medId] || 0;
      const remainingQty = Math.max(0, prescribedQty - prevDispensed);

      if (item.quantityToDispense > remainingQty) {
        throw AppError.badRequest(
          `Cannot dispense ${item.quantityToDispense} units for "${prescribedMed.name}"; remaining prescribed quantity is ${remainingQty}`
        );
      }

      const batch = await PharmacyInventoryModel.findOne({
        _id: new Types.ObjectId(item.inventoryId),
        pharmacyId: userObjectId,
      });

      if (!batch) {
        throw AppError.notFound(`Inventory batch ${item.inventoryId} not found in your pharmacy`);
      }

      if (
        (batch.expiryDate && new Date(batch.expiryDate).getTime() <= Date.now()) ||
        batch.status === 'EXPIRED'
      ) {
        throw AppError.badRequest(
          `Cannot dispense expired batch ${batch.batchNumber} (expired on ${
            batch.expiryDate ? new Date(batch.expiryDate).toISOString().slice(0, 10) : 'unknown'
          })`
        );
      }

      if (batch.isQuarantined || batch.status === 'QUARANTINED') {
        throw AppError.badRequest(`Cannot dispense quarantined batch ${batch.batchNumber}`);
      }

      if (batch.availableQuantity < item.quantityToDispense) {
        throw AppError.badRequest(
          `Insufficient stock in batch ${batch.batchNumber}: requested ${item.quantityToDispense}, available ${batch.availableQuantity}`
        );
      }

      verifiedItemsToDispense.push({
        prescribedMed,
        medId,
        prescribedQty,
        prevDispensed,
        remainingQty,
        batch,
        quantityToDispense: item.quantityToDispense,
        dosageInstructions: item.dosageInstructions || prescribedMed.instructions,
      });
    }

    const dispensingNumber = `DSP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const dispenser = (await UserModel.findById(userObjectId)) as any;
    const pharmacyProfile = (await PharmacyProfileModel.findOne({ userId: userObjectId })) as any;

    const recordItems: any[] = [];
    const newlyDispensedByMedId: Record<string, number> = {};

    for (const v of verifiedItemsToDispense) {
      const prevQty = v.batch.availableQuantity;
      const newQty = prevQty - v.quantityToDispense;
      let newStatus = v.batch.status;
      if (newQty === 0) {
        newStatus = 'OUT_OF_STOCK';
      } else if (newQty <= (v.batch.reorderLevel || 10)) {
        newStatus = 'LOW_STOCK';
      }

      await PharmacyInventoryModel.findByIdAndUpdate(v.batch._id, {
        $inc: { availableQuantity: -v.quantityToDispense },
        $set: { status: newStatus },
      });

      await PharmacyInventoryTransactionModel.create({
        pharmacyId: userObjectId,
        inventoryId: v.batch._id,
        transactionType: 'STOCK_DISPENSED',
        quantity: v.quantityToDispense,
        previousQuantity: prevQty,
        newQuantity: newQty,
        batchNumber: v.batch.batchNumber,
        referenceType: 'PRESCRIPTION',
        referenceId: rx._id,
        notes: `Dispensed for prescription #${rx.prescriptionNumber} (${dispensingNumber})`,
        performedBy: userObjectId,
      });

      newlyDispensedByMedId[v.medId] = (newlyDispensedByMedId[v.medId] || 0) + v.quantityToDispense;

      const remainingAfterThis = Math.max(0, v.remainingQty - v.quantityToDispense);
      const itemTotal = Math.round(v.quantityToDispense * (v.batch.sellingPrice || 0) * 100) / 100;

      recordItems.push({
        prescriptionMedicationId: v.medId,
        medicationCatalogId: v.batch.medicationCatalogId,
        inventoryId: v.batch._id,
        medicationName: v.batch.medicationName,
        genericName: v.batch.genericName,
        brandName: v.batch.brandName,
        strength: v.batch.strength,
        dosageForm: v.batch.dosageForm,
        batchNumber: v.batch.batchNumber,
        prescribedQuantity: v.prescribedQty,
        previouslyDispensedQuantity: v.prevDispensed,
        quantityDispensed: v.quantityToDispense,
        remainingQuantity: remainingAfterThis,
        dispensedUnit: 'Units',
        batchExpiryDate: v.batch.expiryDate,
        sellingPriceSnapshot: v.batch.sellingPrice || 0,
        itemTotal,
        dosageInstructions: v.dosageInstructions,
      });
    }

    let allMedicationsFullyDispensed = true;
    for (const m of (rx.medications || []) as any[]) {
      const medId = m._id?.toString() || m.name;
      const prescribed = m.quantity || 1;
      const totalSoFar = (previouslyDispensedMap[medId] || 0) + (newlyDispensedByMedId[medId] || 0);
      if (totalSoFar < prescribed) {
        allMedicationsFullyDispensed = false;
        break;
      }
    }

    const dispensingStatus = allMedicationsFullyDispensed ? 'FULLY_DISPENSED' : 'PARTIALLY_DISPENSED';

    if (allMedicationsFullyDispensed) {
      await PrescriptionModel.findByIdAndUpdate(rx._id, { status: 'DISPENSED' });
    }

    const totalQuantityDispensed = recordItems.reduce((sum, it) => sum + it.quantityDispensed, 0);
    const totalAmount = Math.round(recordItems.reduce((sum, it) => sum + it.itemTotal, 0) * 100) / 100;

    const dispensingRecord = await DispensingRecordModel.create({
      dispensingNumber,
      pharmacyId: userObjectId,
      pharmacyName: pharmacyProfile?.pharmacyName || dispenser?.name || 'HealthBridge Pharmacy',
      pharmacyLicenseNumber: pharmacyProfile?.pharmacyLicenseNumber,
      pharmacyGstin: pharmacyProfile?.gstin,
      pharmacyAddress: pharmacyProfile?.address,
      prescriptionId: rx._id,
      prescriptionNumber: rx.prescriptionNumber,
      patientId: patient?._id || rx.patientId,
      patientName: patient?.name || 'Authorized Patient',
      patientPhone: patient?.phone,
      patientGender,
      patientAge,
      doctorId: doctor?._id || rx.doctorId,
      doctorName: doctor?.name ? `Dr. ${doctor.name}` : 'Treating Physician',
      doctorSpecialization: Array.isArray(doctor?.specialization)
        ? doctor.specialization[0]
        : doctor?.specialization,
      facilityName: facility?.name,
      dispensedBy: userObjectId,
      dispenserName: dispenser?.name || 'Licensed Pharmacist',
      dispensedAt: new Date(),
      dispensingStatus,
      items: recordItems,
      totalItems: recordItems.length,
      totalQuantityDispensed,
      totalAmount,
      notes: input.notes?.trim(),
      idempotencyKey: input.idempotencyKey?.trim(),
    });

    try {
      await NotificationModel.create({
        userId: patient?._id || rx.patientId?._id || rx.patientId,
        title: 'Prescription Dispensed',
        message: `Your prescription #${rx.prescriptionNumber} has been ${
          dispensingStatus === 'FULLY_DISPENSED' ? 'fully dispensed' : 'partially dispensed'
        } by ${pharmacyProfile?.pharmacyName || dispenser?.name || 'your pharmacy'}. Dispensing Ref: ${dispensingNumber}.`,
        type: 'PRESCRIPTION',
      });
    } catch (_e) {
      // Non-fatal notification failure
    }

    await this.recordAudit({
      actorId: userId,
      action: 'PRESCRIPTION_DISPENSED',
      resourceType: 'DISPENSING_RECORD',
      resourceId: dispensingRecord._id.toString(),
      metadata: {
        dispensingNumber,
        prescriptionNumber: rx.prescriptionNumber,
        totalQuantity: totalQuantityDispensed,
        totalAmount,
        status: dispensingStatus,
      },
    });

    return this.mapDispensingRecordToDto(dispensingRecord);
  }

  /**
   * 4. List Dispensing History Records
   */
  async getDispensingRecords(
    userId: string,
    filter: DispensingFilterDto
  ): Promise<{
    items: DispensingRecordDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = { pharmacyId: userObjectId };

    if (filter.status && filter.status !== 'ALL') {
      query.dispensingStatus = filter.status;
    }

    if (filter.prescriptionNumber) {
      query.prescriptionNumber = new RegExp(escapeRegex(filter.prescriptionNumber), 'i');
    }

    if (filter.search) {
      const sRegex = new RegExp(escapeRegex(filter.search), 'i');
      query.$or = [
        { dispensingNumber: sRegex },
        { prescriptionNumber: sRegex },
        { patientName: sRegex },
      ];
    }

    if (filter.startDate || filter.endDate) {
      query.dispensedAt = {};
      if (filter.startDate) query.dispensedAt.$gte = new Date(filter.startDate);
      if (filter.endDate) query.dispensedAt.$lte = new Date(filter.endDate);
    }

    const [records, total] = await Promise.all([
      DispensingRecordModel.find(query).sort({ dispensedAt: -1 }).skip(skip).limit(limit).lean(),
      DispensingRecordModel.countDocuments(query),
    ]);

    return {
      items: records.map((r) => this.mapDispensingRecordToDto(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 5. Get Dispensing Record by ID
   */
  async getDispensingRecordById(userId: string, id: string): Promise<DispensingRecordDto> {
    const userObjectId = new Types.ObjectId(userId);
    const record = await DispensingRecordModel.findOne({
      _id: new Types.ObjectId(id),
      pharmacyId: userObjectId,
    }).lean();

    if (!record) {
      throw AppError.notFound('Dispensing record not found');
    }

    return this.mapDispensingRecordToDto(record);
  }

  /**
   * 6. Generate Printable CDSCO-Compliant Dispensing Receipt Payload
   */
  async getDispensingReceipt(
    userId: string,
    id: string
  ): Promise<{
    receiptNumber: string;
    dispensingRecord: DispensingRecordDto;
    disclaimer: string;
    generatedAt: string;
  }> {
    const record = await this.getDispensingRecordById(userId, id);
    return {
      receiptNumber: `RCP-${record.dispensingNumber}`,
      dispensingRecord: record,
      disclaimer:
        'This is an official Pharmacy Dispensing Record generated under the Drugs and Cosmetics Act, 1940 and CDSCO regulations. This document confirms the dispensing of medicines and is not a replacement prescription.',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 7. Cancel Dispensing Record (with Optional Inventory Restoration)
   */
  async cancelDispensingRecord(
    userId: string,
    id: string,
    input: CancelDispensingDto
  ): Promise<DispensingRecordDto> {
    const userObjectId = new Types.ObjectId(userId);
    const record = await DispensingRecordModel.findOne({
      _id: new Types.ObjectId(id),
      pharmacyId: userObjectId,
    });

    if (!record) {
      throw AppError.notFound('Dispensing record not found');
    }

    if (record.dispensingStatus === 'CANCELLED') {
      throw AppError.badRequest('Dispensing record has already been cancelled');
    }

    const dispenser = (await UserModel.findById(userObjectId)) as any;

    if (input.restoreToInventory) {
      for (const item of record.items) {
        const batch = await PharmacyInventoryModel.findById(item.inventoryId);
        if (batch) {
          const prevQty = batch.availableQuantity;
          const newQty = prevQty + item.quantityDispensed;
          let newStatus = batch.status;

          if (input.quarantineRestoredStock) {
            newStatus = 'QUARANTINED';
          } else if (newQty > (batch.reorderLevel || 10)) {
            newStatus = 'IN_STOCK';
          }

          await PharmacyInventoryModel.findByIdAndUpdate(batch._id, {
            $inc: { availableQuantity: item.quantityDispensed },
            $set: {
              status: newStatus,
              isQuarantined: Boolean(input.quarantineRestoredStock),
              quarantineReason: input.quarantineRestoredStock ? input.reason : undefined,
            },
          });

          await PharmacyInventoryTransactionModel.create({
            pharmacyId: userObjectId,
            inventoryId: batch._id,
            transactionType: input.quarantineRestoredStock ? 'STOCK_QUARANTINED' : 'STOCK_ADJUSTED',
            quantity: item.quantityDispensed,
            previousQuantity: prevQty,
            newQuantity: newQty,
            batchNumber: batch.batchNumber,
            referenceType: 'PRESCRIPTION',
            referenceId: record.prescriptionId,
            notes: `Dispensing cancelled (${record.dispensingNumber}): ${input.reason}`,
            performedBy: userObjectId,
          });
        }
      }
    }

    record.dispensingStatus = 'CANCELLED';
    record.cancellationReason = input.reason;
    record.cancelledAt = new Date();
    record.cancelledBy = userObjectId;
    record.cancelledByName = dispenser?.name || 'Pharmacist';
    await record.save();

    await PrescriptionModel.findByIdAndUpdate(record.prescriptionId, {
      status: 'ACTIVE',
    });

    await this.recordAudit({
      actorId: userId,
      action: 'DISPENSING_CANCELLED',
      resourceType: 'DISPENSING_RECORD',
      resourceId: record._id.toString(),
      metadata: {
        dispensingNumber: record.dispensingNumber,
        reason: input.reason,
        restoredToInventory: Boolean(input.restoreToInventory),
        quarantined: Boolean(input.quarantineRestoredStock),
      },
    });

    return this.mapDispensingRecordToDto(record);
  }
}

export const pharmacyService = new PharmacyService();
export default pharmacyService;
