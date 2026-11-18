import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface PrivacyNoticeDto {
  version: string;
  effectiveDate: string;
  reviewStatus: string;
  organization: {
    name: string;
    grievanceContactConfigured: boolean;
    grievanceChannelLabel: string;
  };
  sections: Array<{
    id: string;
    title: string;
    summary: string;
    points: string[];
  }>;
}

export interface PatientPrivacyOverviewDto {
  consentSummary: {
    activeGrants: number;
    pendingRequests: number;
    expiredConsents: number;
    revokedConsents: number;
  };
  accessTransparency: {
    totalLoggedAccessEvents: number;
  };
  rightsRequests: {
    total: number;
    openCount: number;
  };
  privacyNotice: {
    currentVersion: string;
    effectiveDate: string;
    acknowledged: boolean;
    acknowledgedVersion: string | null;
  };
  dataSharingStatus: {
    abdmEnabled: boolean;
    abdmMode: string;
    explicitConsentRequiredForSharing: boolean;
  };
}

export interface AccessHistoryItemDto {
  accessEventId: string;
  actorRole: string;
  actorDisplay: string;
  organization: string;
  resourceCategory: string;
  accessPurpose: string;
  lawfulBasis: string;
  authorizationDecision: 'ALLOWED' | 'DENIED';
  consentReference: string | null;
  timestamp: string;
}

export interface PrivacyRequestDto {
  id: string;
  referenceNumber: string;
  patientId: string;
  requestType: string;
  status: string;
  reason?: string;
  exportCategories?: string[];
  exportArtifact?: {
    generatedAt: string;
    expiresAt: string;
    sha256Checksum: string;
    recordCount: number;
    expired: boolean;
  };
  correctionDetails?: {
    targetResource: string;
    fieldOrCategory: string;
    originalValueSnapshot?: string;
    requestedCorrection: string;
    patientExplanation: string;
    isFinalizedClinicalRecord: boolean;
    appliedAmendmentReference?: string;
  };
  deletionDetails?: {
    requestedAction: string;
    retentionBlockedCategories: string[];
    eligibleCategories: string[];
    legalHoldBlocked: boolean;
    externalIntegrationCaveat: string;
    backupCaveat: string;
    actualDisposalOutcome?: string;
  };
  decisionSummary?: string;
  completionEvidence?: string;
  createdAt: string;
  updatedAt: string;
}

export const privacyApi = {
  async getPublicNotice(): Promise<PrivacyNoticeDto> {
    const res = await apiClient.get<{ data: PrivacyNoticeDto }>(API_ENDPOINTS.PRIVACY.PUBLIC_NOTICE);
    return res.data.data;
  },

  async getGovernanceMetadata(): Promise<{
    classifications: Array<Record<string, unknown>>;
    retentionPolicies: Array<Record<string, unknown>>;
    externalSharingPosture: Record<string, unknown>;
  }> {
    const res = await apiClient.get(API_ENDPOINTS.PRIVACY.GOVERNANCE);
    return res.data.data;
  },

  async getPatientOverview(): Promise<PatientPrivacyOverviewDto> {
    const res = await apiClient.get<{ data: PatientPrivacyOverviewDto }>(
      API_ENDPOINTS.PRIVACY.PATIENT_OVERVIEW
    );
    return res.data.data;
  },

  async getAccessHistory(page = 1, limit = 20): Promise<{
    items: AccessHistoryItemDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get(API_ENDPOINTS.PRIVACY.PATIENT_ACCESS_HISTORY, {
      params: { page, limit },
    });
    return res.data.data;
  },

  async acknowledgeNotice(noticeVersion: string) {
    const res = await apiClient.post(API_ENDPOINTS.PRIVACY.PATIENT_NOTICE_ACK, { noticeVersion });
    return res.data.data;
  },

  async listExportRequests(): Promise<{ items: PrivacyRequestDto[] }> {
    const res = await apiClient.get(API_ENDPOINTS.PRIVACY.EXPORT_REQUESTS);
    return res.data.data;
  },

  async createExportRequest(categories: string[], reason?: string): Promise<PrivacyRequestDto> {
    const res = await apiClient.post(API_ENDPOINTS.PRIVACY.EXPORT_REQUESTS, {
      categories,
      format: 'JSON',
      reason,
    });
    return res.data.data;
  },

  async listCorrectionRequests(): Promise<{ items: PrivacyRequestDto[] }> {
    const res = await apiClient.get(API_ENDPOINTS.PRIVACY.CORRECTION_REQUESTS);
    return res.data.data;
  },

  async createCorrectionRequest(payload: {
    targetResource: string;
    fieldOrCategory: string;
    originalValueSnapshot?: string;
    requestedCorrection: string;
    patientExplanation: string;
  }): Promise<PrivacyRequestDto> {
    const res = await apiClient.post(API_ENDPOINTS.PRIVACY.CORRECTION_REQUESTS, payload);
    return res.data.data;
  },

  async listDeletionRequests(): Promise<{ items: PrivacyRequestDto[] }> {
    const res = await apiClient.get(API_ENDPOINTS.PRIVACY.DELETION_REQUESTS);
    return res.data.data;
  },

  async createDeletionRequest(payload: {
    requestedAction: 'ACCOUNT_DEACTIVATION' | 'ACCOUNT_CLOSURE' | 'DATA_DELETION' | 'DATA_ANONYMIZATION';
    reason: string;
    acknowledgeRetentionRules: boolean;
  }): Promise<PrivacyRequestDto> {
    const res = await apiClient.post(API_ENDPOINTS.PRIVACY.DELETION_REQUESTS, payload);
    return res.data.data;
  },

  async listAdminRequests(params?: {
    page?: number;
    limit?: number;
    requestType?: string;
    status?: string;
  }): Promise<{
    items: PrivacyRequestDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get(API_ENDPOINTS.PRIVACY.ADMIN_REQUESTS, { params });
    return res.data.data;
  },

  async reviewAdminRequest(
    id: string,
    payload: {
      status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
      decisionSummary: string;
      completionEvidence?: string;
      actualDisposalOutcome?: string;
    }
  ): Promise<PrivacyRequestDto> {
    const res = await apiClient.patch(API_ENDPOINTS.PRIVACY.ADMIN_REVIEW(id), payload);
    return res.data.data;
  },
};
