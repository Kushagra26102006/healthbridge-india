import { z } from 'zod';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const labReportIdParamSchema = z.object({
  reportId: z
    .string()
    .trim()
    .regex(OBJECT_ID_REGEX, 'Invalid Laboratory Report ID format (must be 24-char hex ObjectId)'),
});

export const labOrderIdParamSchema = z.object({
  orderId: z
    .string()
    .trim()
    .regex(OBJECT_ID_REGEX, 'Invalid Laboratory Order ID format (must be 24-char hex ObjectId)'),
});

export const labReportFilterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  category: z
    .enum([
      'BLOOD_TESTS',
      'URINE_TESTS',
      'BIOCHEMISTRY',
      'HEMATOLOGY',
      'IMAGING',
      'MICROBIOLOGY',
      'OTHER',
    ])
    .optional(),
  status: z.enum(['COMPLETED', 'PENDING', 'PRELIMINARY', 'CANCELLED', 'ALL']).optional(),
  laboratoryId: z.string().trim().regex(OBJECT_ID_REGEX, 'Invalid Laboratory ID').optional(),
  startDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  endDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  sortBy: z.enum(['reportDate', 'testDate', 'createdAt']).default('reportDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const labOrderFilterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(['ORDERED', 'SAMPLE_COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED', 'ALL'])
    .optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['orderedAt', 'createdAt']).default('orderedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type LabReportIdParam = z.infer<typeof labReportIdParamSchema>;
export type LabOrderIdParam = z.infer<typeof labOrderIdParamSchema>;
export type LabReportFilterQueryInput = z.infer<typeof labReportFilterQuerySchema>;
export type LabOrderFilterQueryInput = z.infer<typeof labOrderFilterQuerySchema>;

