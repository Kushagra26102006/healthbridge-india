import { z } from 'zod';

export const HEALTH_RECORD_TYPES_LIST = [
  'OP_CONSULTATION',
  'DISCHARGE_SUMMARY',
  'DIAGNOSTIC_REPORT',
  'PRESCRIPTION',
  'IMMUNIZATION_RECORD',
  'WELLNESS_RECORD',
] as const;

export const RECORD_SOURCES_LIST = ['MANUAL_ENTRY', 'ABDM_INGESTION', 'EHR_SYNC'] as const;

export const RECORD_VERIFICATION_STATUSES_LIST = ['VERIFIED', 'PENDING', 'SELF_SUBMITTED'] as const;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const recordTypeEnum = z.enum(HEALTH_RECORD_TYPES_LIST);
export const recordSourceEnum = z.enum(RECORD_SOURCES_LIST);
export const recordVerificationStatusEnum = z.enum(RECORD_VERIFICATION_STATUSES_LIST);
export const allowedMimeTypesEnum = z.enum(ALLOWED_MIME_TYPES);

export const createRecordSchema = z.object({
  title: z
    .string({ required_error: 'Medical record title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(200, 'Title cannot exceed 200 characters'),
  recordType: recordTypeEnum,
  recordDate: z
    .string({ required_error: 'Record date is required' })
    .min(1, 'Record date is required'),
  description: z.string().trim().max(5000, 'Description cannot exceed 5000 characters').optional(),
  doctorName: z.string().trim().max(200, 'Doctor name cannot exceed 200 characters').optional(),
  facilityName: z.string().trim().max(200, 'Facility name cannot exceed 200 characters').optional(),
  fileName: z.string().trim().max(255, 'File name cannot exceed 255 characters').optional(),
  fileSize: z
    .number()
    .max(MAX_FILE_SIZE_BYTES, 'File size exceeds maximum allowed 10MB')
    .optional(),
  mimeType: allowedMimeTypesEnum.optional(),
  fileData: z.string().optional(),
});

export const recordFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  category: recordTypeEnum.optional(),
  recordType: recordTypeEnum.optional(),
  source: recordSourceEnum.optional(),
  verificationStatus: recordVerificationStatusEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['recordDate', 'createdAt', 'title']).default('recordDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const recordIdParamSchema = z.object({
  recordId: z
    .string({ required_error: 'Record ID is required' })
    .regex(
      /^[0-9a-fA-F]{24}$/,
      'Invalid record ID format. Must be a 24-character hexadecimal ObjectId'
    ),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type RecordFilterQueryInput = z.infer<typeof recordFilterQuerySchema>;
export type RecordIdParamInput = z.infer<typeof recordIdParamSchema>;
