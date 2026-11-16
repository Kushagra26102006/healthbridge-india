/**
 * HealthBridge India — Laboratory Reports API Client
 * Frontend HTTP client for laboratory report drafting, review, approval, publication,
 * versioning, and secure access across laboratory staff, patients, and doctors.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  LabReportDetailDto,
  LabReportListItemDto,
  LabReportVersionDto,
  GenerateReportDraftDto,
  SubmitReportForReviewDto,
  ReviewReportDto,
  ApproveReportDto,
  PublishReportDto,
  RequestAmendmentDto,
  FHIRDiagnosticReportBundle,
} from '@healthbridge/shared-types';

export interface ReportFilterParams {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const laboratoryReportsApi = {
  // 1. List Laboratory Reports (Staff view)
  listReports: async (
    params?: ReportFilterParams
  ): Promise<{ items: LabReportListItemDto[]; total: number; page: number; limit: number; totalPages: number }> => {
    const res = await apiClient.get<ApiResponse<LabReportListItemDto[]>>(
      API_ENDPOINTS.LABORATORY.REPORTS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
      totalPages: meta.totalPages || 1,
    };
  },

  // 2. Single Report Details
  getReportById: async (reportId: string): Promise<LabReportDetailDto> => {
    const res = await apiClient.get<ApiResponse<LabReportDetailDto>>(
      API_ENDPOINTS.LABORATORY.REPORT_DETAIL(reportId)
    );
    return res.data.data!;
  },

  // 3. Record Test Result
  recordTestResult: async (dto: any): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.LABORATORY.REPORT_TEST_RESULTS,
      dto
    );
    return res.data.data;
  },

  // 4. Generate Report Draft
  generateDraft: async (dto: GenerateReportDraftDto): Promise<LabReportDetailDto> => {
    const res = await apiClient.post<ApiResponse<LabReportDetailDto>>(
      API_ENDPOINTS.LABORATORY.REPORT_DRAFT,
      dto
    );
    return res.data.data!;
  },

  // 5. Submit for Review
  submitForReview: async (reportId: string, dto: SubmitReportForReviewDto): Promise<LabReportDetailDto> => {
    const res = await apiClient.post<ApiResponse<LabReportDetailDto>>(
      API_ENDPOINTS.LABORATORY.REPORT_SUBMIT_REVIEW(reportId),
      dto
    );
    return res.data.data!;
  },

  // 6. Review Report (Approve / Reject / Correction)
  reviewReport: async (reportId: string, dto: ReviewReportDto): Promise<LabReportDetailDto> => {
    const res = await apiClient.post<ApiResponse<LabReportDetailDto>>(
      API_ENDPOINTS.LABORATORY.REPORT_REVIEW(reportId),
      dto
    );
    return res.data.data!;
  },

  // 7. Authorize Approval
  approveReport: async (reportId: string, dto: ApproveReportDto): Promise<LabReportDetailDto> => {
    const res = await apiClient.post<ApiResponse<LabReportDetailDto>>(
      API_ENDPOINTS.LABORATORY.REPORT_APPROVE(reportId),
      dto
    );
    return res.data.data!;
  },

  // 8. Publish Report
  publishReport: async (reportId: string, dto: PublishReportDto): Promise<LabReportDetailDto> => {
    const res = await apiClient.post<ApiResponse<LabReportDetailDto>>(
      API_ENDPOINTS.LABORATORY.REPORT_PUBLISH(reportId),
      dto
    );
    return res.data.data!;
  },

  // 9. Request Amendment
  requestAmendment: async (reportId: string, dto: RequestAmendmentDto): Promise<LabReportDetailDto> => {
    const res = await apiClient.post<ApiResponse<LabReportDetailDto>>(
      API_ENDPOINTS.LABORATORY.REPORT_AMEND(reportId),
      dto
    );
    return res.data.data!;
  },

  // 10. Immutable Version History
  getReportVersions: async (reportId: string): Promise<LabReportVersionDto[]> => {
    const res = await apiClient.get<ApiResponse<LabReportVersionDto[]>>(
      API_ENDPOINTS.LABORATORY.REPORT_VERSIONS(reportId)
    );
    return res.data.data || [];
  },

  // 11. PDF Blob Download / Streaming
  downloadReportPdf: async (reportId: string, version?: number): Promise<Blob> => {
    const res = await apiClient.get(API_ENDPOINTS.LABORATORY.REPORT_PDF(reportId), {
      params: version ? { version } : undefined,
      responseType: 'blob',
    });
    return res.data as Blob;
  },

  // 12. HL7 FHIR DiagnosticReport Bundle
  getFhirBundle: async (reportId: string): Promise<FHIRDiagnosticReportBundle> => {
    const res = await apiClient.get<ApiResponse<FHIRDiagnosticReportBundle>>(
      API_ENDPOINTS.LABORATORY.REPORT_FHIR(reportId)
    );
    return res.data.data!;
  },

  // 13. Patient-facing API
  getPatientReports: async (
    params?: ReportFilterParams
  ): Promise<{ items: LabReportListItemDto[]; total: number; page: number; limit: number; totalPages: number }> => {
    const res = await apiClient.get<ApiResponse<LabReportListItemDto[]>>('/lab-reports', { params });
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
      totalPages: meta.totalPages || 1,
    };
  },

  getPatientReportById: async (reportId: string): Promise<LabReportDetailDto> => {
    const res = await apiClient.get<ApiResponse<LabReportDetailDto>>(`/lab-reports/${reportId}`);
    return res.data.data!;
  },

  // 14. Doctor-facing API
  getDoctorReports: async (
    params?: ReportFilterParams
  ): Promise<{ items: LabReportListItemDto[]; total: number; page: number; limit: number; totalPages: number }> => {
    const res = await apiClient.get<ApiResponse<LabReportListItemDto[]>>('/lab-reports', { params });
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
      totalPages: meta.totalPages || 1,
    };
  },

  getDoctorReportById: async (reportId: string): Promise<LabReportDetailDto> => {
    const res = await apiClient.get<ApiResponse<LabReportDetailDto>>(`/lab-reports/${reportId}`);
    return res.data.data!;
  },
};

export default laboratoryReportsApi;
