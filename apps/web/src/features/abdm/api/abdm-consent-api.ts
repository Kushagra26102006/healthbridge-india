/**
 * HealthBridge India — ABDM Consent Manager Frontend API Client (Day 7 Task 03)
 *
 * Strictly exposes verified read/refresh/revocation/analytics workflows.
 * Intentionally omits any local "approve ABDM consent" mutation because official
 * ABDM HIE-CM approvals must originate externally through the patient's ABDM PHR workflow.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  AbdmConsentAdminAnalyticsDto,
  AbdmConsentArtefactRecordDto,
  AbdmConsentEventDto,
  AbdmConsentRequestDto,
  AbdmConsentRevocationResponseDto,
  AbdmConsentSyncSummaryDto,
  FhirMappingResultDto,
} from '@healthbridge/shared-types';

export interface AbdmArtefactDetailResponse {
  artefact: AbdmConsentArtefactRecordDto;
  originalExternalPayload: Record<string, unknown>;
}

export interface AbdmConsentFhirProjectionResponse extends FhirMappingResultDto {
  originalExternalConsentId: string;
  originalPayloadSha256: string;
  officialIgConformanceClaimed: boolean;
}

export const abdmConsentApi = {
  async listOwnRequests(): Promise<AbdmConsentRequestDto[]> {
    const res = await apiClient.get<ApiResponse<AbdmConsentRequestDto[]>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.REQUESTS
    );
    return res.data.data || [];
  },

  async getOwnRequestDetail(id: string): Promise<AbdmConsentRequestDto> {
    const res = await apiClient.get<ApiResponse<AbdmConsentRequestDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.REQUEST_BY_ID(id)
    );
    return res.data.data!;
  },

  async refreshOwnRequestStatus(id: string): Promise<AbdmConsentRequestDto> {
    const res = await apiClient.post<ApiResponse<AbdmConsentRequestDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.REQUEST_REFRESH(id)
    );
    return res.data.data!;
  },

  async listOwnArtefacts(): Promise<AbdmConsentArtefactRecordDto[]> {
    const res = await apiClient.get<ApiResponse<AbdmConsentArtefactRecordDto[]>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.ARTEFACTS
    );
    return res.data.data || [];
  },

  async getOwnArtefactDetail(id: string): Promise<AbdmArtefactDetailResponse> {
    const res = await apiClient.get<ApiResponse<AbdmArtefactDetailResponse>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.ARTEFACT_BY_ID(id)
    );
    return res.data.data!;
  },

  async getOwnArtefactFhirProjection(id: string): Promise<AbdmConsentFhirProjectionResponse> {
    const res = await apiClient.get<ApiResponse<AbdmConsentFhirProjectionResponse>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.ARTEFACT_FHIR(id)
    );
    return res.data.data!;
  },

  async revokeOwnArtefact(id: string, reason: string): Promise<AbdmConsentRevocationResponseDto> {
    const res = await apiClient.post<ApiResponse<AbdmConsentRevocationResponseDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.ARTEFACT_REVOKE(id),
      { reason }
    );
    return res.data.data!;
  },

  async getOwnHistory(): Promise<AbdmConsentEventDto[]> {
    const res = await apiClient.get<ApiResponse<AbdmConsentEventDto[]>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.HISTORY
    );
    return res.data.data || [];
  },

  async getAdminAnalytics(): Promise<AbdmConsentAdminAnalyticsDto> {
    const res = await apiClient.get<ApiResponse<AbdmConsentAdminAnalyticsDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.ANALYTICS
    );
    return res.data.data!;
  },

  async triggerAdminSync(options?: {
    nearingExpiryHours?: number;
    pollExternalStatus?: boolean;
  }): Promise<AbdmConsentSyncSummaryDto> {
    const res = await apiClient.post<ApiResponse<AbdmConsentSyncSummaryDto>>(
      API_ENDPOINTS.ABDM_INTEGRATION.CONSENT.SYNC,
      options || {}
    );
    return res.data.data!;
  },
};
