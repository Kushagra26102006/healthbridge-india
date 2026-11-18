/**
 * HealthBridge India — Global Search & Discovery Zod Validation Schemas (Day 8 Task 02)
 */

import { z } from 'zod';

export const GLOBAL_SEARCH_RESOURCE_TYPES = [
  'patient',
  'doctor',
  'pharmacy',
  'laboratory',
  'appointment',
  'prescription',
  'lab_order',
  'lab_report',
  'medical_record',
  'encounter',
  'medicine',
  'inventory',
  'pharmacy_order',
  'dispensing',
  'supplier',
  'lab_sample',
  'lab_test',
  'external_record',
  'user',
] as const;

export const globalSearchResourceTypeSchema = z.enum(GLOBAL_SEARCH_RESOURCE_TYPES);

const isoDateOptionalSchema = z
  .string()
  .trim()
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: 'Must be a valid ISO-8601 date string',
  })
  .optional();

const parsedTypesSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    const rawList = Array.isArray(val) ? val : val.split(',');
    const cleaned = rawList
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned : undefined;
  })
  .pipe(z.array(globalSearchResourceTypeSchema).max(19).optional());

export const globalSearchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query parameter q is required' })
    .trim()
    .min(1, 'Search query must be at least 1 character')
    .max(100, 'Search query must not exceed 100 characters'),
  types: parsedTypesSchema,
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(['relevance', 'date', 'title']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  from: isoDateOptionalSchema,
  to: isoDateOptionalSchema,
  status: z.string().trim().max(40).optional(),
  category: z.string().trim().max(60).optional(),
});

export const globalSearchSuggestionsQuerySchema = z.object({
  q: z
    .string({ required_error: 'Query parameter q is required for suggestions' })
    .trim()
    .min(2, 'Suggestions require at least 2 characters')
    .max(80, 'Suggestion query must not exceed 80 characters'),
  limit: z.coerce.number().int().min(1).max(12).default(8),
});
