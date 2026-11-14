import { z } from 'zod';

export const doctorPatientFilterQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  filter: z.enum(['all', 'recently-seen', 'upcoming-appointments', 'active-care']).optional().default('all'),
  facilityId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid facility ObjectId format')
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sortBy: z.enum(['lastEncounterDate', 'nextAppointmentDate', 'name', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const doctorPatientIdParamSchema = z.object({
  patientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid patient ObjectId parameter'),
});

export const patientTimelineQuerySchema = z.object({
  category: z
    .enum(['ALL', 'ENCOUNTER', 'PRESCRIPTION', 'LAB_REPORT', 'RECORD', 'APPOINTMENT'])
    .optional()
    .default('ALL'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const patientRecordFilterQuerySchema = z.object({
  recordType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const createDoctorConsentRequestSchema = z.object({
  purpose: z
    .string()
    .min(2, 'Purpose code is required')
    .max(50, 'Purpose code cannot exceed 50 characters'),
  purposeDescription: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  requestedDataTypes: z
    .array(z.string().min(1, 'Data type identifier cannot be empty'))
    .min(1, 'At least one health record data type must be requested'),
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day').max(365, 'Duration cannot exceed 365 days').default(30),
});

export type DoctorPatientFilterQuery = z.infer<typeof doctorPatientFilterQuerySchema>;
export type DoctorPatientIdParam = z.infer<typeof doctorPatientIdParamSchema>;
export type PatientTimelineQuery = z.infer<typeof patientTimelineQuerySchema>;
export type PatientRecordFilterQuery = z.infer<typeof patientRecordFilterQuerySchema>;
export type CreateDoctorConsentRequestInput = z.infer<typeof createDoctorConsentRequestSchema>;
