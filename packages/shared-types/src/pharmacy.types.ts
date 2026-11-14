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
  medicationName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
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
