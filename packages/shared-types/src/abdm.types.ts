/**
 * HealthBridge India — ABDM Integration & FHIR R4 Foundation Shared Types (Day 7 Task 01)
 *
 * Architectural contract for Ayushman Bharat Digital Mission (ABDM) readiness,
 * FHIR R4 mapping/validation, consent adaptation, webhook correlation, and admin status telemetry.
 *
 * NOTE: This file defines integration foundation contracts only. It does not imply
 * live ABDM registration, sandbox certification, or production connectivity.
 */

// ============================================================================
// 1. ENVIRONMENT & INTEGRATION STATUS TYPES
// ============================================================================

export type AbdmEnvironment = 'disabled' | 'development' | 'sandbox' | 'production';

export type AbdmIntegrationStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'PENDING_ONBOARDING'
  | 'MOCKED'
  | 'CONNECTIVITY_VERIFIED'
  | 'SANDBOX_TESTED'
  | 'PRODUCTION_NOT_ENABLED';

export type AbdmParticipantRole =
  | 'HIP'
  | 'HIU'
  | 'HFR_PARTICIPANT'
  | 'HPR_PARTICIPANT'
  | 'ABHA_CLIENT';

export interface AbdmConfigSummaryDto {
  enabled: boolean;
  environment: AbdmEnvironment;
  baseUrlConfigured: boolean;
  abhaBaseUrlConfigured: boolean;
  xCmIdConfigured: boolean;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  callbackUrlConfigured: boolean;
  webhookSecretConfigured: boolean;
  requestTimeoutMs: number;
  productionLocked: boolean;
  configurationErrors: string[];
  configurationWarnings: string[];
}

export interface AbdmOnboardingChecklistItemDto {
  id: string;
  title: string;
  category: 'SANDBOX' | 'CREDENTIALS' | 'CALLBACKS' | 'FHIR' | 'SECURITY' | 'APPROVAL';
  status:
    | 'VERIFIED_FROM_DOCS'
    | 'PENDING_USER_ACTION'
    | 'DEPENDENT_ON_ACCOUNT_ACCESS'
    | 'DEPENDENT_ON_OFFICIAL_APPROVAL'
    | 'NOT_YET_VERIFIED';
  notes: string;
}

export interface AbdmIntegrationStatusDashboardDto {
  enabled: boolean;
  environment: AbdmEnvironment;
  overallStatus: AbdmIntegrationStatus;
  configurationCompletenessPercent: number;
  sandboxConnectivityStatus: AbdmIntegrationStatus;
  lastSuccessfulConnectivityCheckAt?: string | null;
  lastFailedConnectivityCheckAt?: string | null;
  lastConnectivityError?: string | null;
  credentialStatus: AbdmIntegrationStatus;
  callbackStatus: AbdmIntegrationStatus;
  fhirMappingReadiness: AbdmIntegrationStatus;
  consentAdapterReadiness: AbdmIntegrationStatus;
  hipReadiness: AbdmIntegrationStatus;
  hiuReadiness: AbdmIntegrationStatus;
  configSummary: AbdmConfigSummaryDto;
  pendingOnboardingTasks: AbdmOnboardingChecklistItemDto[];
  evaluatedAt: string;
}

// ============================================================================
// 2. FHIR R4 & ABDM PROFILE MAPPING / VALIDATION CONTRACTS
// ============================================================================

export type AbdmFhirResourceType =
  | 'Patient'
  | 'Practitioner'
  | 'Organization'
  | 'Encounter'
  | 'Appointment'
  | 'Observation'
  | 'DiagnosticReport'
  | 'ServiceRequest'
  | 'Specimen'
  | 'MedicationRequest'
  | 'MedicationStatement'
  | 'Condition'
  | 'AllergyIntolerance'
  | 'DocumentReference'
  | 'Consent'
  | 'Provenance'
  | 'Composition'
  | 'Bundle';

export type FhirMappingStatus = 'MAPPED' | 'MAPPED_WITH_WARNINGS' | 'FAILED';

