/**
 * ABDM & DISHA Consent Management Shared Contracts
 */
export * from './consent.types';

export interface ConsentSummaryDto {
  id: string;
  patientId: string;
  requesterId: string;
  purpose: string;
  status: string;
  requestedDataTypes: string[];
  expiresAt: string;
  grantedAt?: string;
}
