import { z } from 'zod';
import { objectIdRegex, timeRegex } from './appointment.schema';

export const indianPhoneRegex = /^[6-9]\d{9}$/;

export const inventoryStockStatusEnum = z.enum([
  'ACTIVE',
  'IN_STOCK',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'NEAR_EXPIRY',
  'EXPIRED',
  'QUARANTINED',
  'DISCONTINUED',
]);

export const inventoryAdjustmentTypeEnum = z.enum([
  'INCREASE',
  'DECREASE',
  'DAMAGE',
  'EXPIRED_REMOVAL',
  'CORRECTION',
  'QUARANTINE',
  'RELEASE_QUARANTINE',
]);

export const inventoryTransactionTypeEnum = z.enum([
  'STOCK_RECEIVED',
  'STOCK_DISPENSED',
  'STOCK_ADJUSTED',
  'STOCK_DAMAGED',
  'STOCK_EXPIRED',
  'STOCK_QUARANTINED',
  'STOCK_RELEASED',
  'STOCK_TRANSFERRED',
]);

export const pharmacyOrderStatusEnum = z.enum([
  'PENDING',
  'UNDER_REVIEW',
  'ACCEPTED',
  'PROCESSING',
  'PARTIALLY_FULFILLED',
  'READY_FOR_PICKUP',
  'DISPATCHED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]);

export const fulfillmentTypeEnum = z.enum(['IN_STORE_PICKUP', 'HOME_DELIVERY']);

export const pharmacyAddressSchema = z.object({
  line1: z.string().trim().max(200, 'Address line 1 cannot exceed 200 characters').optional(),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'PIN Code must be exactly 6 digits'),
  country: z.string().trim().min(2).max(100).default('India'),
});

export const updatePharmacyProfileSchema = z.object({
  pharmacyName: z
    .string()
    .trim()
    .min(2, 'Pharmacy name must be at least 2 characters')
    .max(200, 'Pharmacy name cannot exceed 200 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(indianPhoneRegex, 'Must be a valid 10-digit Indian phone number starting with 6-9')
    .optional(),
  description: z.string().trim().max(2000, 'Description cannot exceed 2000 characters').optional(),
  logoUrl: z.string().url('Invalid logo URL format').optional(),
  address: pharmacyAddressSchema.partial().optional(),
  openingTime: z.string().regex(timeRegex, 'Opening time must be in HH:MM 24h format').optional(),
  closingTime: z.string().regex(timeRegex, 'Closing time must be in HH:MM 24h format').optional(),
  is24Hours: z.boolean().optional(),
  weeklyAvailability: z.array(z.string().trim()).optional(),
  supportedServices: z.array(z.string().trim()).optional(),
});

/**
 * Medicine Catalog Schemas
 */
export const createMedicineCatalogSchema = z.object({
  name: z.string().trim().min(2, 'Medicine name is required').max(200),
  genericName: z.string().trim().min(2, 'Generic name is required').max(200),
  brandName: z.string().trim().min(1, 'Brand name is required').max(200),
  dosageForm: z.string().trim().min(1, 'Dosage form is required').max(100),
  strength: z.string().trim().min(1, 'Strength is required').max(100),
  route: z.string().trim().max(100).optional().default('Oral'),
  manufacturer: z.string().trim().min(1, 'Manufacturer is required').max(200),
  category: z.string().trim().max(100).optional().default('General'),
  composition: z.string().trim().max(500).optional(),
  packSize: z.string().trim().max(100).optional(),
  unitOfMeasurement: z.string().trim().max(50).optional(),
  schedule: z.string().trim().max(50).optional().default('Schedule H'),
  therapeuticClass: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  requiresPrescription: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
});

export const updateMedicineCatalogSchema = createMedicineCatalogSchema.partial();

export const medicineCatalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  genericName: z.string().trim().optional(),
  brandName: z.string().trim().optional(),
  category: z.string().trim().optional(),
  dosageForm: z.string().trim().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  sortBy: z.enum(['name', 'brandName', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const medicineIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid medicine ID format'),
});

/**
 * Inventory & Batch Schemas
 */
export const createPharmacyInventorySchema = z.object({
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication catalog ID format').optional(),
  medicationName: z.string().trim().min(2, 'Medication name is required').max(200),
  genericName: z.string().trim().max(200).optional(),
  brandName: z.string().trim().max(200).optional(),
  dosageForm: z.string().trim().min(1, 'Dosage form is required').default('TABLET'),
  strength: z.string().trim().min(1, 'Strength is required (e.g. 500 mg)').max(100),
  manufacturer: z.string().trim().max(200).optional(),
  supplier: z.string().trim().max(200).optional(),
  batchNumber: z.string().trim().min(1, 'Batch number is required').max(100).toUpperCase(),
  availableQuantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative'),
  receivedQuantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0, 'Reorder level cannot be negative').optional().default(20),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional(),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  mrp: z.number().min(0, 'MRP cannot be negative').optional(),
  manufacturingDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().refine((d) => !isNaN(d.getTime()), 'Valid expiry date is required'),
  rackLocation: z.string().trim().max(50, 'Rack location cannot exceed 50 characters').optional(),
  invoiceNumber: z.string().trim().max(100).optional(),
});

export const updatePharmacyInventorySchema = z.object({
  availableQuantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').optional(),
  reorderLevel: z.number().int().min(0, 'Reorder level cannot be negative').optional(),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional(),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative').optional(),
  mrp: z.number().min(0, 'MRP cannot be negative').optional(),
  expiryDate: z.coerce.date().optional(),
  rackLocation: z.string().trim().max(50).optional(),
  status: inventoryStockStatusEnum.optional(),
  supplier: z.string().trim().max(200).optional(),
});

export const pharmacyInventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z
    .enum(['ALL', 'ACTIVE', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'NEAR_EXPIRY', 'EXPIRED', 'QUARANTINED', 'DISCONTINUED'])
    .optional()
    .default('ALL'),
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  dosageForm: z.string().trim().optional(),
  rackLocation: z.string().trim().optional(),
  sortBy: z.enum(['medicationName', 'expiryDate', 'availableQuantity', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Stock-In Operation Schema
 */
export const stockInSchema = z.object({
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication catalog ID format').optional(),
  medicationName: z.string().trim().min(2, 'Medication name is required').max(200),
  genericName: z.string().trim().max(200).optional(),
  brandName: z.string().trim().max(200).optional(),
  dosageForm: z.string().trim().min(1, 'Dosage form is required').default('Tablet'),
  strength: z.string().trim().min(1, 'Strength is required').max(100),
  manufacturer: z.string().trim().max(200).optional(),
  supplier: z.string().trim().max(200).optional(),
  batchNumber: z.string().trim().min(1, 'Batch number is required').max(100).toUpperCase(),
  receivedQuantity: z.number().int().min(1, 'Received quantity must be at least 1 unit'),
  reorderLevel: z.number().int().min(0).optional().default(20),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  mrp: z.number().min(0).optional(),
  manufacturingDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().refine((d) => !isNaN(d.getTime()), 'Valid expiry date is required'),
  rackLocation: z.string().trim().max(50).optional(),
  invoiceReference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

/**
 * Stock Adjustment Schema
 */
export const stockAdjustmentSchema = z.object({
  inventoryId: z.string().regex(objectIdRegex, 'Invalid inventory ID format'),
  adjustmentType: inventoryAdjustmentTypeEnum,
  quantity: z.number().int().min(1, 'Quantity must be at least 1 unit'),
  reason: z.string().trim().min(3, 'Adjustment reason is required (minimum 3 characters)').max(500),
  notes: z.string().trim().max(1000).optional(),
});

export const quarantineBatchSchema = z.object({
  reason: z.string().trim().min(3, 'Quarantine reason is required (minimum 3 characters)').max(500),
  notes: z.string().trim().max(1000).optional(),
});

export const releaseBatchSchema = z.object({
  reason: z.string().trim().min(3, 'Release reason is required (minimum 3 characters)').max(500),
  notes: z.string().trim().max(1000).optional(),
});

/**
 * Inventory Transaction Query Schema
 */
export const inventoryTransactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  inventoryId: z.string().regex(objectIdRegex).optional(),
  transactionType: z
    .enum([
      'ALL',
      'STOCK_RECEIVED',
      'STOCK_DISPENSED',
      'STOCK_ADJUSTED',
      'STOCK_DAMAGED',
      'STOCK_EXPIRED',
      'STOCK_QUARANTINED',
      'STOCK_RELEASED',
      'STOCK_TRANSFERRED',
    ])
    .optional()
    .default('ALL'),
  batchNumber: z.string().trim().optional(),
  search: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const transactionIdParamSchema = z.object({
  transactionId: z.string().regex(objectIdRegex, 'Invalid transaction ID format'),
});

/**
 * Expiry Report Query Schema
 */
export const inventoryExpiryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  horizon: z
    .enum(['ALL', 'EXPIRED', 'EXPIRING_7_DAYS', 'EXPIRING_30_DAYS', 'EXPIRING_90_DAYS', 'SAFE'])
    .optional()
    .default('ALL'),
  search: z.string().trim().optional(),
});

/**
 * Prescriptions & Orders (Preserved from Task 01)
 */
export const pharmacyPrescriptionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ALL', 'ACTIVE', 'COMPLETED', 'DISPENSED', 'EXPIRED', 'CANCELLED']).optional().default('ALL'),
  search: z.string().trim().optional(),
});

export const createPharmacyOrderSchema = z.object({
  prescriptionId: z.string().regex(objectIdRegex, 'Invalid prescription ID format').optional(),
  patientId: z.string().regex(objectIdRegex, 'Invalid patient ID format'),
  items: z
    .array(
      z.object({
        inventoryId: z.string().regex(objectIdRegex).optional(),
        medicationCatalogId: z.string().regex(objectIdRegex).optional(),
        medicationName: z.string().trim().min(1, 'Medication name is required'),
        strength: z.string().trim().min(1, 'Strength is required'),
        dosageForm: z.string().trim().min(1, 'Dosage form is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Unit price cannot be negative'),
        batchNumber: z.string().trim().optional(),
      })
    )
    .min(1, 'Order must contain at least one item'),
  fulfillmentType: fulfillmentTypeEnum.optional().default('IN_STORE_PICKUP'),
  deliveryAddress: pharmacyAddressSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const pharmacyOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      'ALL',
      'PENDING',
      'UNDER_REVIEW',
      'ACCEPTED',
      'PROCESSING',
      'PARTIALLY_FULFILLED',
      'READY_FOR_PICKUP',
      'DISPATCHED',
      'COMPLETED',
      'REJECTED',
      'CANCELLED',
    ])
    .optional()
    .default('ALL'),
  search: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  fulfillmentType: z.string().optional(),
});

