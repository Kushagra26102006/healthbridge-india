/**
 * HealthBridge India — ABDM Consent Manager Integration Shared Types (Day 7 Task 03)
 *
 * Strictly distinguishes:
 *   1. Internal HealthBridge Platform Consent (`origin: 'INTERNAL_HEALTHBRIDGE'`)
 *   2. ABDM Consent Request (`AbdmConsentRequestDto`)
 *   3. ABDM Signed Consent Artefact (`AbdmConsentArtefactRecordDto`)
 *   4. Health Information Access Authorization Decision (`AbdmConsentValidationResultDto`)
 *
 * NOTE: Internal statuses are NEVER assumed identical to external ABDM HIE-CM statuses.
 */

import type {
  AbdmEnvironment,
  AbdmHealthInfoType,
  AbdmIntegrationStatus,
  AbdmPurposeCode,
  ConsentOriginType,
} from './abdm.types';

// ============================================================================
// 1. LIFECYCLE & STATUS ENUMS (INTERNAL VS EXTERNAL STRICTLY SEPARATED)
// ============================================================================

export type AbdmConsentRequestInternalStatus =
  | 'DRAFT'
  | 'PENDING_SUBMISSION'
  | 'SUBMITTED'
  | 'AWAITING_PATIENT_ACTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Official ABDM V3 HIE-CM Consent Manager status vocabulary.
 */
export type AbdmExternalConsentStatus =
  | 'REQUESTED'
  | 'GRANTED'
  | 'DENIED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'UNKNOWN';

export type AbdmConsentAccessMode = 'VIEW' | 'STORE' | 'QUERY' | 'STREAM';

export type AbdmConsentFrequencyUnit = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type AbdmConsentArtefactValidationStatus =
  | 'PENDING_VALIDATION'
  | 'VALID'
  | 'INVALID_SCHEMA'
  | 'SIGNATURE_UNVERIFIED'
  | 'PATIENT_MISMATCH'
  | 'EXPIRED'
  | 'REVOKED';

export type AbdmConsentRevocationStatus =
  | 'NOT_REVOKED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED_REVOKED'
  | 'FAILED';

export type AbdmConsentAccessDecision =
  | 'ALLOWED'
  | 'DENIED'
  | 'REQUIRES_REVALIDATION'
  | 'PENDING_EXTERNAL_CONFIRMATION';

export type AbdmConsentDenialReasonCode =
  | 'AUTHORIZED'
  | 'PATIENT_SELF_ACCESS_ALLOWED'
  | 'CONSENT_NOT_FOUND'
  | 'PATIENT_OWNERSHIP_MISMATCH'
  | 'INTERNAL_CONSENT_NOT_ABDM_ARTEFACT'
  | 'EXTERNAL_CONFIRMATION_REQUIRED'
  | 'SIGNATURE_UNVERIFIED'
  | 'ARTEFACT_SCHEMA_INVALID'
  | 'CONSENT_EXPIRED'
  | 'DATA_ERASE_DEADLINE_PASSED'
  | 'CONSENT_REVOKED'
  | 'REVOCATION_PENDING_CONFIRMATION'
  | 'CONSENT_NOT_GRANTED'
  | 'PARTICIPANT_UNAUTHORIZED'
  | 'PURPOSE_MISMATCH'
  | 'HI_TYPE_OUT_OF_SCOPE'
  | 'DATE_RANGE_OUT_OF_SCOPE'
  | 'POLICY_DENIED'
  | 'STALE_SYNC_REQUIRES_REVALIDATION';

export type AbdmConsentCallbackEventType =
  | 'consent/request/on-init'
  | 'consent/request/on-status'
  | 'consent/hiu/notify'
  | 'consent/hip/notify'
  | 'consent/on-fetch'
  | 'consent/revocation/notify';

// ============================================================================
// 2. CONSENT REQUEST & ARTEFACT DTOS
// ============================================================================

export interface AbdmConsentFrequencyDto {
  unit: AbdmConsentFrequencyUnit;
  value: number;
  repeats: number;
}

export interface AbdmConsentDateRangeDto {
  from: string;
  to: string;
}

