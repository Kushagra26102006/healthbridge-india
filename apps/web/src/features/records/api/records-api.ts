import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  IMedicalRecord,
  MedicalRecordDetailDto,
  MedicalRecordSummaryDto,
  MedicalRecordFilterQueryDto,
  CreateMedicalRecordDto,
  PaginationMeta,
} from '@healthbridge/shared-types';

export const recordsApi = {
  /**
   * Fetch paginated list of health records for authenticated patient
   */
  async getRecords(
    filters: MedicalRecordFilterQueryDto = {}
  ): Promise<{ items: IMedicalRecord[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.source) params.append('source', filters.source);
    if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.RECORDS}?${queryString}`
      : API_ENDPOINTS.RECORDS;

    const response = await apiClient.get<ApiResponse<IMedicalRecord[]>>(endpoint);

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
   * Fetch summary count across clinical document categories
   */
  async getRecordSummary(): Promise<MedicalRecordSummaryDto> {
    const response = await apiClient.get<ApiResponse<MedicalRecordSummaryDto>>(
      `${API_ENDPOINTS.RECORDS}/summary`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch records summary');
    }
    return response.data.data;
  },

  /**
   * Fetch single medical record by ID with FHIR representation
   */
  async getRecordById(recordId: string): Promise<MedicalRecordDetailDto> {
    const response = await apiClient.get<ApiResponse<MedicalRecordDetailDto>>(
      `${API_ENDPOINTS.RECORDS}/${recordId}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch record details');
    }
    return response.data.data;
  },

  /**
   * Upload / create a new patient-authored medical record
   */
  async uploadRecord(data: CreateMedicalRecordDto): Promise<IMedicalRecord> {
    const response = await apiClient.post<ApiResponse<IMedicalRecord>>(API_ENDPOINTS.RECORDS, data);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to create record');
    }
    return response.data.data;
  },

  /**
   * Download authorized clinical document binary safely
   */
  async downloadRecord(recordId: string, customFileName?: string): Promise<void> {
    const response = await apiClient.get(`${API_ENDPOINTS.RECORDS}/${recordId}/download`, {
      responseType: 'blob',
    });

    // Extract filename from header or fallback
    let fileName = customFileName || `healthbridge_record_${recordId}.pdf`;
    const disposition = response.headers?.['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1]);
      }
    }

    // Trigger browser download safely
    const contentType = response.headers?.['content-type'];
    const mimeString = typeof contentType === 'string' ? contentType : 'application/pdf';
    const blob = new Blob([response.data], {
      type: mimeString,
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
};

export default recordsApi;
