/**
 * HealthBridge India — ABDM Integration Admin API Client (Day 7 & Phase 17)
 * Never receives or exposes credentials, client secrets, or gateway tokens.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  AbdmConsentAdminAnalyticsDto,
  AbdmHipHiuAdminAnalyticsDto,
  AbdmIntegrationStatusDashboardDto,
  AbdmWebhookAdminAnalyticsDto,
  AbhaIntegrationAnalyticsDto,
  FhirValidationIssueDto,
} from '@healthbridge/shared-types';

export interface AbdmAdminStatusWithAbhaDto extends AbdmIntegrationStatusDashboardDto {
  abhaAnalytics?: AbhaIntegrationAnalyticsDto;
  consentAnalytics?: AbdmConsentAdminAnalyticsDto;
  hipHiuAnalytics?: AbdmHipHiuAdminAnalyticsDto;
  webhookAnalytics?: AbdmWebhookAdminAnalyticsDto;
}

export interface AbdmFhirValidationResultDto {
  valid: boolean;
  resourceType: string;
  errors: FhirValidationIssueDto[];
  warnings: FhirValidationIssueDto[];
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

  async getHipHiuAnalytics(): Promise<AbdmHipHiuAdminAnalyticsDto> {
    const res = await apiClient.get<ApiResponse<AbdmHipHiuAdminAnalyticsDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.HIE.ANALYTICS
    );
    return res.data.data!;
  },

  async validateFhirResource(
    resource: Record<string, unknown>,
    strictAbdmProfile = true
  ): Promise<AbdmFhirValidationResultDto> {
    const res = await apiClient.post<ApiResponse<AbdmFhirValidationResultDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.FHIR_VALIDATE,
      { resource, strictAbdmProfile }
    );
    return res.data.data!;
  },
};
