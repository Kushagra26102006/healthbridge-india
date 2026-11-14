import { z } from 'zod';
import { objectIdRegex } from './appointment.schema';

export const encounterTypeEnum = z.enum(['AMBULATORY', 'EMERGENCY', 'INPATIENT', 'HOME', 'VIRTUAL']);
export const encounterStatusEnum = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const diagnosisClassificationEnum = z.enum(['PRIMARY', 'SECONDARY']);
export const diagnosisClinicalStatusEnum = z.enum(['ACTIVE', 'RECURRENCE', 'RELAPSE', 'REMISSION', 'RESOLVED']);

export const encounterVitalsSchema = z.object({
  bloodPressureSystolic: z.number().int().min(40, 'Systolic BP must be >= 40').max(300, 'Systolic BP must be <= 300').optional(),
  bloodPressureDiastolic: z.number().int().min(20, 'Diastolic BP must be >= 20').max(200, 'Diastolic BP must be <= 200').optional(),
  heartRate: z.number().int().min(30, 'Heart rate must be >= 30 bpm').max(250, 'Heart rate must be <= 250 bpm').optional(),
  respiratoryRate: z.number().int().min(5, 'Respiratory rate must be >= 5').max(60, 'Respiratory rate must be <= 60').optional(),
  temperature: z.number().min(30, 'Body temperature must be >= 30°C').max(45, 'Body temperature must be <= 45°C').optional(),
  oxygenSaturation: z.number().min(50, 'Oxygen saturation must be >= 50%').max(100, 'Oxygen saturation must be <= 100%').optional(),
  height: z.number().min(20, 'Height must be >= 20 cm').max(300, 'Height must be <= 300 cm').optional(),
  weight: z.number().min(0.5, 'Weight must be >= 0.5 kg').max(500, 'Weight must be <= 500 kg').optional(),
  bmi: z.number().min(5).max(100).optional(),
  recordedAt: z.string().optional(),
});

export const encounterDiagnosisItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Diagnosis name is required').max(200, 'Diagnosis name cannot exceed 200 characters'),
  code: z.string().trim().max(50, 'Clinical code cannot exceed 50 characters').optional(),
  type: diagnosisClassificationEnum.default('PRIMARY'),
  clinicalStatus: diagnosisClinicalStatusEnum.default('ACTIVE'),
  notes: z.string().trim().max(1000, 'Diagnosis notes cannot exceed 1000 characters').optional(),
});

export const encounterExaminationSchema = z.object({
  general: z.string().trim().max(2000, 'General examination cannot exceed 2000 characters').optional(),
  systemic: z.string().trim().max(4000, 'Systemic examination cannot exceed 4000 characters').optional(),
});

export const createEncounterSchema = z.object({
  patientId: z.string({ required_error: 'Patient ID is required' }).regex(objectIdRegex, 'Invalid patient ID format'),
  appointmentId: z.string().regex(objectIdRegex, 'Invalid appointment ID format').optional(),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
  encounterType: encounterTypeEnum.default('AMBULATORY'),
  chiefComplaint: z.string().trim().max(1000, 'Chief complaint cannot exceed 1000 characters').optional(),
});

export const updateEncounterDraftSchema = z.object({
  chiefComplaint: z.string().trim().max(2000, 'Chief complaint cannot exceed 2000 characters').optional(),
  historyOfPresentIllness: z.string().trim().max(4000, 'History of present illness cannot exceed 4000 characters').optional(),
  medicalHistory: z.string().trim().max(4000, 'Medical history cannot exceed 4000 characters').optional(),
  vitals: encounterVitalsSchema.optional(),
  examination: encounterExaminationSchema.optional(),
  diagnoses: z.array(encounterDiagnosisItemSchema).max(30, 'Cannot exceed 30 diagnoses').optional(),
  assessment: z.string().trim().max(4000, 'Assessment cannot exceed 4000 characters').optional(),
  treatmentPlan: z.string().trim().max(4000, 'Treatment plan cannot exceed 4000 characters').optional(),
  followUpInstructions: z.string().trim().max(2000, 'Follow-up instructions cannot exceed 2000 characters').optional(),
  followUpDate: z.string().optional(),
  linkedRecordIds: z.array(z.string().regex(objectIdRegex, 'Invalid record ID format')).optional(),
  linkedPrescriptionIds: z.array(z.string().regex(objectIdRegex, 'Invalid prescription ID format')).optional(),
  version: z.number().int().min(1).optional(),
});

export const completeEncounterSchema = updateEncounterDraftSchema;

export const encounterFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  filterTab: z.enum(['all', 'today', 'draft', 'completed', 'pending']).optional(),
  search: z.string().trim().max(100).optional(),
  patientId: z.string().regex(objectIdRegex, 'Invalid patient ID format').optional(),
  facilityId: z.string().regex(objectIdRegex, 'Invalid facility ID format').optional(),
  encounterType: encounterTypeEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const encounterIdParamSchema = z.object({
  encounterId: z.string({ required_error: 'Encounter ID is required' }).regex(objectIdRegex, 'Invalid encounter ID format'),
});

export const patientIdParamSchema = z.object({
  patientId: z.string({ required_error: 'Patient ID is required' }).regex(objectIdRegex, 'Invalid patient ID format'),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
export type UpdateEncounterDraftInput = z.infer<typeof updateEncounterDraftSchema>;
export type CompleteEncounterInput = z.infer<typeof completeEncounterSchema>;
export type EncounterFilterQueryInput = z.infer<typeof encounterFilterQuerySchema>;
export type EncounterIdParamInput = z.infer<typeof encounterIdParamSchema>;
export type PatientIdParamInput = z.infer<typeof patientIdParamSchema>;
