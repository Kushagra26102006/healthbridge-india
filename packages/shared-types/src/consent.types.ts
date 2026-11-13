/**
 * ABDM Aligned Consent Architecture Types
 */

export type ConsentRequestStatus = 'REQUESTED' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';

export type ConsentArtifactStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export type ConsentPurposeCode =
  | 'CAREMGT' // Care Management
  | 'BTG' // Break the Glass / Emergency
  | 'PUBHLTH' // Public Health
  | 'HPAYMT' // Healthcare Payment
  | 'DSRCH' // Disease Specific Healthcare Research
  | 'PATRQT'; // Self Patient Request

export interface DateRange {
  from: Date | string;
  to: Date | string;
}

export interface IConsentRequest {
  id: string;
  patientId: string;
  requesterId: string;
  requesterName?: string;
  purpose: ConsentPurposeCode | string;
  purposeDescription?: string;
  requestedDataTypes: string[];
  dateRange: DateRange;
  requestedAt: Date | string;
  status: ConsentRequestStatus;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IConsentArtifact {
  id: string;
  consentRequestId?: string;
  patientId: string;
  requesterId: string;
  requesterName?: string;
  purpose: ConsentPurposeCode | string;
  permittedDataTypes: string[];
  validityPeriod: DateRange;
  consentStatus: ConsentArtifactStatus;
  approvedAt: Date | string;
  revokedAt?: Date | string;
  signature?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
