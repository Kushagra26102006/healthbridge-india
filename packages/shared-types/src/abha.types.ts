/**
 * Ayushman Bharat Health Account (ABHA) Types — Day 7 Task 02
 * Aligned with official National Health Authority (NHA) / ABDM ABHA V3 specifications.
 *
 * NOTE: Internal HealthBridge patient primary keys are strictly separate from ABHA identifiers.
 * ABHA identity linking does NOT constitute consent to access or exchange clinical health records.
 */

import type { AbdmEnvironment, AbdmIntegrationStatus } from './abdm.types';

export type AbhaAuthMethod = 'MOBILE_OTP' | 'AADHAAR_OTP' | 'PASSWORD' | 'DEMOGRAPHICS';

export interface AbhaVerificationRequest {
  abhaNumber?: string;
  abhaAddress?: string;
  authMethod: AbhaAuthMethod;
}

export interface AbhaOtpVerificationRequest {
  transactionId: string;
  otp: string;
}

export interface AbhaProfile {
  abhaNumber: string;
  abhaAddress: string;
  fullName: string;
  gender: 'M' | 'F' | 'O';
  dateOfBirth: string; // YYYY-MM-DD
  mobile: string;
  address: {
    line?: string;
    district: string;
    state: string;
    pincode: string;
  };
  kycPhotoUrl?: string;
  isKycVerified: boolean;
}

export type AbhaConsentStatus = 'REQUESTED' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';

export interface AbhaConsentArtifact {
  consentId: string;
  patientAbhaAddress: string;
  requesterId: string;
  requesterName: string;
  purpose: string;
  hiTypes: string[];
  status: AbhaConsentStatus;
  dateRange: {
    from: string;
    to: string;
  };
  expiryDate: string;
  createdAt: string;
}

// ============================================================================
// DAY 7 TASK 02 — ABHA V3 VERIFICATION, LINKING & GOVERNANCE TYPES
// ============================================================================

export type AbhaVerificationStatus =
  | 'NOT_LINKED'
  | 'PENDING_VERIFICATION'
  | 'VERIFICATION_IN_PROGRESS'
  | 'VERIFIED'
  | 'VERIFICATION_FAILED'
  | 'REVOKED_OR_UNLINKED';

export type AbhaLinkRecordStatus = 'PENDING' | 'ACTIVE' | 'UNLINKED' | 'REVOKED' | 'FAILED';

export type AbhaOtpSystem = 'abdm' | 'aadhaar';

export type AbhaWorkflowType =
  | 'ABHA_CREATION_AADHAAR_OTP'
  | 'ABHA_VERIFY_NUMBER_OTP'
  | 'ABHA_VERIFY_ADDRESS_OTP'
  | 'ABHA_ADDRESS_LOOKUP'
  | 'ABHA_ADDRESS_SUGGESTIONS'
  | 'ABHA_ADDRESS_CREATE'
  | 'ABHA_PROFILE_FETCH'
  | 'ABHA_LINK'
  | 'ABHA_UNLINK';

export type AbhaVerificationMethod =
  | 'AADHAAR_OTP'
  | 'ABHA_NUMBER_MOBILE_OTP'
  | 'ABHA_NUMBER_AADHAAR_OTP'
  | 'ABHA_ADDRESS_MOBILE_OTP'
  | 'ABHA_ADDRESS_AADHAAR_OTP'
  | 'DEMOGRAPHIC_REVIEW';

export type AbhaFailureCategory =
  | 'INVALID_INPUT'
  | 'INVALID_OTP'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'DUPLICATE_IDENTITY'
  | 'UNAUTHORIZED'
  | 'UNSUPPORTED_OPERATION'
  | 'EXTERNAL_API_ERROR';

export interface AbhaAddressHistoryEntryDto {
  address: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'UNLINKED';
  verifiedAt?: string;
  updatedAt: string;
}

