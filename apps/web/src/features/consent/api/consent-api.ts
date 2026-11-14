import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  ConsentListItemDto,
  ConsentDetailDto,
  ConsentSummaryMetricsDto,
  ConsentHistoryEventDto,
  ConsentFilterQueryDto,
  ApproveConsentInputDto,
  RejectConsentInputDto,
  RevokeConsentInputDto,
  PaginationMeta,
} from '@healthbridge/shared-types';

export const consentApi = {
  /**
   * Fetch paginated list of consent requests and permissions with status and search filters
   */
  async getConsents(
    filters: ConsentFilterQueryDto = {}
  ): Promise<{ items: ConsentListItemDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.CONSENT}?${queryString}`
      : API_ENDPOINTS.CONSENT;

    const response = await apiClient.get<ApiResponse<ConsentListItemDto[]>>(endpoint);
    return {
      items: response.data.data || [],
      pagination: (response.data.meta as PaginationMeta) || {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: response.data.data?.length || 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  /**
   * Fetch KPI summary metrics for patient consent dashboard
   */
  async getSummary(): Promise<ConsentSummaryMetricsDto> {
    const response = await apiClient.get<ApiResponse<ConsentSummaryMetricsDto>>(
      `${API_ENDPOINTS.CONSENT}/summary`
    );
    return response.data.data!;
  },

  /**
   * Fetch pending incoming access requests
   */
  async getRequests(
    filters: ConsentFilterQueryDto = {}
  ): Promise<{ items: ConsentListItemDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.CONSENT}/requests?${queryString}`
      : `${API_ENDPOINTS.CONSENT}/requests`;

    const response = await apiClient.get<ApiResponse<ConsentListItemDto[]>>(endpoint);
    return {
      items: response.data.data || [],
      pagination: (response.data.meta as PaginationMeta) || {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: response.data.data?.length || 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  /**
   * Fetch currently active permissions
   */
  async getActive(
    filters: ConsentFilterQueryDto = {}
  ): Promise<{ items: ConsentListItemDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.CONSENT}/active?${queryString}`
      : `${API_ENDPOINTS.CONSENT}/active`;

    const response = await apiClient.get<ApiResponse<ConsentListItemDto[]>>(endpoint);
    return {
      items: response.data.data || [],
      pagination: (response.data.meta as PaginationMeta) || {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: response.data.data?.length || 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  /**
   * Fetch chronological consent audit timeline
   */
  async getHistory(): Promise<ConsentHistoryEventDto[]> {
    const response = await apiClient.get<ApiResponse<ConsentHistoryEventDto[]>>(
      `${API_ENDPOINTS.CONSENT}/history`
    );
    return response.data.data || [];
  },

  /**
   * Fetch full details of a single consent request
   */
  async getConsentById(consentId: string): Promise<ConsentDetailDto> {
    const response = await apiClient.get<ApiResponse<ConsentDetailDto>>(
      `${API_ENDPOINTS.CONSENT}/${consentId}`
    );
    return response.data.data!;
  },

  /**
   * Approve a pending consent request
   */
  async approveConsent(
    consentId: string,
    input: ApproveConsentInputDto = {}
  ): Promise<ConsentDetailDto> {
    const response = await apiClient.post<ApiResponse<ConsentDetailDto>>(
      `${API_ENDPOINTS.CONSENT}/${consentId}/approve`,
      input
    );
    return response.data.data!;
  },

  /**
   * Reject a pending consent request
   */
  async rejectConsent(
    consentId: string,
    input: RejectConsentInputDto = {}
  ): Promise<ConsentDetailDto> {
    const response = await apiClient.post<ApiResponse<ConsentDetailDto>>(
      `${API_ENDPOINTS.CONSENT}/${consentId}/reject`,
      input
    );
    return response.data.data!;
  },

  /**
   * Revoke an active consent permission
   */
  async revokeConsent(
    consentId: string,
    input: RevokeConsentInputDto = {}
  ): Promise<ConsentDetailDto> {
    const response = await apiClient.post<ApiResponse<ConsentDetailDto>>(
      `${API_ENDPOINTS.CONSENT}/${consentId}/revoke`,
      input
    );
    return response.data.data!;
  },
};
