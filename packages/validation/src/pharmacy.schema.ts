import { z } from 'zod';
import { objectIdRegex, timeRegex } from './appointment.schema';

export const indianPhoneRegex = /^[6-9]\d{9}$/;

export const inventoryStockStatusEnum = z.enum([
  'IN_STOCK',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'EXPIRED',
  'DISCONTINUED',
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

export const createPharmacyInventorySchema = z.object({
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication catalog ID format').optional(),
  medicationName: z.string().trim().min(2, 'Medication name is required').max(200),
  genericName: z.string().trim().max(200).optional(),
  brandName: z.string().trim().max(200).optional(),
  dosageForm: z.string().trim().min(1, 'Dosage form is required').default('TABLET'),
  strength: z.string().trim().min(1, 'Strength is required (e.g. 500 mg)').max(100),
  manufacturer: z.string().trim().max(200).optional(),
  batchNumber: z.string().trim().min(1, 'Batch number is required').max(100).toUpperCase(),
  availableQuantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative'),
  reorderLevel: z.number().int().min(0, 'Reorder level cannot be negative').optional().default(20),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative').optional(),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  mrp: z.number().min(0, 'MRP cannot be negative').optional(),
  manufacturingDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().refine((d) => !isNaN(d.getTime()), 'Valid expiry date is required'),
  rackLocation: z.string().trim().max(50, 'Rack location cannot exceed 50 characters').optional(),
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
});

export const pharmacyInventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z
    .enum(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED', 'DISCONTINUED'])
    .optional()
    .default('ALL'),
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
});

export const pharmacyPrescriptionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['ALL', 'PENDING', 'ACCEPTED', 'PROCESSING', 'COMPLETED', 'REJECTED'])
    .optional()
    .default('ALL'),
  search: z.string().trim().optional(),
});

export const pharmacyOrderItemSchema = z.object({
  inventoryId: z.string().regex(objectIdRegex, 'Invalid inventory ID format').optional(),
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication catalog ID format').optional(),
  medicationName: z.string().trim().min(1, 'Medication name is required'),
  strength: z.string().trim().min(1, 'Strength is required'),
  dosageForm: z.string().trim().min(1, 'Dosage form is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  batchNumber: z.string().trim().optional(),
});

export const createPharmacyOrderSchema = z.object({
  prescriptionId: z.string().regex(objectIdRegex, 'Invalid prescription ID format').optional(),
  patientId: z.string({ required_error: 'Patient ID is required' }).regex(objectIdRegex, 'Invalid patient ID format'),
  items: z.array(pharmacyOrderItemSchema).min(1, 'Order must contain at least one medication item'),
  fulfillmentType: fulfillmentTypeEnum.default('IN_STORE_PICKUP'),
  deliveryAddress: z
    .object({
      line1: z.string().trim().min(1, 'Delivery address line 1 is required'),
      city: z.string().trim().min(1, 'City is required'),
      state: z.string().trim().min(1, 'State is required'),
      postalCode: z.string().trim().regex(/^\d{6}$/, 'PIN Code must be 6 digits'),
    })
    .optional(),
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
