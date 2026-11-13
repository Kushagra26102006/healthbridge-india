/**
 * Electronic Health Records (EHR) & Health Information (HI) Types
 * Aligned with FHIR R4 & ABDM HIP/HIU Specifications
 */

export type HealthInformationType =
  | 'OP_CONSULTATION'
  | 'DISCHARGE_SUMMARY'
  | 'DIAGNOSTIC_REPORT'
  | 'PRESCRIPTION'
  | 'IMMUNIZATION_RECORD'
  | 'WELLNESS_RECORD';

export interface HealthRecordSummary {
  id: string;
  patientId: string;
  abhaAddress: string;
  facilityId: string;
  facilityName: string;
  practitionerName: string;
  recordType: HealthInformationType;
  title: string;
  date: string;
  fhirBundleUri?: string;
  hasAttachment: boolean;
  createdAt: string;
}
