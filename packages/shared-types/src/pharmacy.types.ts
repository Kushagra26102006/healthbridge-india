/**
 * HealthBridge India — Pharmacy Portal Shared Types
 * Covers Medicine Catalog, Pharmacy Inventory Batches, Stock Operations,
 * Inventory Transaction Ledger, Expiry Management, Alerts, and Analytics.
 */

export type InventoryStockStatus =
  | 'ACTIVE'
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'NEAR_EXPIRY'
  | 'EXPIRED'
  | 'QUARANTINED'
  | 'DISCONTINUED';

export type PharmacyOrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'DISPATCHED'
  | 'COMPLETED'
  | 'CANCELLED';

export type FulfillmentType = 'IN_STORE_PICKUP' | 'HOME_DELIVERY';

export type PharmacyDocumentType =
  | 'DRUG_LICENSE'
  | 'GST_CERTIFICATE'
  | 'PHARMACIST_REGISTRATION'
  | 'SHOP_ESTABLISHMENT';

export type InventoryAdjustmentType =
  | 'INCREASE'
  | 'DECREASE'
  | 'DAMAGE'
  | 'EXPIRED_REMOVAL'
  | 'CORRECTION'
  | 'QUARANTINE'
  | 'RELEASE_QUARANTINE';

export type InventoryTransactionType =
  | 'STOCK_RECEIVED'
  | 'STOCK_DISPENSED'
  | 'STOCK_ADJUSTED'
  | 'STOCK_DAMAGED'
  | 'STOCK_EXPIRED'
  | 'STOCK_QUARANTINED'
  | 'STOCK_RELEASED'
  | 'STOCK_TRANSFERRED';

export type ExpiryHorizon =
  | 'EXPIRED'
  | 'EXPIRING_7_DAYS'
  | 'EXPIRING_30_DAYS'
  | 'EXPIRING_90_DAYS'
  | 'SAFE';

