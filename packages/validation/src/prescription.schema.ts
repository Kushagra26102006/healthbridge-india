import { z } from 'zod';
import { objectIdRegex } from './appointment.schema';

export const prescribedMedicationSchema = z.object({
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication catalog ID format').optional(),
  name: z.string().trim().min(2, 'Medication name is required').max(200, 'Medication name cannot exceed 200 characters'),
  genericName: z.string().trim().max(200, 'Generic name cannot exceed 200 characters').optional(),
  brandName: z.string().trim().max(200, 'Brand name cannot exceed 200 characters').optional(),
  strength: z.string().trim().min(1, 'Strength is required (e.g. 500 mg, 10 ml)').max(100).optional(),
  dosage: z.string().trim().min(1, 'Dosage is required (e.g., 1 tablet, 500mg, 10ml)').max(100),
  route: z.string().trim().min(1, 'Route of administration is required (e.g. Oral, Topical)').max(100).optional().default('Oral'),
  frequency: z.string().trim().min(1, 'Frequency is required (e.g., 1-0-1, OD, BD)').max(100),
  duration: z.string().trim().min(1, 'Duration is required (e.g., 5 days, 2 weeks)').max(100),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000).optional().default(10),
  instructions: z.string().trim().max(1000, 'Instructions cannot exceed 1000 characters').optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  encounterId: z.string().optional(),
  medications: z
    .array(prescribedMedicationSchema)
    .min(1, 'Prescription must contain at least one medication'),
  instructions: z.string().trim().min(2, 'Clinical instructions are required'),
  validUntil: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Prescription expiry date must be in the future',
  }),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export const doctorPrescriptionMedicationItemSchema = z.object({
  medicationCatalogId: z.string().regex(objectIdRegex, 'Invalid medication catalog ID format').optional(),
  name: z.string().trim().min(2, 'Medication name is required').max(200, 'Medication name cannot exceed 200 characters'),
  genericName: z.string().trim().max(200, 'Generic name cannot exceed 200 characters').optional(),
  brandName: z.string().trim().max(200, 'Brand name cannot exceed 200 characters').optional(),
  strength: z.string().trim().min(1, 'Strength is required (e.g. 500 mg)').max(100),
  dosage: z.string().trim().min(1, 'Dosage is required (e.g. 1 tablet, 5 ml)').max(100),
  route: z.string().trim().min(1, 'Route of administration is required (e.g. Oral, Topical)').max(100),
  frequency: z.string().trim().min(1, 'Frequency is required (e.g. Once daily, Twice daily, 1-0-1)').max(100),
  duration: z.string().trim().min(1, 'Duration is required (e.g. 5 days, 14 days)').max(100),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(1000),
  instructions: z.string().trim().max(1000, 'Instructions cannot exceed 1000 characters').optional(),
});

export const createDoctorPrescriptionSchema = z.object({
  patientId: z.string({ required_error: 'Patient ID is required' }).regex(objectIdRegex, 'Invalid patient ID format'),
  encounterId: z.string().regex(objectIdRegex, 'Invalid encounter ID format').optional(),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
  diagnosis: z.string().trim().max(500, 'Diagnosis note cannot exceed 500 characters').optional(),
  instructions: z.string().trim().min(2, 'Clinical instructions are required').max(4000),
  followUpInstructions: z.string().trim().max(2000, 'Follow-up instructions cannot exceed 2000 characters').optional(),
  validUntil: z.coerce.date().optional(),
  medications: z
    .array(doctorPrescriptionMedicationItemSchema)
    .min(1, 'Prescription must contain at least one prescribed medication')
    .max(30, 'Cannot exceed 30 medications per prescription'),
  isDraft: z.boolean().optional().default(false),
});

export const updateDoctorPrescriptionSchema = z.object({
  patientId: z.string().regex(objectIdRegex, 'Invalid patient ID format').optional(),
  encounterId: z.string().regex(objectIdRegex, 'Invalid encounter ID format').optional(),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
  diagnosis: z.string().trim().max(500, 'Diagnosis note cannot exceed 500 characters').optional(),
  instructions: z.string().trim().min(2, 'Clinical instructions are required').max(4000).optional(),
  followUpInstructions: z.string().trim().max(2000, 'Follow-up instructions cannot exceed 2000 characters').optional(),
  validUntil: z.coerce.date().optional(),
  medications: z
    .array(doctorPrescriptionMedicationItemSchema)
    .min(1, 'Prescription must contain at least one prescribed medication')
    .max(30, 'Cannot exceed 30 medications per prescription')
    .optional(),
  isDraft: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

export const issuePrescriptionSchema = z.object({
  confirmAttribution: z.boolean().refine((val) => val === true, {
    message: 'Attending clinician attribution must be explicitly confirmed before issuing prescription',
  }),
  notes: z.string().trim().max(1000, 'Issuance notes cannot exceed 1000 characters').optional(),
});

export const discontinuePrescriptionSchema = z.object({
  reason: z.string().trim().min(3, 'Discontinuation reason must be at least 3 characters').max(1000),
});

export const doctorPrescriptionFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['ALL', 'DRAFT', 'ACTIVE', 'COMPLETED', 'DISPENSED', 'CANCELLED', 'DISCONTINUED', 'EXPIRED']).optional().default('ALL'),
  search: z.string().trim().optional(),
  patientId: z.string().regex(objectIdRegex, 'Invalid patient ID format').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const medicationCatalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  dosageForm: z.string().trim().optional(),
  therapeuticClass: z.string().trim().optional(),
});

export const prescriptionIdParamSchema = z.object({
  prescriptionId: z.string({ required_error: 'Prescription ID is required' }).regex(objectIdRegex, 'Invalid prescription ID format'),
});

export const medicationCatalogIdParamSchema = z.object({
  medicationId: z.string({ required_error: 'Medication catalog ID is required' }).regex(objectIdRegex, 'Invalid medication catalog ID format'),
});