export interface AbhaLinkStatusDto {
  patientId: string;
  linkId?: string;
  linkStatus: AbhaLinkRecordStatus | 'NOT_LINKED';
  verificationStatus: AbhaVerificationStatus;
  maskedAbhaNumber?: string;
  abhaAddress?: string;
  abhaAddressHistory: AbhaAddressHistoryEntryDto[];
  verificationMethod?: AbhaVerificationMethod;
  linkedAt?: string;
  verifiedAt?: string;
  lastVerificationAt?: string;
  unlinkedAt?: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  consentScope: 'IDENTITY_LINKING_ONLY';
  consentSeparationNotice: string;
  availableActions: {
    canCreateAbha: boolean;
    canVerifyAbhaNumber: boolean;
    canVerifyAbhaAddress: boolean;
    canLink: boolean;
    canUnlinkLocal: boolean;
    canRetrieveProfile: boolean;
  };
}

export interface AbhaOtpInitiationResultDto {
  internalTransactionId: string;
  externalTransactionId?: string;
  correlationId: string;
  workflowType: AbhaWorkflowType;
  verificationStatus: AbhaVerificationStatus;
  maskedDestinationMessage: string;
  expiresAt: string;
  isMocked: boolean;
  environment: AbdmEnvironment;
}

export interface AbhaVerificationOutcomeDto {
  internalTransactionId: string;
  externalTransactionId?: string;
  correlationId: string;
  verificationStatus: AbhaVerificationStatus;
  verificationMethod: AbhaVerificationMethod;
  maskedAbhaNumber?: string;
  abhaAddress?: string;
  abhaStatus?: string;
  profileSummary?: {
    fullName?: string;
    gender?: string;
    yearOfBirth?: string;
    stateName?: string;
    districtName?: string;
  };
  demographicReviewRequired: boolean;
  demographicMismatchReasons: string[];
  readyToLink: boolean;
  isMocked: boolean;
  verifiedAt: string;
}

export interface AbhaAddressAvailabilityDto {
  abhaAddress: string;
  exists: boolean;
  availableForCreation: boolean;
  correlationId: string;
  isMocked: boolean;
  checkedAt: string;
}

export interface AbhaAddressSuggestionsDto {
  internalTransactionId: string;
  suggestions: string[];
  correlationId: string;
  isMocked: boolean;
}

export interface AbhaAuthorizedProfileDto {
  maskedAbhaNumber: string;
  abhaAddress?: string;
  abhaAddresses: string[];
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  stateName?: string;
  districtName?: string;
  abhaStatus: string;
  kycVerified: boolean;
  correlationId: string;
  isMocked: boolean;
  retrievedAt: string;
}

export interface AbhaTransactionHistoryItemDto {
  id: string;
  internalTransactionId: string;
  externalTransactionId?: string;
  workflowType: AbhaWorkflowType;
  verificationMethod?: AbhaVerificationMethod;
  verificationStatus: AbhaVerificationStatus;
  correlationId: string;
  maskedIdentifier?: string;
  failureCategory?: AbhaFailureCategory;
  failureMessage?: string;
  isMocked: boolean;
  environment: AbdmEnvironment;
  createdAt: string;
  completedAt?: string;
}

export interface AbhaSupportedWorkflowSummaryDto {
  workflow: string;
  officialApi: string;
  version: string;
  authRequirement: string;
  verifiedFromDocs: boolean;
  implementationStatus:
    | 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER'
    | 'LOCAL_ONLY_WITH_AUDIT'
    | 'BLOCKED_UNSUPPORTED';
}

export interface AbhaIntegrationAnalyticsDto {
  authReadiness: AbdmIntegrationStatus;
  abhaApiConfigStatus: AbdmIntegrationStatus;
  sandboxAvailability: AbdmIntegrationStatus;
  environment: AbdmEnvironment;
  supportedWorkflows: AbhaSupportedWorkflowSummaryDto[];
  metrics: {
    totalTransactions: number;
    successfulVerifications: number;
    failedVerifications: number;
    pendingLinkingRequests: number;
    activeLinkedPatients: number;
    unlinkedLinks: number;
  };
  lastSuccessfulRequestAt: string | null;
  lastFailedRequestAt: string | null;
  recentErrors: Array<{
    correlationId: string;
    workflowType: AbhaWorkflowType;
    failureCategory?: AbhaFailureCategory;
    failureMessage?: string;
    occurredAt: string;
  }>;
  evaluatedAt: string;
}
