/**
 * HealthBridge India — Role-Aware Global Search API Client (Day 8 Task 02/06)
 *
 * Supports `AbortSignal` to cancel stale debounced autocomplete requests cleanly.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  GlobalSearchResourceType,
  GlobalSearchResponseDto,
  GlobalSearchSortField,
  GlobalSearchSortOrder,
  GlobalSearchSuggestionsResponseDto,
  RecentSearchEntryDto,
} from '@healthbridge/shared-types';

export interface GlobalSearchRequestParams {
  q: string;
  types?: GlobalSearchResourceType[];
  page?: number;
  limit?: number;
  sortBy?: GlobalSearchSortField;
  sortOrder?: GlobalSearchSortOrder;
  from?: string;
  to?: string;
  status?: string;
  category?: string;
}

export const searchApi = {
  async search(
    params: GlobalSearchRequestParams,
    signal?: AbortSignal
  ): Promise<GlobalSearchResponseDto> {
    const qs = new URLSearchParams();
    qs.set('q', params.q);
    if (params.types && params.types.length > 0) qs.set('types', params.types.join(','));
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.sortBy) qs.set('sortBy', params.sortBy);
    if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.status) qs.set('status', params.status);
    if (params.category) qs.set('category', params.category);

    const res = await apiClient.get<ApiResponse<GlobalSearchResponseDto>>(
      `${API_ENDPOINTS.SEARCH.ROOT}?${qs.toString()}`,
      { signal }
    );
    return res.data.data!;
  },

  async getSuggestions(
    q: string,
    limit = 8,
    signal?: AbortSignal
  ): Promise<GlobalSearchSuggestionsResponseDto> {
    const qs = new URLSearchParams({ q, limit: String(limit) });
    const res = await apiClient.get<ApiResponse<GlobalSearchSuggestionsResponseDto>>(
      `${API_ENDPOINTS.SEARCH.SUGGESTIONS}?${qs.toString()}`,
      { signal }
    );
    return res.data.data!;
  },

  async getRecent(signal?: AbortSignal): Promise<{
    entries: RecentSearchEntryDto[];
    storagePolicy: 'SESSION_MEMORY_ONLY';
  }> {
    const res = await apiClient.get<
      ApiResponse<{ entries: RecentSearchEntryDto[]; storagePolicy: 'SESSION_MEMORY_ONLY' }>
    >(API_ENDPOINTS.SEARCH.RECENT, { signal });
    return res.data.data!;
  },

  async clearRecent(): Promise<{ clearedCount: number }> {
    const res = await apiClient.delete<ApiResponse<{ clearedCount: number }>>(
      API_ENDPOINTS.SEARCH.RECENT
    );
    return res.data.data!;
  },
};