export interface FhirValidationIssueDto {
  severity: 'ERROR' | 'WARNING';
  code: string;
  path: string;
  message: string;
}

export interface FhirMappingResultDto<TResource = Record<string, unknown>> {
  sourceEntityType: string;
  sourceEntityId: string;
  targetResourceType: AbdmFhirResourceType;
  targetProfileUrl?: string;
  mappingStatus: FhirMappingStatus;
  validationErrors: FhirValidationIssueDto[];
  warnings: FhirValidationIssueDto[];
  unmappedFields: string[];
  mappingVersion: string;
  timestamp: string;
  resource?: TResource;
}

// ============================================================================
// 3. CONSENT ADAPTER CONTRACTS (INTERNAL VS ABDM ARTEFACT SEPARATION)
// ============================================================================

export type ConsentOriginType = 'INTERNAL_HEALTHBRIDGE' | 'ABDM_HIE_CM';

export type AbdmHealthInfoType =
  | 'DiagnosticReport'
  | 'Prescription'
  | 'OPConsultation'
  | 'DischargeSummary'
  | 'ImmunizationRecord'
  | 'HealthDocumentRecord'
  | 'WellnessRecord';

export type AbdmPurposeCode = 'CAREMGT' | 'BTG' | 'PUBHLTH' | 'HPAYMT' | 'DSRCH' | 'PATRQT';

export type AbdmConsentArtefactStatus = 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED' | 'REVOKED';

export interface AbdmConsentArtefactDto {
  artefactId: string;
  origin: ConsentOriginType;
  patientAbhaAddress?: string;
  internalPatientId?: string;
  hipId?: string;
  hiuId?: string;
  purposeCode: AbdmPurposeCode | string;
  hiTypes: AbdmHealthInfoType[];
  dateRange: {
    from: string;
    to: string;
  };
  dataEraseAt: string;
  status: AbdmConsentArtefactStatus;
  grantedAt?: string;
  revokedAt?: string;
  signatureVerified: boolean;
}

export interface AbdmConsentAccessCheckResultDto {
  authorized: boolean;
  origin: ConsentOriginType;
  artefactId?: string;
  denialCode?:
    | 'CONSENT_MISSING'
    | 'INTERNAL_CONSENT_NOT_ABDM_ARTEFACT'
    | 'CONSENT_EXPIRED'
    | 'CONSENT_REVOKED'
    | 'CONSENT_NOT_GRANTED'
    | 'PURPOSE_MISMATCH'
    | 'HI_TYPE_NOT_PERMITTED'
    | 'DATE_OUT_OF_RANGE'
    | 'SIGNATURE_UNVERIFIED';
  reason: string;
  checkedAt: string;
}

// ============================================================================
// 4. WEBHOOK / CALLBACK CONTRACTS
// ============================================================================

export type AbdmWebhookProcessingStatus =
  | 'RECEIVED'
  | 'DUPLICATE_IGNORED'
  | 'PROCESSED'
  | 'FAILED';

export interface AbdmWebhookCallbackPayloadDto {
  requestId: string;
  timestamp: string;
  eventType: string;
  resp?: {
    requestId: string;
  };
  error?: {
    code: number | string;
    message: string;
  };
  payload?: Record<string, unknown>;
}

export interface AbdmWebhookAckDto {
  acknowledged: boolean;
  correlationId: string;
  requestId: string;
  eventType: string;
  duplicate: boolean;
  status: AbdmWebhookProcessingStatus;
  receivedAt: string;
}

export interface AbdmWebhookRecentEventDto {
  requestId: string;
  correlationId: string;
  eventType: string;
  processingStatus: AbdmWebhookProcessingStatus;
  errorMessage?: string;
  receivedAt: string;
  processedAt?: string;
}

export interface AbdmWebhookAdminAnalyticsDto {
  totalReceived: number;
  processed: number;
  duplicatesIgnored: number;
  failed: number;
  lastReceivedAt?: string | null;
  recentEvents: AbdmWebhookRecentEventDto[];
  evaluatedAt: string;
}