export const patientOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      'ALL',
      'PENDING',
      'UNDER_REVIEW',
      'ACCEPTED',
      'PROCESSING',
      'PARTIALLY_FULFILLED',
      'READY_FOR_PICKUP',
      'DISPATCHED',
      'COMPLETED',
      'REJECTED',
      'CANCELLED',
    ])
    .optional()
    .default('ALL'),
  search: z.string().trim().optional(),
});

export const createOrderFromPrescriptionSchema = z.object({
  prescriptionId: z.string().regex(objectIdRegex, 'Invalid prescription ID format'),
  pharmacyId: z.string().regex(objectIdRegex, 'Invalid pharmacy ID format').optional(),
  fulfillmentType: fulfillmentTypeEnum.optional().default('IN_STORE_PICKUP'),
  deliveryAddress: pharmacyAddressSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const orderReviewSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
  reasonCode: z
    .enum([
      'STOCK_UNAVAILABLE',
      'PRESCRIPTION_EXPIRED',
      'CLINICAL_CLARIFICATION_NEEDED',
      'DOSAGE_DISCREPANCY',
      'OTHER',
    ])
    .optional(),
  reason: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional(),
  estimatedReadiness: z.string().optional(),
});

export const orderClarificationSchema = z.object({
  notes: z.string().trim().min(3, 'Clarification note must be at least 3 characters').max(1000),
});

