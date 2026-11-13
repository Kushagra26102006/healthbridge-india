import type { PaginationMeta } from '@healthbridge/shared-types';
import { sanitizeMongoQuery, sanitizeRegexPattern, sanitizeString } from './sanitization';
import type {
  PaginationQueryOptions,
  ParsedPagination,
} from '../shared/interfaces/pagination.interface';

export interface PaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  allowedSortFields?: string[];
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  allowedFilterFields?: string[];
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'status'];

/**
 * Parses, sanitizes, and enforces limits on request pagination, sorting, and filtering
 */
export const parsePaginationParams = (
  query: PaginationQueryOptions,
  options: PaginationOptions = {}
): ParsedPagination => {
  const defaultPage = options.defaultPage ?? DEFAULT_PAGE;
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;
  const allowedSortFields = options.allowedSortFields ?? DEFAULT_ALLOWED_SORT_FIELDS;
  const defaultSortBy = options.defaultSortBy ?? 'createdAt';
  const defaultSortOrder = options.defaultSortOrder ?? 'desc';
  const allowedFilterFields = new Set(options.allowedFilterFields ?? []);

  // 1. Parse & Clamp Page
  let page = parseInt(String(query.page ?? ''), 10);
  if (isNaN(page) || page < 1) {
    page = defaultPage;
  }

  // 2. Parse & Clamp Limit (Enforce unbounded query prevention)
  let limit = parseInt(String(query.limit ?? ''), 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  // 3. Sorting allowlist enforcement
  const requestedSortBy = String(query.sortBy ?? '').trim();
  const sortBy = allowedSortFields.includes(requestedSortBy) ? requestedSortBy : defaultSortBy;

  const rawSortOrder = String(query.sortOrder ?? defaultSortOrder).toLowerCase();
  const sortOrder: 1 | -1 = rawSortOrder === 'asc' || rawSortOrder === '1' ? 1 : -1;

  // 4. Search term sanitization
  let search: string | undefined = undefined;
  if (query.search && typeof query.search === 'string') {
    const cleaned = sanitizeString(query.search);
    if (cleaned.length > 0) {
      search = sanitizeRegexPattern(cleaned);
    }
  }

  // 5. Strict filter allowlist enforcement and query sanitization
  const filters: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(query)) {
    if (allowedFilterFields.has(key) && val !== undefined && val !== '') {
      filters[key] = sanitizeMongoQuery(val);
    }
  }

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    search,
    filters,
  };
};

/**
 * Generates standard pagination metadata object
 */
export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const safeTotal = Math.max(0, total);
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const safePage = Math.max(1, page);

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
};
