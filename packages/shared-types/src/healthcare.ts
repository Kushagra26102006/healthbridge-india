/**
 * Healthcare, Clinical Profiles & Medical Records Shared Contracts
 */
export * from './healthcare.types';
export * from './profiles.types';
export * from './health-record.types';

export interface MedicalRecordSummaryDto {
  id: string;
  patientId: string;
  recordType: string;
  title: string;
  description: string;
  source: string;
  createdAt: string;
}
