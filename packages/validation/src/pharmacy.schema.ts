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
  'ACCEPTED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'DISPATCHED',
  'COMPLETED',
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
    .enum(['ALL', 'PENDING', 'ACCEPTED', 'PROCESSING', 'READY_FOR_PICKUP', 'DISPATCHED', 'COMPLETED', 'CANCELLED'])
    .optional()
    .default('ALL'),
  search: z.string().trim().optional(),
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