export interface PharmacyAddressDto {
  line1?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PharmacyDocumentDto {
  id: string;
  documentType: PharmacyDocumentType;
  documentNumber?: string;
  documentUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface PharmacyProfileDto {
  id: string;
  userId: string;
  name: string;
  pharmacyName: string;
  email: string;
  phone: string;
  description?: string;
  logoUrl?: string;
  address: PharmacyAddressDto;
  pharmacyLicenseNumber: string;
  gstin?: string;
  issuingAuthority?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isVerified: boolean;
  documentSubmissionStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  documents: PharmacyDocumentDto[];
  facilityId?: string;
  facilityName?: string;
  openingTime: string;
  closingTime: string;
  is24Hours: boolean;
  weeklyAvailability: string[];
  supportedServices: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePharmacyProfileDto {
  pharmacyName?: string;
  phone?: string;
  description?: string;
  logoUrl?: string;
  address?: Partial<PharmacyAddressDto>;
  openingTime?: string;
  closingTime?: string;
  is24Hours?: boolean;
  weeklyAvailability?: string[];
  supportedServices?: string[];
}

/**
 * Reusable Medicine Catalog DTOs
 */
export interface MedicineCatalogItemDto {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  dosageForm: string;
  strength: string;
  route: string;
  manufacturer: string;
  category: string;
  composition?: string;
  packSize?: string;
  unitOfMeasurement?: string;
  packageSize?: string;
  schedule?: string;
  therapeuticClass?: string;
  standardDosageUnit?: string;
  description?: string;
  instructionsHint?: string;
  requiresPrescription: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineCatalogDto {
  name: string;
  genericName: string;
  brandName: string;
  dosageForm: string;
  strength: string;
  route?: string;
  manufacturer: string;
  category?: string;
  composition?: string;
  packSize?: string;
  unitOfMeasurement?: string;
  schedule?: string;
  therapeuticClass?: string;
  description?: string;
  requiresPrescription?: boolean;
  isActive?: boolean;
}

export interface UpdateMedicineCatalogDto {
  name?: string;
  genericName?: string;
  brandName?: string;
  dosageForm?: string;
  strength?: string;
  route?: string;
  manufacturer?: string;
  category?: string;
  composition?: string;
  packSize?: string;
  unitOfMeasurement?: string;
  schedule?: string;
  therapeuticClass?: string;
  description?: string;
  requiresPrescription?: boolean;
  isActive?: boolean;
}

export interface MedicineCatalogFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  dosageForm?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'brandName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pharmacy-Specific Inventory & Batch DTOs
 */
export interface PharmacyInventoryItemDto {
  id: string;
  pharmacyId: string;
  medicationCatalogId?: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  manufacturer?: string;
  supplier?: string;
  invoiceNumber?: string;
  batchNumber: string;
  receivedQuantity?: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number;
  manufacturingDate?: string;
  expiryDate: string;
  status: InventoryStockStatus;
  rackLocation?: string;
  isExpired: boolean;
  isQuarantined?: boolean;
  quarantineReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePharmacyInventoryItemDto {
  medicationCatalogId?: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  manufacturer?: string;
  supplier?: string;
  batchNumber: string;
  availableQuantity: number;
  receivedQuantity?: number;
  reorderLevel?: number;
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number;
  manufacturingDate?: string;
  expiryDate: string;
  rackLocation?: string;
  invoiceNumber?: string;
}

export interface UpdatePharmacyInventoryItemDto {
  availableQuantity?: number;
  reorderLevel?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  mrp?: number;
  expiryDate?: string;
  rackLocation?: string;
  status?: InventoryStockStatus;
  supplier?: string;
}

export interface PharmacyInventoryFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: InventoryStockStatus | 'ALL';
  expiringWithinDays?: number;
  dosageForm?: string;
  rackLocation?: string;
  sortBy?: 'medicationName' | 'expiryDate' | 'availableQuantity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Stock Operations DTOs (Stock-In, Stock Adjustment, Quarantine)
 */
export interface PharmacyStockInDto {
  medicationCatalogId?: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  manufacturer?: string;
  supplier?: string;
  batchNumber: string;
  receivedQuantity: number;
  reorderLevel?: number;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  manufacturingDate?: string;
  expiryDate: string;
  rackLocation?: string;
  invoiceReference?: string;
  notes?: string;
}

export interface PharmacyStockAdjustmentDto {
  inventoryId: string;
  adjustmentType: InventoryAdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface QuarantineBatchDto {
  reason: string;
  notes?: string;
}

export interface ReleaseBatchDto {
  reason: string;
  notes?: string;
}

/**
 * Inventory Transaction Ledger DTOs
 */
export interface PharmacyInventoryTransactionDto {
  id: string;
  transactionReference: string;
  pharmacyId: string;
  inventoryId: string;
  medicationCatalogId?: string;
  medicationName: string;
  batchNumber: string;
  transactionType: InventoryTransactionType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceEntity?: string;
  referenceId?: string;
  performedBy: string;
  performedByName?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryTransactionFilterDto {
  page?: number;
  limit?: number;
  inventoryId?: string;
  transactionType?: InventoryTransactionType | 'ALL';
  batchNumber?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Expiry Management & Reports
 */
export interface PharmacyExpiryReportItemDto {
  id: string;
  inventoryId: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  batchNumber: string;
  availableQuantity: number;
  purchasePrice?: number;
  sellingPrice: number;
  expiryDate: string;
  daysUntilExpiry: number;
  horizon: ExpiryHorizon;
  status: InventoryStockStatus;
  rackLocation?: string;
}

export interface PharmacyExpiryReportSummaryDto {
  expiredCount: number;
  expiring7DaysCount: number;
  expiring30DaysCount: number;
  expiring90DaysCount: number;
  safeCount: number;
  expiredUnits: number;
  expiring30DaysUnits: number;
  items: PharmacyExpiryReportItemDto[];
}

/**
 * Low-Stock & Critical Alerts Summary
 */
export interface PharmacyAlertsSummaryDto {
  lowStockAlerts: Array<{
    inventoryId: string;
    medicationName: string;
    batchNumber: string;
    availableQuantity: number;
    reorderLevel: number;
    rackLocation?: string;
  }>;
  outOfStockAlerts: Array<{
    inventoryId: string;
    medicationName: string;
    batchNumber: string;
    rackLocation?: string;
  }>;
  nearExpiryAlerts: Array<{
    inventoryId: string;
    medicationName: string;
    batchNumber: string;
    expiryDate: string;
    daysRemaining: number;
    availableQuantity: number;
    rackLocation?: string;
  }>;
  expiredAlerts: Array<{
    inventoryId: string;
    medicationName: string;
    batchNumber: string;
    expiryDate: string;
    availableQuantity: number;
    rackLocation?: string;
  }>;
  quarantinedAlerts: Array<{
    inventoryId: string;
    medicationName: string;
    batchNumber: string;
    availableQuantity: number;
    reason?: string;
    rackLocation?: string;
  }>;
  totalAlertsCount: number;
}

/**
 * Inventory Analytics & Valuation DTOs
 */
export interface PharmacyInventoryAnalyticsDto {
  totalUniqueMedicines: number;
  totalActiveBatches: number;
  totalAvailableUnits: number;
  lowStockBatchesCount: number;
  outOfStockMedicinesCount: number;
  nearExpiryBatchesCount: number;
  expiredBatchesCount: number;
  quarantinedBatchesCount: number;
  estimatedValuation: number; // Available units * purchase price for eligible stock
  quarantinedValuation: number;
  expiredValuation: number;
  dosageFormDistribution: Array<{ dosageForm: string; count: number; units: number }>;
  stockStatusDistribution: Array<{ status: string; count: number }>;
  recentStockMovements: PharmacyInventoryTransactionDto[];
}

/**
 * Prescriptions and Orders (Preserved from Task 01)
 */
export interface PharmacyPrescriptionItemDto {
  id?: string;
  prescribedMedicationId?: string;
  medicationCatalogId?: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  prescribedQuantity?: number;
  previouslyDispensedQuantity?: number;
  remainingQuantity?: number;
  instructions?: string;
}

export interface PharmacyPrescriptionQueueItemDto {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  facilityName?: string;
  issueDate: string;
  validUntil: string;
  itemCount: number;
  status: string;
  medications: PharmacyPrescriptionItemDto[];
  instructions?: string;
}

export interface PharmacyOrderItemDto {
  id?: string;
  inventoryId?: string;
  medicationCatalogId?: string;
  medicationName: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
}

export interface PharmacyOrderDto {
  id: string;
  orderNumber: string;
  pharmacyId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  prescriptionId?: string;
  prescriptionNumber?: string;
  items: PharmacyOrderItemDto[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  status: PharmacyOrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePharmacyOrderDto {
  prescriptionId?: string;
  patientId: string;
  items: Array<{
    inventoryId?: string;
    medicationCatalogId?: string;
    medicationName: string;
    strength: string;
    dosageForm: string;
    quantity: number;
    unitPrice: number;
    batchNumber?: string;
  }>;
  fulfillmentType?: FulfillmentType;
  deliveryAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  notes?: string;
}

export interface PharmacyInventoryAlertDto {
  id: string;
  medicineName: string;
  batchNumber: string;
  availableQuantity: number;
  expiryDate: string;
  alertStatus: 'LOW_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY';
}

export interface PharmacyRecentActivityDto {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  referenceId?: string;
}

export interface PharmacyDashboardSummaryDto {
  metrics: {
    totalActiveMedicines: number;
    lowStockMedicines: number;
    outOfStockMedicines: number;
    pendingPrescriptions: number;
    processingOrders: number;
    completedDispensing: number;
    expiringMedicines: number;
  };
  prescriptionQueuePreview: PharmacyPrescriptionQueueItemDto[];
  inventoryAlerts: PharmacyInventoryAlertDto[];
  recentActivity: PharmacyRecentActivityDto[];
}

/**
 * ============================================================================
 * DAY 5 TASK 03: PRESCRIPTION VERIFICATION, MATCHING & DISPENSING DTOS
 * ============================================================================
 */

export type PrescriptionDispensingStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'READY_FOR_DISPENSING'
  | 'PARTIALLY_DISPENSED'
  | 'FULLY_DISPENSED'
  | 'REJECTED'
  | 'CANCELLED';

export type MedicineMatchStatus =
  | 'EXACT_MATCH'
  | 'ACCEPTABLE_MATCH'
  | 'NO_MATCH'
  | 'INSUFFICIENT_STOCK'
  | 'EXPIRED_ONLY'
  | 'QUARANTINED_ONLY';

export interface CandidateBatchOptionDto {
  inventoryId: string;
  batchNumber: string;
  medicationName: string;
  strength: string;
  dosageForm: string;
  availableQuantity: number;
  expiryDate: string;
  sellingPrice: number;
  purchasePrice?: number;
  mrp?: number;
  rackLocation?: string;
  supplier?: string;
  isFefoSuggested: boolean;
}

export interface MedicineMatchResultDto {
  prescribedMedicationId: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  prescribedQuantity: number;
  previouslyDispensedQuantity: number;
  remainingQuantity: number;
  dosageInstructions?: string;
  matchStatus: MedicineMatchStatus;
  matchMessage: string;
  candidateBatches: CandidateBatchOptionDto[];
  suggestedBatch?: CandidateBatchOptionDto;
}

export interface PrescriptionVerificationItemDto {
  prescribedMedicationId: string;
  medicationName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedQuantity: number;
  previouslyDispensedQuantity: number;
  remainingQuantity: number;
  isFullyDispensed: boolean;
  instructions?: string;
}

export interface PrescriptionVerificationDto {
  prescriptionId: string;
  prescriptionNumber: string;
  isEligibleForDispensing: boolean;
  verificationStatus: 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'ALREADY_DISPENSED' | 'REVOKED';
  verificationChecks: {
    prescriptionExists: boolean;
    isNotDraft: boolean;
    doctorExists: boolean;
    patientExists: boolean;
    notExpired: boolean;
    notCancelled: boolean;
    notFullyDispensed: boolean;
    pharmacyPermitted: boolean;
  };
  verificationErrors: string[];
  patient: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    phone?: string;
  };
  doctor: {
    id: string;
    name: string;
    specialization?: string;
    licenseNumber?: string;
  };
  facilityName?: string;
  issueDate: string;
  validUntil: string;
  prescriptionStatus: string;
  instructions: string;
  items: PrescriptionVerificationItemDto[];
  totalItemsCount: number;
  totalPrescribedUnits: number;
  totalRemainingUnits: number;
}

export interface DispensePrescriptionItemDto {
  prescriptionMedicationId: string;
  inventoryId: string;
  quantityToDispense: number;
  dosageInstructions?: string;
}

export interface DispensePrescriptionDto {
  prescriptionId: string;
  idempotencyKey?: string;
  items: DispensePrescriptionItemDto[];
  notes?: string;
}

export interface DispensingRecordItemDto {
  id: string;
  prescriptionMedicationId: string;
  medicationCatalogId?: string;
  inventoryId: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  batchNumber: string;
  prescribedQuantity: number;
  previouslyDispensedQuantity: number;
  quantityDispensed: number;
  remainingQuantity: number;
  dispensedUnit: string;
  batchExpiryDate: string;
  sellingPriceSnapshot: number;
  itemTotal: number;
  dosageInstructions?: string;
}

export interface DispensingRecordDto {
  id: string;
  dispensingNumber: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyLicenseNumber?: string;
  pharmacyGstin?: string;
  pharmacyAddress?: {
    line1?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientGender?: string;
  patientAge?: number;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  facilityName?: string;
  dispensedBy: string;
  dispenserName: string;
  dispensedAt: string;
  dispensingStatus: 'PARTIALLY_DISPENSED' | 'FULLY_DISPENSED' | 'CANCELLED';
  items: DispensingRecordItemDto[];
  totalItems: number;
  totalQuantityDispensed: number;
  totalAmount: number;
  notes?: string;
  idempotencyKey?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledByName?: string;
  createdAt: string;
}

export interface DispensingFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ALL' | 'PARTIALLY_DISPENSED' | 'FULLY_DISPENSED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  prescriptionNumber?: string;
}

export interface CancelDispensingDto {
  reason: string;
  restoreToInventory?: boolean;
  quarantineRestoredStock?: boolean;
}

/**
 * ============================================================================
 * DAY 5 TASK 04: SUPPLIER MANAGEMENT, PURCHASE ORDERS & STOCK REPLENISHMENT
 * ============================================================================
 */

export type SupplierType =
  | 'MANUFACTURER'
  | 'DISTRIBUTOR'
  | 'WHOLESALER'
  | 'IMPORTER'
  | 'OTHER';

export type SupplierStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'PENDING_VERIFICATION';

export type SupplierVerificationStatus =
  | 'UNVERIFIED'
  | 'VERIFIED'
  | 'REJECTED';

export interface SupplierContactDto {
  name: string;
  email: string;
  phone: string;
  designation?: string;
  isPrimary?: boolean;
}

export interface SupplierBankDetailsDto {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
}

export interface SupplierDto {
  id: string;
  pharmacyId: string;
  supplierCode: string;
  name: string;
  legalName?: string;
  supplierType: SupplierType;
  status: SupplierStatus;
  verificationStatus: SupplierVerificationStatus;
  taxId?: string; // GSTIN
  panNumber?: string;
  drugLicenseNumber?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: PharmacyAddressDto;
  contactPersons: SupplierContactDto[];
  paymentTermsDays: number;
  leadTimeDays: number;
  rating: number;
  bankDetails?: SupplierBankDetailsDto;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  legalName?: string;
  supplierType?: SupplierType;
  taxId?: string;
  panNumber?: string;
  drugLicenseNumber?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: PharmacyAddressDto;
  contactPersons?: SupplierContactDto[];
  paymentTermsDays?: number;
  leadTimeDays?: number;
  bankDetails?: SupplierBankDetailsDto;
  notes?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  legalName?: string;
  supplierType?: SupplierType;
  status?: SupplierStatus;
  taxId?: string;
  panNumber?: string;
  drugLicenseNumber?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: Partial<PharmacyAddressDto>;
  contactPersons?: SupplierContactDto[];
  paymentTermsDays?: number;
  leadTimeDays?: number;
  rating?: number;
  bankDetails?: Partial<SupplierBankDetailsDto>;
  notes?: string;
}

export interface SupplierFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ALL' | SupplierStatus;
  supplierType?: 'ALL' | SupplierType;
  verificationStatus?: 'ALL' | SupplierVerificationStatus;
}

export interface SupplierProductDto {
  id: string;
  pharmacyId: string;
  supplierId: string;
  supplierName: string;
  medicationCatalogId: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  supplierProductCode?: string;
  purchasePrice: number;
  mrp?: number;
  minimumOrderQuantity: number;
  packSize?: string;
  leadTimeDays?: number;
  isAvailable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierProductDto {
  supplierId: string;
  medicationCatalogId: string;
  supplierProductCode?: string;
  purchasePrice: number;
  mrp?: number;
  minimumOrderQuantity?: number;
  packSize?: string;
  leadTimeDays?: number;
  isAvailable?: boolean;
  notes?: string;
}

export interface UpdateSupplierProductDto {
  supplierProductCode?: string;
  purchasePrice?: number;
  mrp?: number;
  minimumOrderQuantity?: number;
  packSize?: string;
  leadTimeDays?: number;
  isAvailable?: boolean;
  notes?: string;
}

export interface SupplierProductFilterDto {
  page?: number;
  limit?: number;
  supplierId?: string;
  medicationCatalogId?: string;
  search?: string;
  isAvailable?: boolean;
}

export type RequisitionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED_TO_PURCHASE_ORDER'
  | 'CANCELLED';

export type RequisitionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface RequisitionItemDto {
  id: string;
  medicationCatalogId: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  unitOfMeasure?: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  reasonForRequest?: string;
  notes?: string;
}

export interface PurchaseRequisitionDto {
  id: string;
  requisitionNumber: string;
  pharmacyId: string;
  requestedBy: string;
  requestedByName: string;
  status: RequisitionStatus;
  priority: RequisitionPriority;
  items: RequisitionItemDto[];
  totalEstimatedAmount: number;
  requiredByDate?: string;
  notes?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  convertedPurchaseOrderId?: string;
  convertedPurchaseOrderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequisitionItemDto {
  medicationCatalogId: string;
  requestedQuantity: number;
  unitOfMeasure?: string;
  estimatedUnitPrice: number;
  preferredSupplierId?: string;
  reasonForRequest?: string;
  notes?: string;
}

export interface CreatePurchaseRequisitionDto {
  priority?: RequisitionPriority;
  items: CreatePurchaseRequisitionItemDto[];
  requiredByDate?: string;
  notes?: string;
}

export interface UpdatePurchaseRequisitionDto {
  priority?: RequisitionPriority;
  items?: CreatePurchaseRequisitionItemDto[];
  requiredByDate?: string;
  notes?: string;
  status?: RequisitionStatus;
}

export interface RequisitionFilterDto {
  page?: number;
  limit?: number;
  status?: 'ALL' | RequisitionStatus;
  priority?: 'ALL' | RequisitionPriority;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SENT_TO_SUPPLIER'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'CANCELLED'
  | 'REJECTED';

export interface PurchaseOrderItemDto {
  id: string;
  medicationCatalogId: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  itemSubtotal: number;
  itemTax: number;
  itemTotal: number;
  packSize?: string;
  supplierProductCode?: string;
  notes?: string;
}

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  pharmacyId: string;
  requisitionId?: string;
  requisitionNumber?: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierGstin?: string;
  supplierDrugLicense?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  paymentTermsDays: number;
  deliveryAddress: PharmacyAddressDto;
  items: PurchaseOrderItemDto[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  notes?: string;
  termsAndConditions?: string;
  approvalDetails?: {
    approvedBy: string;
    approverName: string;
    approvedAt: string;
    comments?: string;
    rejectedReason?: string;
  };
  cancellationDetails?: {
    cancelledBy: string;
    cancelledByName: string;
    cancelledAt: string;
    reason: string;
  };
  sentToSupplierAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderItemDto {
  medicationCatalogId: string;
  orderedQuantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  packSize?: string;
  supplierProductCode?: string;
  notes?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  requisitionId?: string;
  expectedDeliveryDate?: string;
  paymentTermsDays?: number;
  deliveryAddress?: PharmacyAddressDto;
  items: CreatePurchaseOrderItemDto[];
  notes?: string;
  termsAndConditions?: string;
}

export interface UpdatePurchaseOrderDto {
  supplierId?: string;
  expectedDeliveryDate?: string;
  paymentTermsDays?: number;
  deliveryAddress?: PharmacyAddressDto;
  items?: CreatePurchaseOrderItemDto[];
  notes?: string;
  termsAndConditions?: string;
}

export interface ApprovePurchaseOrderDto {
  comments?: string;
}

export interface RejectPurchaseOrderDto {
  reason: string;
}

export interface PurchaseOrderFilterDto {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: 'ALL' | PurchaseOrderStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export type GoodsReceiptStatus = 'CONFIRMED' | 'ADJUSTED' | 'CANCELLED';

export interface GoodsReceiptItemDto {
  id: string;
  purchaseOrderItemId: string;
  medicationCatalogId: string;
  medicationName: string;
  dosageForm: string;
  strength: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  orderedQuantity: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  acceptedQuantity: number;
  unitPurchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  taxPercent: number;
  itemTotal: number;
  storageLocation?: string;
  remarks?: string;
}

export interface GoodsReceiptDto {
  id: string;
  grnNumber: string;
  pharmacyId: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  receivedDate: string;
  receivedBy: string;
  receiverName: string;
  status: GoodsReceiptStatus;
  items: GoodsReceiptItemDto[];
  totalItemsCount: number;
  totalReceivedQuantity: number;
  totalAcceptedQuantity: number;
  totalRejectedQuantity: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiveGoodsItemDto {
  purchaseOrderItemId: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  receivedQuantity: number;
  rejectedQuantity?: number;
  unitPurchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  taxPercent?: number;
  storageLocation?: string;
  remarks?: string;
}

export interface ReceiveGoodsDto {
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  items: ReceiveGoodsItemDto[];
  notes?: string;
}

export interface GoodsReceiptFilterDto {
  page?: number;
  limit?: number;
  purchaseOrderId?: string;
  supplierId?: string;
  status?: 'ALL' | GoodsReceiptStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export type PurchaseInvoiceStatus =
  | 'PENDING'
  | 'PARTIALLY_RECONCILED'
  | 'RECONCILED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface PurchaseInvoiceDto {
  id: string;
  invoiceNumber: string;
  pharmacyId: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  poNumber: string;
  goodsReceiptIds: string[];
  grnNumbers: string[];
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: PurchaseInvoiceStatus;
  notes?: string;
  reconciliationNotes?: string;
  disputedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseInvoiceDto {
  invoiceNumber: string;
  supplierId: string;
  purchaseOrderId: string;
  goodsReceiptIds?: string[];
  invoiceDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  notes?: string;
}

export interface UpdatePurchaseInvoiceDto {
  status?: PurchaseInvoiceStatus;
  paidAmount?: number;
  notes?: string;
  reconciliationNotes?: string;
  disputedReason?: string;
}

export interface InvoiceFilterDto {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: 'ALL' | PurchaseInvoiceStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReplenishmentSuggestionDto {
  medicationCatalogId: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  currentStock: number;
  reservedStock: number;
  netAvailableStock: number;
  reorderLevel: number;
  safetyStock: number;
  maxStockLevel: number;
  pendingInboundQuantity: number;
  suggestedOrderQuantity: number;
  unit: string;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  estimatedCost: number;
}

export interface ReplenishmentFilterDto {
  search?: string;
  category?: string;
  onlyBelowReorderLevel?: boolean;
  supplierId?: string;
}

export interface ReplenishmentSettingsDto {
  defaultReorderMultiplier: number;
  defaultSafetyStockDays: number;
  autoGenerateRequisitions: boolean;
  notifyOnThreshold: boolean;
}

export interface UpdateReplenishmentSettingsDto {
  defaultReorderMultiplier?: number;
  defaultSafetyStockDays?: number;
  autoGenerateRequisitions?: boolean;
  notifyOnThreshold?: boolean;
}

export interface ConvertSuggestionsToRequisitionDto {
  items: {
    medicationCatalogId: string;
    quantity: number;
    preferredSupplierId?: string;
  }[];
  priority?: RequisitionPriority;
  notes?: string;
}

export interface ProcurementMetricsDto {
  totalSuppliers: number;
  activeSuppliers: number;
  pendingSuppliers: number;
  openPurchaseOrders: number;
  pendingApprovalOrders: number;
  partiallyReceivedOrders: number;
  monthlySpendTotal: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  replenishmentSuggestionsCount: number;
}

