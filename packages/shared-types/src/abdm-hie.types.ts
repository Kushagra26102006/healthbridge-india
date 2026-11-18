/**
 * HealthBridge India — ABDM HIP / HIU Health Information Exchange Types (Day 7 Task 04)
 *
 * Strictly separates:
 *   1. ABHA identity linking (Day 7 Task 02)
 *   2. Health-record care-context linking (Day 7 Task 04)
 *   3. Consent Manager authorization (Day 7 Task 03)
 *   4. Health information discovery, FHIR packaging, encryption, transfer, and import (Day 7 Task 04)
 *
 * Never claims live ABDM sandbox connectivity or official NRCeS FHIR IG conformance.
 */

import type {
  AbdmEnvironment,
  AbdmHealthInfoType,
  AbdmIntegrationStatus,
  AbdmPurposeCode,
  FhirValidationIssueDto,
} from './abdm.types';

export type AbdmHieParticipantRole = 'HIP' | 'HIU';

export type AbdmHieTransferState =
  | 'DRAFT'
  | 'DISCOVERY_PENDING'
  | 'DISCOVERY_COMPLETED'
  | 'LINKING_PENDING'
  | 'CONSENT_PENDING'
  | 'AUTHORIZED'
  | 'REQUEST_SUBMITTED'
  | 'TRANSFER_PENDING'
  | 'TRANSFER_RECEIVED'
  | 'VALIDATION_PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REQUIRES_REVIEW';

export type AbdmExternalSessionStatus =
  | 'REQUESTED'
  | 'ACKNOWLEDGED'
  | 'TRANSFERRED'
  | 'PARTIAL_TRANSFERRED'
  | 'RECEIVED'
  | 'FAILED'
  | 'EXPIRED'
  | 'UNKNOWN';

export type AbdmExternalHiStatus = 'OK' | 'DELIVERED' | 'ERRORED';

export type AbdmDiscoveryStatus =
  | 'DISCOVERY_PENDING'
  | 'DISCOVERY_COMPLETED'
  | 'NO_MATCH_FOUND'
  | 'FAILED'
  | 'EXPIRED';

export type AbdmRecordLinkStatus =
  | 'LINKING_PENDING'
  | 'OTP_VERIFICATION_PENDING'
  | 'LINKED'
  | 'UNLINKED_LOCALLY'
  | 'FAILED'
  | 'EXPIRED';

export type AbdmEncryptionProviderMode =
  | 'NOT_CONFIGURED'
  | 'MOCK_LOCAL_X25519_NOT_BOUNCYCASTLE_WEIERSTRASS'
  | 'FIDELIUS_SHORT_WEIERSTRASS_CONFIGURED';

export type AbdmImportedRecordReviewStatus =
  | 'IMPORTED_VERIFIED'
  | 'QUARANTINED_REVIEW'
  | 'APPROVED_AFTER_REVIEW'
  | 'REJECTED';

export type AbdmImportedRecordValidationStatus =
  | 'VALID'
  | 'VALID_WITH_WARNINGS'
  | 'INVALID';

export interface AbdmFideliusKeyMaterialDto {
  cryptoAlg: 'ECDH';
  curve: 'Curve25519';
  dhPublicKey: {
    expiry: string;
    parameters: string;
    keyValue: string;
  };
  nonce: string;
}

export interface AbdmDiscoveredCareContextDto {
  careContextReference: string;
  display: string;
  hiTypes: AbdmHealthInfoType[];
  recordDate?: string;
  sourceCategory?: string;
  alreadyLinked?: boolean;
}