export const orderFulfillmentUpdateSchema = z.object({
  dispensingRecordId: z.string().regex(objectIdRegex, 'Invalid dispensing record ID format'),
  items: z
    .array(
      z.object({
        prescriptionMedicationId: z.string().trim().min(1),
        quantityFulfilled: z.number().int().min(1),
        inventoryId: z.string().regex(objectIdRegex),
        batchNumber: z.string().trim().min(1),
      })
    )
    .optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const markReadyForPickupSchema = z.object({
  pickupInstructions: z.string().trim().max(1000).optional(),
  estimatedReadiness: z.string().optional(),
});

export const verifyPickupSchema = z.object({
  pickupCode: z.string().trim().min(4, 'Pickup verification code is required').max(30),
  handoverNotes: z.string().trim().max(1000).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Cancellation reason must be at least 3 characters').max(1000),
});

export const inventoryIdParamSchema = z.object({
  inventoryId: z.string().regex(objectIdRegex, 'Invalid inventory ID format'),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().regex(objectIdRegex, 'Invalid order ID format'),
});

export const pharmacyPrescriptionIdParamSchema = z.object({
  prescriptionId: z.string().regex(objectIdRegex, 'Invalid prescription ID format'),
});

/**
 * ============================================================================
 * DAY 5 TASK 03: PRESCRIPTION VERIFICATION, MATCHING & DISPENSING SCHEMAS
 * ============================================================================
 */

export const verifyPrescriptionParamSchema = z.object({
  prescriptionId: z.string().regex(objectIdRegex, 'Invalid prescription ID format'),
});

export const dispensePrescriptionItemSchema = z.object({
  prescriptionMedicationId: z.string().trim().min(1, 'Prescription medication ID is required'),
  inventoryId: z.string().regex(objectIdRegex, 'Invalid inventory ID format'),
  quantityToDispense: z.number().int().min(1, 'Quantity to dispense must be at least 1'),
  dosageInstructions: z.string().trim().max(500).optional(),
});

export const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string().regex(objectIdRegex, 'Invalid prescription ID format'),
  idempotencyKey: z.string().trim().max(100).optional(),
  items: z.array(dispensePrescriptionItemSchema).min(1, 'At least one item must be dispensed'),
  notes: z.string().trim().max(1000).optional(),
});

