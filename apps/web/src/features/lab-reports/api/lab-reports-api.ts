import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  LabReportListItemDto,
  LabReportDetailDto,
  LabReportSummaryMetricsDto,
  LabOrderListItemDto,
  LabOrderDetailDto,
  LabReportFilterQueryDto,
  LabOrderFilterQueryDto,
  PaginationMeta,
} from '@healthbridge/shared-types';

export const labReportsApi = {
  /**
   * Fetch paginated list of laboratory reports with multi-facet filters
   */
  async getReports(
    filters: LabReportFilterQueryDto = {}
  ): Promise<{ items: LabReportListItemDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.laboratoryId) params.append('laboratoryId', filters.laboratoryId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.LAB_REPORTS}?${queryString}`
      : API_ENDPOINTS.LAB_REPORTS;

    const response = await apiClient.get<ApiResponse<LabReportListItemDto[]>>(endpoint);

    return {
      items: response.data.data || [],
      pagination: (response.data.meta as PaginationMeta) || {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: (response.data.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  /**
   * Fetch summary metrics count across diagnostic reports
   */
  async getSummary(): Promise<LabReportSummaryMetricsDto> {
    const response = await apiClient.get<ApiResponse<LabReportSummaryMetricsDto>>(
      `${API_ENDPOINTS.LAB_REPORTS}/summary`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch laboratory reports summary');
    }
    return response.data.data;
  },

  /**
   * Fetch complete details and observation values for a single report
   */
  async getReportById(reportId: string): Promise<LabReportDetailDto> {
    const response = await apiClient.get<ApiResponse<LabReportDetailDto>>(
      `${API_ENDPOINTS.LAB_REPORTS}/${reportId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Laboratory report not found');
    }
    return response.data.data;
  },

  /**
   * Download authorized PDF/diagnostic report document stream
   */
  async downloadReportDocument(reportId: string, customFileName?: string): Promise<void> {
    const response = await apiClient.get(
      `${API_ENDPOINTS.LAB_REPORTS}/${reportId}/download`,
      {
        responseType: 'blob',
      }
    );

    // Extract filename from Content-Disposition header if available
    let fileName = customFileName || `lab-report-${reportId}.pdf`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        fileName = match[1];
      }
    }

    const contentType =
      typeof response.headers['content-type'] === 'string'
        ? response.headers['content-type']
        : 'application/pdf';
    const blob = new Blob([response.data], {
      type: contentType,
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Fetch paginated laboratory test orders
   */
  async getOrders(
    filters: LabOrderFilterQueryDto = {}
  ): Promise<{ items: LabOrderListItemDto[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.LAB_ORDERS}?${queryString}`
      : API_ENDPOINTS.LAB_ORDERS;

    const response = await apiClient.get<ApiResponse<LabOrderListItemDto[]>>(endpoint);

    return {
      items: response.data.data || [],
      pagination: (response.data.meta as PaginationMeta) || {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: (response.data.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  /**
   * Fetch single diagnostic test order details
   */
  async getOrderById(orderId: string): Promise<LabOrderDetailDto> {
    const response = await apiClient.get<ApiResponse<LabOrderDetailDto>>(
      `${API_ENDPOINTS.LAB_ORDERS}/${orderId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Laboratory order not found');
    }
    return response.data.data;
  },
};
