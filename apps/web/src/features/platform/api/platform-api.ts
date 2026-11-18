/**
 * HealthBridge India — Unified Platform Integration API Client (Day 8 Task 01)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  AdminPlatformOverviewDto,
  DoctorUnifiedPatientOverviewDto,
  UnifiedPatientTimelineQueryDto,
  PatientTimelineResponseDto,
  UnifiedPatientIdentitySummaryDto,
} from '@healthbridge/shared-types';

export const platformApi = {
  async getPatientTimeline(
    query: UnifiedPatientTimelineQueryDto = {}
  ): Promise<PatientTimelineResponseDto> {
    const res = await apiClient.get<ApiResponse<PatientTimelineResponseDto>>(
      API_ENDPOINTS.PLATFORM.PATIENT_TIMELINE,
      { params: query }
    );
    return res.data.data!;
  },

  async getPatientUnifiedIdentity(): Promise<UnifiedPatientIdentitySummaryDto> {
    const res = await apiClient.get<ApiResponse<UnifiedPatientIdentitySummaryDto>>(
      API_ENDPOINTS.PLATFORM.PATIENT_IDENTITY
    );
    return res.data.data!;
  },

  async getDoctorPatientOverview(
    patientId: string,
    filters?: { fromDate?: string; toDate?: string }
  ): Promise<DoctorUnifiedPatientOverviewDto> {
    const res = await apiClient.get<ApiResponse<DoctorUnifiedPatientOverviewDto>>(
      API_ENDPOINTS.PLATFORM.DOCTOR_PATIENT_OVERVIEW(patientId),
      { params: filters }
    );
    return res.data.data!;
  },

  async getAdminPlatformOverview(): Promise<AdminPlatformOverviewDto> {
    const res = await apiClient.get<ApiResponse<AdminPlatformOverviewDto>>(
      API_ENDPOINTS.PLATFORM.ADMIN_OVERVIEW
    );
    return res.data.data!;
  },
};