export const dispensingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['ALL', 'PARTIALLY_DISPENSED', 'FULLY_DISPENSED', 'CANCELLED']).optional().default('ALL'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  prescriptionNumber: z.string().trim().optional(),
});

export const dispensingIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid dispensing record ID format'),
});

export const cancelDispensingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Cancellation reason must be at least 3 characters')
    .max(500, 'Cancellation reason cannot exceed 500 characters'),
  restoreToInventory: z.boolean().optional().default(false),
  quarantineRestoredStock: z.boolean().optional().default(false),
});

export type VerifyPrescriptionParamInput = z.infer<typeof verifyPrescriptionParamSchema>;
export type DispensePrescriptionItemInput = z.infer<typeof dispensePrescriptionItemSchema>;
export type DispensePrescriptionInput = z.infer<typeof dispensePrescriptionSchema>;
export type DispensingQueryInput = z.infer<typeof dispensingQuerySchema>;
export type DispensingIdParamInput = z.infer<typeof dispensingIdParamSchema>;
export type CancelDispensingInput = z.infer<typeof cancelDispensingSchema>;

/**
 * ============================================================================
 * DAY 5 TASK 04: SUPPLIER MANAGEMENT, PURCHASE ORDERS & REPLENISHMENT SCHEMAS
 * ============================================================================
 */

export const supplierTypeEnum = z.enum([
  'MANUFACTURER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'IMPORTER',
  'OTHER',
]);

export const supplierStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
]);

export const supplierVerificationStatusEnum = z.enum([
  'UNVERIFIED',
  'VERIFIED',
  'REJECTED',
]);

