import { describe, it, expect } from 'vitest';
import {
  parsePaginationParams,
  createPaginationMeta,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from '../../src/utils/pagination';

describe('Pagination & Filtering Unit Tests', () => {
  it('should use sensible defaults when empty query is provided', () => {
    const result = parsePaginationParams({});
    expect(result.page).toBe(DEFAULT_PAGE);
    expect(result.limit).toBe(DEFAULT_LIMIT);
    expect(result.skip).toBe(0);
    expect(result.sortBy).toBe('createdAt');
    expect(result.sortOrder).toBe(-1);
    expect(result.search).toBeUndefined();
    expect(result.filters).toEqual({});
  });

  it('should parse valid page and limit values', () => {
    const result = parsePaginationParams({ page: '3', limit: '25' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(25);
    expect(result.skip).toBe(50); // (3 - 1) * 25
  });

  it('should clamp limit to maxLimit to prevent unbounded queries', () => {
    const result = parsePaginationParams({ limit: '1000' }, { maxLimit: 50 });
    expect(result.limit).toBe(50);
  });

  it('should fallback to defaultSortBy if requested sort field is not in allowlist', () => {
    const result = parsePaginationParams(
      { sortBy: 'unauthorizedInternalField' },
      { allowedSortFields: ['createdAt', 'name', 'status'], defaultSortBy: 'createdAt' }
    );
    expect(result.sortBy).toBe('createdAt');
  });

  it('should allow valid sort field and parse ascending order', () => {
    const result = parsePaginationParams(
      { sortBy: 'name', sortOrder: 'asc' },
      { allowedSortFields: ['createdAt', 'name', 'status'] }
    );
    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe(1);
  });

  it('should sanitize search queries against regex characters and control bytes', () => {
    const result = parsePaginationParams({ search: 'Dr. John [Specialist] *' });
    expect(result.search).toBe('Dr\\. John \\[Specialist\\] \\*');
  });

  it('should filter only allowed fields and sanitize filter values', () => {
    const query = {
      status: 'ACTIVE',
      role: 'DOCTOR',
      secretField: 'malicious',
      $where: 'sleep(1000)',
    };

    const result = parsePaginationParams(query, {
      allowedFilterFields: ['status', 'role'],
    });

    expect(result.filters).toEqual({
      status: 'ACTIVE',
      role: 'DOCTOR',
    });
    expect((result.filters as any).secretField).toBeUndefined();
    expect((result.filters as any).$where).toBeUndefined();
  });

  it('should correctly calculate pagination metadata', () => {
    const meta = createPaginationMeta(105, 2, 20);
    expect(meta.total).toBe(105);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(20);
    expect(meta.totalPages).toBe(6); // ceil(105 / 20)
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('should handle edge cases in pagination metadata (total = 0)', () => {
    const meta = createPaginationMeta(0, 1, 20);
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });
});

