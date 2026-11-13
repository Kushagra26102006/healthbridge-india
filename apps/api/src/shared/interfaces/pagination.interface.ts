import type { PaginationMeta } from '@healthbridge/shared-types';

export interface PaginationQueryOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | '1' | '-1';
  search?: string;
  [key: string]: unknown;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 1 | -1;
  search?: string;
  filters: Record<string, unknown>;
}

export interface PaginatedResponseData<T> {
  items: T[];
  meta: PaginationMeta;
}
