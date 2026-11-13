import { z } from 'zod';

/**
 * Reusable Zod Schemas for Pagination & API Query Parameters
 */

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be greater than or equal to 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100, 'Limit cannot exceed 100')),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc', '1', '-1']).optional().default('desc'),
  search: z.string().max(100, 'Search query cannot exceed 100 characters').optional(),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

export const apiQueryFilterSchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  role: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type ApiQueryFilterInput = z.infer<typeof apiQueryFilterSchema>;