export interface AbdmConsentRequestDto {
  id: string;
  internalReference: string;
  externalRequestId?: string | null;
  patientId: string;
  patientAbhaAddress: string;
  requestingParticipantId: string;
  requestingParticipantRole: 'HIU' | 'HIP';
  requestingOrganizationName: string;
  requesterName: string;
  purposeCode: AbdmPurposeCode;
  purposeText: string;
  hiTypes: AbdmHealthInfoType[];
  accessMode: AbdmConsentAccessMode;
  dateRange: AbdmConsentDateRangeDto;
  dataEraseAt: string;
  frequency: AbdmConsentFrequencyDto;
  internalStatus: AbdmConsentRequestInternalStatus;
  externalStatus: AbdmExternalConsentStatus;
  externalTransactionRef?: string | null;
  correlationId: string;
  artefactIds: string[];
  environment: AbdmEnvironment;
  isMocked: boolean;
  officialApprovalGuidance: {
    requiresExternalAbdmApproval: boolean;
    supportedWorkflow: string;
    phrPortalHint: string;
    consequencesSummary: string;
  };
  expiresAt?: string | null;
  lastSyncedAt?: string | null;
  lastErrorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AbdmConsentArtefactRecordDto {
  id: string;
  internalReference: string;
  externalConsentId: string;
  consentRequestId?: string | null;
  externalRequestId?: string | null;
  origin: ConsentOriginType;
  patientId: string;
  patientAbhaAddress: string;
  hipId?: string | null;
  hiuId: string;
  hiuName?: string | null;
  purposeCode: AbdmPurposeCode;
  purposeText: string;
  hiTypes: AbdmHealthInfoType[];
  accessMode: AbdmConsentAccessMode;
  dateRange: AbdmConsentDateRangeDto;
  dataEraseAt: string;
  frequency?: AbdmConsentFrequencyDto;
  externalStatus: AbdmExternalConsentStatus;
  validationStatus: AbdmConsentArtefactValidationStatus;
  revocationStatus: AbdmConsentRevocationStatus;
  signatureVerified: boolean;
  externalConfirmationReceived: boolean;
  payloadSha256: string;
  source: 'ABDM_HIE_CM_CALLBACK' | 'ABDM_HIE_CM_FETCH' | 'MOCK_HIE_CM_DEVELOPMENT';
  environment: AbdmEnvironment;
  isMocked: boolean;
  grantedAt?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  revocationRequestedAt?: string | null;
  revocationReason?: string | null;
  lastSyncedAt?: string | null;
  validationIssues: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AbdmConsentEventDto {
  id: string;
  eventId: string;
  consentRequestId?: string | null;
  externalRequestId?: string | null;
  externalConsentId?: string | null;
  patientId?: string | null;
  eventType: string;
  direction: 'OUTBOUND' | 'INBOUND_CALLBACK' | 'INTERNAL_SYNC' | 'PATIENT_ACTION';
  previousInternalStatus?: string | null;
  nextInternalStatus?: string | null;
  externalStatus?: AbdmExternalConsentStatus | null;
  processingOutcome: 'PROCESSED' | 'DUPLICATE_IGNORED' | 'STALE_IGNORED' | 'REJECTED' | 'FAILED';
  correlationId?: string | null;
  reason?: string | null;
  eventTimestamp: string;
  createdAt: string;
}

// ============================================================================
// 3. CENTRALIZED AUTHORIZATION & VALIDATION CONTRACTS
// ============================================================================

export interface AbdmConsentAccessValidationInput {
  patientId: string;
  actorId?: string;
  actorRole?: string;
  participantId?: string;
  externalConsentId?: string;
  artefactId?: string;
  requestedHiType: AbdmHealthInfoType;
  requestedPurposeCode: AbdmPurposeCode;
  recordDateIso?: string;
  requireExternalConfirmation?: boolean;
  allowPatientSelfAccess?: boolean;
  maxSyncStalenessMs?: number;
  now?: Date;
}

export interface AbdmConsentValidationResultDto {
  decision: AbdmConsentAccessDecision;
  allowed: boolean;
  reasonCode: AbdmConsentDenialReasonCode;
  reason: string;
  origin: ConsentOriginType;
  artefactId?: string;
  externalConsentId?: string;
  cacheHit: boolean;
  evaluatedAt: string;
}

// ============================================================================
// 4. REVOCATION, SYNC & ADMIN ANALYTICS DTOS
// ============================================================================

export interface AbdmConsentRevocationResponseDto {
  artefactId: string;
  externalConsentId: string;
  revocationStatus: AbdmConsentRevocationStatus;
  externalStatus: AbdmExternalConsentStatus;
  externalConfirmed: boolean;
  cacheInvalidated: boolean;
  correlationId: string;
  isMocked: boolean;
  message: string;
  guidance: string;
  updatedAt: string;
}

export interface AbdmConsentSyncSummaryDto {
  syncLogId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  startedAt: string;
  completedAt: string;
  expiredRequestsMarked: number;
  expiredArtefactsMarked: number;
  nearingExpiryNotified: number;
  externalStatusChecked: number;
  externalStatusUpdated: number;
  failuresCount: number;
  status: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED';
}

export interface AbdmConsentAdminAnalyticsDto {
  environment: AbdmEnvironment;
  consentReadiness: AbdmIntegrationStatus;
  liveExchangeEnabled: boolean;
  metrics: {
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    expiredRequests: number;
    activeArtefacts: number;
    expiredArtefacts: number;
    revokedArtefacts: number;
    pendingRevocationConfirmations: number;
    syncFailures: number;
    callbackProcessingFailures: number;
  };
  environmentBreakdown: {
    mockedDevelopment: { requests: number; artefacts: number };
    sandbox: { requests: number; artefacts: number };
    production: { requests: number; artefacts: number };
  };
  lastSuccessfulSyncAt: string | null;
  lastFailedSyncAt: string | null;
  lastSyncError: string | null;
  evaluatedAt: string;
}
