/**
 * HealthBridge India — ABDM & DISHA Consent Management Shared Contracts
 */
export * from './consent.types';

export type ConsentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED'
  | 'EXPIRED';

export type ConsentDataCategory =
  | 'MEDICAL_RECORDS'
  | 'PRESCRIPTIONS'
  | 'LAB_REPORTS'
  | 'DIAGNOSTIC_REPORTS'
  | 'ENCOUNTER_INFO';

export interface ConsentListItemDto {
  id: string;
  consentRequestId?: string;
  organization: string;
  doctorName?: string;
  requesterId: string;
  requesterRole: string;
  purpose: string;
  purposeDescription?: string;
  requestedDataTypes: string[];
  status: ConsentStatus;
  requestedAt: string;
  expiresAt: string;
  approvedAt?: string;
  revokedAt?: string;
  rejectionReason?: string;
  revocationReason?: string;
}

export interface ConsentDetailDto {
  id: string;
  consentRequestId?: string;
  patientId: string;
  patientName?: string;
  organization: string;
  doctorName?: string;
  requesterId: string;
  requesterRole: string;
  facilityDetails?: {
    name: string;
    address?: string;
    verified?: boolean;
  };
  verificationStatus?: string;
  purpose: string;
  purposeDescription?: string;
  requestedDataTypes: string[];
  dateRange: {
    from: string;
    to: string;
  };
  requestedAt: string;
  expiresAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  revokedAt?: string;
  status: ConsentStatus;
  durationDays: number;
  rejectionReason?: string;
  revocationReason?: string;
  signature?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentSummaryMetricsDto {
  pendingRequests: number;
  activePermissions: number;
  expiringSoon: number;
  revokedPermissions: number;
  total: number;
}

export interface ConsentHistoryEventDto {
  id: string;
  consentId: string;
  eventType:
    | 'CONSENT_REQUESTED'
    | 'CONSENT_APPROVED'
    | 'CONSENT_REJECTED'
    | 'CONSENT_REVOKED'
    | 'CONSENT_EXPIRED'
    | 'DATA_ACCESSED';
  title: string;
  description: string;
  organization: string;
  doctorName?: string;
  timestamp: string;
  status: ConsentStatus;
  metadata?: Record<string, unknown>;
}

export interface ConsentFilterQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  category?: string;
  sortBy?: 'requestedAt' | 'expiresAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ApproveConsentInputDto {
  signature?: string;
  notes?: string;
}

export interface RejectConsentInputDto {
  reason?: string;
}

export interface RevokeConsentInputDto {
  reason?: string;
}