export interface AbdmDiscoveryRequestDto {
  id: string;
  internalDiscoveryRef: string;
  externalTransactionRef?: string;
  patientId: string;
  initiatingActorId: string;
  initiatingActorRole: string;
  participantId: string;
  participantName?: string;
  participantRole: AbdmHieParticipantRole;
  requestedCategories: AbdmHealthInfoType[];
  status: AbdmDiscoveryStatus;
  discoveredCareContexts: AbdmDiscoveredCareContextDto[];
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  failureReason?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbdmLinkedHealthRecordDto {
  id: string;
  internalLinkRef: string;
  externalLinkRef?: string;
  externalTransactionRef?: string;
  patientId: string;
  participantId: string;
  participantName?: string;
  careContextReference: string;
  careContextDisplay: string;
  hiTypes: AbdmHealthInfoType[];
  linkMode: 'USER_INITIATED' | 'HIP_INITIATED';
  status: AbdmRecordLinkStatus;
  unlinkScope?: 'LOCAL_HEALTHBRIDGE_UNLINK_ONLY' | 'EXTERNAL_CONFIRMED';
  unlinkedAt?: string;
  unlinkReason?: string;
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  linkedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbdmHealthInformationRequestDto {
  id: string;
  internalRequestRef: string;
  externalTransactionId?: string;
  role: AbdmHieParticipantRole;
  patientId: string;
  requesterId: string;
  requesterRole: string;
  participantId: string;
  consentArtefactId: string;
  externalConsentId: string;
  purposeCode: AbdmPurposeCode;
  hiTypes: AbdmHealthInfoType[];
  dateRange: {
    from: string;
    to: string;
  };
  dataPushUrl?: string;
  status: AbdmHieTransferState;
  externalSessionStatus?: AbdmExternalSessionStatus;
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  failureCode?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbdmTransferStateTransitionDto {
  fromState?: AbdmHieTransferState;
  toState: AbdmHieTransferState;
  externalStatus?: AbdmExternalSessionStatus;
  source: 'LOCAL_WORKFLOW' | 'ABDM_CALLBACK' | 'HIP_DATA_PUSH' | 'ACKNOWLEDGEMENT' | 'REVIEWER';
  reason?: string;
  correlationId?: string;
  occurredAt: string;
}

export interface AbdmHealthInformationTransferDto {
  id: string;
  internalTransferRef: string;
  externalTransactionId?: string;
  healthInformationRequestId: string;
  role: AbdmHieParticipantRole;
  direction: 'OUTBOUND_HIP_PUSH' | 'INBOUND_HIU_RECEIVE';
  patientId: string;
  participantId: string;
  consentArtefactId: string;
  externalConsentId: string;
  hiTypes: AbdmHealthInfoType[];
  status: AbdmHieTransferState;
  externalSessionStatus?: AbdmExternalSessionStatus;
  encryptionApplied: boolean;
  encryptionProviderMode: AbdmEncryptionProviderMode;
  totalEntries: number;
  validatedEntries: number;
  importedEntries: number;
  quarantinedEntries: number;
  retryCount: number;
  stateHistory: AbdmTransferStateTransitionDto[];
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  failureCode?: string;
  failureReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbdmTransferPackageMetadataDto {
  id: string;
  internalPackageRef: string;
  transferId: string;
  externalTransactionId?: string;
  patientId: string;
  consentArtefactId: string;
  hiType: AbdmHealthInfoType;
  careContextReference: string;
  bundleSha256: string;
  encryptedPayloadSha256?: string;
  encryptionApplied: boolean;
  encryptionProviderMode: AbdmEncryptionProviderMode;
  fhirValidationStatus: AbdmImportedRecordValidationStatus;
  validationErrorCount: number;
  validationWarningCount: number;
  unmappedFieldsCount: number;
  pageNumber: number;
  pageCount: number;
  createdAt: string;
}

export interface AbdmTransferAcknowledgementDto {
  id: string;
  acknowledgementRef: string;
  transferId: string;
  externalTransactionId: string;
  role: AbdmHieParticipantRole;
  ackType:
    | 'REQUEST_RECEIVED'
    | 'TRANSFER_INITIATED'
    | 'TRANSFER_ACCEPTED'
    | 'TRANSFER_COMPLETED'
    | 'TRANSFER_REJECTED'
    | 'TRANSFER_FAILED';
  externalSessionStatus: AbdmExternalSessionStatus;
  careContextStatuses: Array<{
    careContextReference: string;
    hiStatus: AbdmExternalHiStatus;
    description?: string;
  }>;
  failureCategory?: string;
  correlationId: string;
  duplicate?: boolean;
  acknowledgedAt: string;
  createdAt: string;
}

export interface AbdmImportedRecordSummaryDto {
  title: string;
  documentType: string;
  hiType: AbdmHealthInfoType;
  recordDate?: string;
  isAmended: boolean;
  observationsCount: number;
  medicationsCount: number;
  clinicalHighlights: Array<{
    label: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    flag?: string;
  }>;
}

export interface AbdmImportedRecordDto {
  id: string;
  internalImportRef: string;
  patientId: string;
  transferId: string;
  externalTransactionId: string;
  consentArtefactId: string;
  externalConsentId: string;
  sourceParticipantId: string;
  sourceOrganizationName: string;
  careContextReference: string;
  hiType: AbdmHealthInfoType;
  bundleSha256: string;
  originalIssuedAt?: string;
  importedAt: string;
  validationStatus: AbdmImportedRecordValidationStatus;
  reviewStatus: AbdmImportedRecordReviewStatus;
  quarantineReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  isAmended: boolean;
  readOnly: true;
  provenance: {
    sourceSystem: 'ABDM_HIU_IMPORT';
    sourceParticipantId: string;
    sourceOrganizationName: string;
    consentArtefactId: string;
    externalConsentId: string;
    externalTransactionId: string;
    importedAt: string;
    originalIssuedAt?: string;
    bundleSha256: string;
    patientMatchConfidence: 'EXACT_ABHA_MATCH' | 'DEMOGRAPHIC_REVIEW_REQUIRED';
  };
  summary: AbdmImportedRecordSummaryDto;
  unmappedFields: string[];
  validationErrors: FhirValidationIssueDto[];
  validationWarnings: FhirValidationIssueDto[];
  environment: AbdmEnvironment;
  isMocked: boolean;
}

export interface AbdmFhirBundleGenerationResultDto {
  bundleId: string;
  hiType: AbdmHealthInfoType;
  profileUrl: string;
  mappingVersion: string;
  bundleSha256: string;
  valid: boolean;
  errors: FhirValidationIssueDto[];
  warnings: FhirValidationIssueDto[];
  unmappedFields: string[];
  resourceCounts: Record<string, number>;
  officialIgConformanceClaimed: false;
  bundle: Record<string, unknown>;
  generatedAt: string;
}

export interface AbdmEncryptionReadinessDto {
  providerMode: AbdmEncryptionProviderMode;
  liveFideliusConfigured: boolean;
  algorithmSpec: 'ECDH_CURVE25519_SHORT_WEIERSTRASS_HKDF_SHA256_AES256_GCM';
  activeEphemeralKeysCount: number;
  note: string;
}

export interface AbdmHipHiuAdminAnalyticsDto {
  hipReadiness: AbdmIntegrationStatus;
  hiuReadiness: AbdmIntegrationStatus;
  liveExchangeEnabled: false;
  encryption: AbdmEncryptionReadinessDto;
  discovery: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
  };
  recordLinking: {
    total: number;
    linked: number;
    pending: number;
    unlinkedLocally: number;
    failed: number;
  };
  transfers: {
    total: number;
    hipOutbound: number;
    hiuInbound: number;
    pending: number;
    completed: number;
    requiresReview: number;
    failed: number;
  };
  acknowledgements: {
    total: number;
    failed: number;
  };
  fhirValidation: {
    totalMappings: number;
    passed: number;
    passedWithWarnings: number;
    failed: number;
  };
  importedRecords: {
    total: number;
    verified: number;
    quarantined: number;
    rejected: number;
  };
  environmentBreakdown: Record<AbdmEnvironment, number>;
  generatedAt: string;
}