export const supplierContactSchema = z.object({
  name: z.string().trim().min(2, 'Contact person name is required').max(100),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(8, 'Phone number must be at least 8 characters').max(20),
  designation: z.string().trim().max(100).optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const supplierBankDetailsSchema = z.object({
  bankName: z.string().trim().min(2, 'Bank name is required').max(100),
  accountNumber: z.string().trim().min(5, 'Account number is required').max(50),
  ifscCode: z.string().trim().min(4, 'IFSC code is required').max(20),
  branchName: z.string().trim().max(100).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, 'Supplier name is required').max(200),
  legalName: z.string().trim().max(200).optional(),
  supplierType: supplierTypeEnum.optional().default('DISTRIBUTOR'),
  taxId: z.string().trim().max(50).optional(), // GSTIN
  panNumber: z.string().trim().max(20).optional(),
  drugLicenseNumber: z.string().trim().max(100).optional(),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(8, 'Phone number is required').max(20),
  alternatePhone: z.string().trim().max(20).optional(),
  address: pharmacyAddressSchema,
  contactPersons: z.array(supplierContactSchema).optional().default([]),
  paymentTermsDays: z.number().int().min(0).max(365).optional().default(30),
  leadTimeDays: z.number().int().min(0).max(180).optional().default(7),
  bankDetails: supplierBankDetailsSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  legalName: z.string().trim().max(200).optional(),
  supplierType: supplierTypeEnum.optional(),
  status: supplierStatusEnum.optional(),
  taxId: z.string().trim().max(50).optional(),
  panNumber: z.string().trim().max(20).optional(),
  drugLicenseNumber: z.string().trim().max(100).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  alternatePhone: z.string().trim().max(20).optional(),
  address: pharmacyAddressSchema.partial().optional(),
  contactPersons: z.array(supplierContactSchema).optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  leadTimeDays: z.number().int().min(0).max(180).optional(),
  rating: z.number().min(1).max(5).optional(),
  bankDetails: supplierBankDetailsSchema.partial().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const supplierQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional().default('ALL'),
  supplierType: z.enum(['ALL', 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'IMPORTER', 'OTHER']).optional().default('ALL'),
  verificationStatus: z.enum(['ALL', 'UNVERIFIED', 'VERIFIED', 'REJECTED']).optional().default('ALL'),
});

export const supplierIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid supplier ID format'),
});

export const createSupplierProductSchema = z.object({
  supplierId: z.string().regex(objectIdRegex, 'Invalid supplier ID format'),
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication catalog ID format'),
  supplierProductCode: z.string().trim().max(100).optional(),
  purchasePrice: z.number().min(0, 'Purchase price must be non-negative'),
  mrp: z.number().min(0).optional(),
  minimumOrderQuantity: z.number().int().min(1).optional().default(1),
  packSize: z.string().trim().max(100).optional(),
  leadTimeDays: z.number().int().min(0).max(180).optional(),
  isAvailable: z.boolean().optional().default(true),
  notes: z.string().trim().max(1000).optional(),
});

export const updateSupplierProductSchema = z.object({
  supplierProductCode: z.string().trim().max(100).optional(),
  purchasePrice: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  minimumOrderQuantity: z.number().int().min(1).optional(),
  packSize: z.string().trim().max(100).optional(),
  leadTimeDays: z.number().int().min(0).max(180).optional(),
  isAvailable: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const supplierProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  supplierId: z.string().regex(objectIdRegex).optional(),
  medicationCatalogId: z.string().regex(objectIdRegex).optional(),
  search: z.string().trim().optional(),
  isAvailable: z.coerce.boolean().optional(),
});

export const supplierProductIdParamSchema = z.object({
  productId: z.string().regex(objectIdRegex, 'Invalid product ID format'),
});

export const requisitionStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CONVERTED_TO_PURCHASE_ORDER',
  'CANCELLED',
]);

export const requisitionPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createPurchaseRequisitionItemSchema = z.object({
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication ID format'),
  requestedQuantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitOfMeasure: z.string().trim().max(50).optional().default('Units'),
  estimatedUnitPrice: z.number().min(0, 'Estimated unit price must be non-negative'),
  preferredSupplierId: z.string().regex(objectIdRegex).optional(),
  reasonForRequest: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const createPurchaseRequisitionSchema = z.object({
  priority: requisitionPriorityEnum.optional().default('MEDIUM'),
  items: z.array(createPurchaseRequisitionItemSchema).min(1, 'At least one item is required'),
  requiredByDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updatePurchaseRequisitionSchema = z.object({
  priority: requisitionPriorityEnum.optional(),
  items: z.array(createPurchaseRequisitionItemSchema).min(1).optional(),
  requiredByDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
  status: requisitionStatusEnum.optional(),
});

export const requisitionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PURCHASE_ORDER', 'CANCELLED']).optional().default('ALL'),
  priority: z.enum(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('ALL'),
  search: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const requisitionIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid requisition ID format'),
});

export const purchaseOrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT_TO_SUPPLIER',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'CANCELLED',
  'REJECTED',
]);

export const createPurchaseOrderItemSchema = z.object({
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication ID format'),
  orderedQuantity: z.number().int().min(1, 'Ordered quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  taxPercent: z.number().min(0).max(100).optional().default(0),
  packSize: z.string().trim().max(100).optional(),
  supplierProductCode: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().regex(objectIdRegex, 'Invalid supplier ID format'),
  requisitionId: z.string().regex(objectIdRegex).optional(),
  expectedDeliveryDate: z.string().optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional().default(30),
  deliveryAddress: pharmacyAddressSchema.optional(),
  items: z.array(createPurchaseOrderItemSchema).min(1, 'At least one item is required'),
  notes: z.string().trim().max(1000).optional(),
  termsAndConditions: z.string().trim().max(2000).optional(),
});

export const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().regex(objectIdRegex).optional(),
  expectedDeliveryDate: z.string().optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  deliveryAddress: pharmacyAddressSchema.optional(),
  items: z.array(createPurchaseOrderItemSchema).min(1).optional(),
  notes: z.string().trim().max(1000).optional(),
  termsAndConditions: z.string().trim().max(2000).optional(),
});

