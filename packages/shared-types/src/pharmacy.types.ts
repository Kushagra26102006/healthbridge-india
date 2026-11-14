/**
 * HealthBridge India — Pharmacy Portal Shared Types
 * Covers Pharmacy Profile, Inventory Management, Prescription Queue, and Order Management.
 */

export type InventoryStockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'EXPIRED'
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
  batchNumber: string;
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
  batchNumber: string;
  availableQuantity: number;
  reorderLevel?: number;
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number;
  manufacturingDate?: string;
  expiryDate: string;
  rackLocation?: string;
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
}

export interface PharmacyInventoryFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: InventoryStockStatus | 'ALL';
  expiringWithinDays?: number;
}

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

