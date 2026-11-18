/**
 * HealthBridge India — Global Search & Discovery Shared Contracts (Day 8 Task 02)
 *
 * Explicit minimal DTOs only — raw Mongoose documents, passwords, tokens, ABHA identifiers,
 * and sensitive clinical observation values are NEVER returned in global search payloads.
 */

export type GlobalSearchResourceType =
  | 'patient'
  | 'doctor'
  | 'pharmacy'
  | 'laboratory'
  | 'appointment'
  | 'prescription'
  | 'lab_order'
  | 'lab_report'
  | 'medical_record'
  | 'encounter'
  | 'medicine'
  | 'inventory'
  | 'pharmacy_order'
  | 'dispensing'
  | 'supplier'
  | 'lab_sample'
  | 'lab_test'
  | 'external_record'
  | 'user';

export type GlobalSearchCategoryGroup =
  | 'PEOPLE'
  | 'HEALTHCARE_PROVIDERS'
  | 'APPOINTMENTS'
  | 'PRESCRIPTIONS'
  | 'LABORATORY'
  | 'MEDICAL_RECORDS'
  | 'MEDICINES'
  | 'PHARMACY_OPERATIONS'
  | 'ABDM_EXTERNAL';

export type GlobalSearchSortField = 'relevance' | 'date' | 'title';
export type GlobalSearchSortOrder = 'asc' | 'desc';

export interface GlobalSearchResultItemDto {
  id: string;
  resourceType: GlobalSearchResourceType;
  categoryGroup: GlobalSearchCategoryGroup;
  title: string;
  description: string;
  date?: string;
  status?: string;
  sourceModule: string;
  destinationRoute: string;
  metadata: Record<string, string | number | boolean | undefined>;
  score: number;
}

export interface GlobalSearchPaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GlobalSearchAppliedFiltersDto {
  types: GlobalSearchResourceType[];
  sortBy: GlobalSearchSortField;
  sortOrder: GlobalSearchSortOrder;
  from?: string;
  to?: string;
  status?: string;
  category?: string;
}

export interface GlobalSearchResponseDto {
  query: string;
  results: GlobalSearchResultItemDto[];
  groupedCounts: Partial<Record<GlobalSearchCategoryGroup, number>>;
  typeCounts: Partial<Record<GlobalSearchResourceType, number>>;
  pagination: GlobalSearchPaginationDto;
  appliedFilters: GlobalSearchAppliedFiltersDto;
  allowedTypes: GlobalSearchResourceType[];
  executionTimeMs: number;
}

export interface GlobalSearchSuggestionItemDto {
  id: string;
  resourceType: GlobalSearchResourceType | 'recent';
  categoryGroup: GlobalSearchCategoryGroup | 'RECENT';
  title: string;
  subtitle: string;
  destinationRoute: string;
  isRecent?: boolean;
}

export interface GlobalSearchSuggestionsResponseDto {
  query: string;
  suggestions: GlobalSearchSuggestionItemDto[];
  allowedTypes: GlobalSearchResourceType[];
}

export interface RecentSearchEntryDto {
  id: string;
  query: string;
  types: GlobalSearchResourceType[];
  timestamp: string;
  storagePolicy: 'SESSION_MEMORY_ONLY';
}