export const approvePurchaseOrderSchema = z.object({
  comments: z.string().trim().max(1000).optional(),
});

export const rejectPurchaseOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters').max(500),
});

export const purchaseOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  supplierId: z.string().regex(objectIdRegex).optional(),
  status: z
    .enum([
      'ALL',
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'SENT_TO_SUPPLIER',
      'PARTIALLY_RECEIVED',
      'FULLY_RECEIVED',
      'CANCELLED',
      'REJECTED',
    ])
    .optional()
    .default('ALL'),
  search: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const purchaseOrderIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid purchase order ID format'),
});

export const goodsReceiptStatusEnum = z.enum(['CONFIRMED', 'ADJUSTED', 'CANCELLED']);

export const receiveGoodsItemSchema = z.object({
  purchaseOrderItemId: z.string().regex(objectIdRegex, 'Invalid purchase order item ID format'),
  batchNumber: z.string().trim().min(1, 'Batch number is required').max(100),
  manufacturingDate: z.string().min(1, 'Manufacturing date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  receivedQuantity: z.number().int().min(1, 'Received quantity must be at least 1'),
  rejectedQuantity: z.number().int().min(0).optional().default(0),
  unitPurchasePrice: z.number().min(0, 'Unit purchase price must be non-negative'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  mrp: z.number().min(0).optional(),
  taxPercent: z.number().min(0).max(100).optional().default(0),
  storageLocation: z.string().trim().max(100).optional(),
  remarks: z.string().trim().max(500).optional(),
});

export const receiveGoodsSchema = z.object({
  supplierInvoiceNumber: z.string().trim().min(1, 'Supplier invoice number is required').max(100),
  supplierInvoiceDate: z.string().min(1, 'Supplier invoice date is required'),
  items: z.array(receiveGoodsItemSchema).min(1, 'At least one item must be received'),
  notes: z.string().trim().max(1000).optional(),
});

export const goodsReceiptQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  purchaseOrderId: z.string().regex(objectIdRegex).optional(),
  supplierId: z.string().regex(objectIdRegex).optional(),
  status: z.enum(['ALL', 'CONFIRMED', 'ADJUSTED', 'CANCELLED']).optional().default('ALL'),
  search: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const goodsReceiptIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid goods receipt ID format'),
});

export const purchaseInvoiceStatusEnum = z.enum([
  'PENDING',
  'PARTIALLY_RECONCILED',
  'RECONCILED',
  'DISPUTED',
  'CANCELLED',
]);

export const createPurchaseInvoiceSchema = z.object({
  invoiceNumber: z.string().trim().min(1, 'Invoice number is required').max(100),
  supplierId: z.string().regex(objectIdRegex, 'Invalid supplier ID format'),
  purchaseOrderId: z.string().regex(objectIdRegex, 'Invalid purchase order ID format'),
  goodsReceiptIds: z.array(z.string().regex(objectIdRegex)).optional().default([]),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().optional(),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  taxAmount: z.number().min(0).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0, 'Total amount must be non-negative'),
  paidAmount: z.number().min(0).optional().default(0),
  notes: z.string().trim().max(1000).optional(),
});

