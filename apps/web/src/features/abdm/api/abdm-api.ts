/**
 * HealthBridge India — ABDM Integration Admin API Client (Day 7 Tasks 01–03)
 * Never receives or exposes credentials, client secrets, or gateway tokens.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  AbdmConsentAdminAnalyticsDto,
  AbdmIntegrationStatusDashboardDto,
  AbhaIntegrationAnalyticsDto,
} from '@healthbridge/shared-types';

export interface AbdmAdminStatusWithAbhaDto extends AbdmIntegrationStatusDashboardDto {
  abhaAnalytics?: AbhaIntegrationAnalyticsDto;
  consentAnalytics?: AbdmConsentAdminAnalyticsDto;
}

export const abdmApi = {
  async getIntegrationStatus(): Promise<AbdmAdminStatusWithAbhaDto> {
    const res = await apiClient.get<ApiResponse<AbdmAdminStatusWithAbhaDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.STATUS
    );
    return res.data.data!;
  },

  async getAbhaAnalytics(): Promise<AbhaIntegrationAnalyticsDto> {
    const res = await apiClient.get<ApiResponse<AbhaIntegrationAnalyticsDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.ABHA_ANALYTICS
    );
    return res.data.data!;
  },

  async getConsentAnalytics(): Promise<AbdmConsentAdminAnalyticsDto> {
    const res = await apiClient.get<ApiResponse<AbdmConsentAdminAnalyticsDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.ANALYTICS
    );
    return res.data.data!;
  },
};
