import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  IMedicalRecord,
  MedicalRecordDetailDto,
  MedicalRecordSummaryDto,
  MedicalRecordFilterQueryDto,
  MedicalRecordAccessTokenDto,
  CreateMedicalRecordDto,
  PaginationMeta,
} from '@healthbridge/shared-types';

export interface UploadRecordOptions {
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}

export const recordsApi = {
  /**
   * Fetch paginated list of health records for authenticated patient (or consented doctor)
   */
  async getRecords(
    filters: MedicalRecordFilterQueryDto = {}
  ): Promise<{ items: IMedicalRecord[]; pagination: PaginationMeta }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.recordType) params.append('recordType', filters.recordType);
    if (filters.source) params.append('source', filters.source);
    if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
    if (filters.provider) params.append('provider', filters.provider);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.includeArchived) params.append('includeArchived', 'true');
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
   * Fetch summary count and real storage usage across clinical document categories
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
   * Upload / create a new patient-authored medical record with real progress & cancellation
   */
  async uploadRecord(
    data: CreateMedicalRecordDto,
    options?: UploadRecordOptions
  ): Promise<IMedicalRecord> {
    const response = await apiClient.post<ApiResponse<IMedicalRecord>>(
      API_ENDPOINTS.RECORDS,
      data,
      {
        signal: options?.signal,
        onUploadProgress: (progressEvent) => {
          if (!options?.onProgress) return;
          if (progressEvent.total && progressEvent.total > 0) {
            const pct = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
            options.onProgress(pct);
          }
        },
      }
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to create record');
    }
    options?.onProgress?.(100);
    return response.data.data;
  },

  /**
   * Request a short-lived HMAC-signed access token for authorized document preview/download
   */
  async getAccessToken(
    recordId: string,
    signal?: AbortSignal
  ): Promise<MedicalRecordAccessTokenDto> {
    const response = await apiClient.get<ApiResponse<MedicalRecordAccessTokenDto>>(
      `${API_ENDPOINTS.RECORDS}/${recordId}/access-token`,
      { signal }
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to obtain secure document access token');
    }
    return response.data.data;
  },

  /**
   * Stream an authorized preview binary into a private in-memory Blob URL
   */
  async fetchPreviewBlob(
    recordId: string,
    signedToken?: string,
    signal?: AbortSignal
  ): Promise<{ blobUrl: string; mimeType: string; size: number }> {
    const endpoint = signedToken
      ? `${API_ENDPOINTS.RECORDS}/${recordId}/preview?token=${encodeURIComponent(signedToken)}`
      : `${API_ENDPOINTS.RECORDS}/${recordId}/preview`;

    const response = await apiClient.get(endpoint, {
      responseType: 'blob',
      signal,
    });

    const contentType = response.headers?.['content-type'];
    const mimeType = typeof contentType === 'string' ? contentType : 'application/pdf';
    const blob = new Blob([response.data], { type: mimeType });
    const blobUrl = window.URL.createObjectURL(blob);

    return {
      blobUrl,
      mimeType,
      size: blob.size,
    };
  },

  /**
   * Safe owner-only archival of a medical document
   */
  async archiveRecord(recordId: string): Promise<{ id: string; isArchived: true; archivedAt: string }> {
    const response = await apiClient.delete<
      ApiResponse<{ id: string; isArchived: true; archivedAt: string }>
    >(`${API_ENDPOINTS.RECORDS}/${recordId}`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Failed to archive medical document');
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