export const updatePurchaseInvoiceSchema = z.object({
  status: purchaseInvoiceStatusEnum.optional(),
  paidAmount: z.number().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
  reconciliationNotes: z.string().trim().max(1000).optional(),
  disputedReason: z.string().trim().max(1000).optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  supplierId: z.string().regex(objectIdRegex).optional(),
  status: z.enum(['ALL', 'PENDING', 'PARTIALLY_RECONCILED', 'RECONCILED', 'DISPUTED', 'CANCELLED']).optional().default('ALL'),
  search: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const invoiceIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid invoice ID format'),
});

export const replenishmentQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  onlyBelowReorderLevel: z.coerce.boolean().optional().default(true),
  supplierId: z.string().regex(objectIdRegex).optional(),
});

export const updateReplenishmentSettingsSchema = z.object({
  defaultReorderMultiplier: z.number().min(1).max(10).optional(),
  defaultSafetyStockDays: z.number().min(0).max(90).optional(),
  autoGenerateRequisitions: z.boolean().optional(),
  notifyOnThreshold: z.boolean().optional(),
});

export const convertSuggestionsToRequisitionSchema = z.object({
  items: z
    .array(
      z.object({
        medicationCatalogId: z.string().regex(objectIdRegex),
        quantity: z.number().int().min(1),
        preferredSupplierId: z.string().regex(objectIdRegex).optional(),
      })
    )
    .min(1, 'At least one item must be converted'),
  priority: requisitionPriorityEnum.optional().default('MEDIUM'),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierQueryInput = z.infer<typeof supplierQuerySchema>;
export type SupplierIdParamInput = z.infer<typeof supplierIdParamSchema>;
export type CreateSupplierProductInput = z.infer<typeof createSupplierProductSchema>;
export type UpdateSupplierProductInput = z.infer<typeof updateSupplierProductSchema>;
export type SupplierProductQueryInput = z.infer<typeof supplierProductQuerySchema>;
export type SupplierProductIdParamInput = z.infer<typeof supplierProductIdParamSchema>;
export type CreatePurchaseRequisitionInput = z.infer<typeof createPurchaseRequisitionSchema>;
export type UpdatePurchaseRequisitionInput = z.infer<typeof updatePurchaseRequisitionSchema>;
export type RequisitionQueryInput = z.infer<typeof requisitionQuerySchema>;
export type RequisitionIdParamInput = z.infer<typeof requisitionIdParamSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderQueryInput = z.infer<typeof purchaseOrderQuerySchema>;
export type PurchaseOrderIdParamInput = z.infer<typeof purchaseOrderIdParamSchema>;
export type ApprovePurchaseOrderInput = z.infer<typeof approvePurchaseOrderSchema>;
export type RejectPurchaseOrderInput = z.infer<typeof rejectPurchaseOrderSchema>;
export type ReceiveGoodsInput = z.infer<typeof receiveGoodsSchema>;
export type GoodsReceiptQueryInput = z.infer<typeof goodsReceiptQuerySchema>;
export type GoodsReceiptIdParamInput = z.infer<typeof goodsReceiptIdParamSchema>;
export type CreatePurchaseInvoiceInput = z.infer<typeof createPurchaseInvoiceSchema>;
export type UpdatePurchaseInvoiceInput = z.infer<typeof updatePurchaseInvoiceSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
export type InvoiceIdParamInput = z.infer<typeof invoiceIdParamSchema>;
export type ReplenishmentQueryInput = z.infer<typeof replenishmentQuerySchema>;
export type UpdateReplenishmentSettingsInput = z.infer<typeof updateReplenishmentSettingsSchema>;
export type ConvertSuggestionsToRequisitionInput = z.infer<typeof convertSuggestionsToRequisitionSchema>;
export type CreateOrderFromPrescriptionInput = z.infer<typeof createOrderFromPrescriptionSchema>;
export type OrderReviewInput = z.infer<typeof orderReviewSchema>;
export type OrderClarificationInput = z.infer<typeof orderClarificationSchema>;
export type OrderFulfillmentUpdateInput = z.infer<typeof orderFulfillmentUpdateSchema>;
export type MarkReadyForPickupInput = z.infer<typeof markReadyForPickupSchema>;
export type VerifyPickupInput = z.infer<typeof verifyPickupSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type PatientOrderQueryInput = z.infer<typeof patientOrderQuerySchema>;


