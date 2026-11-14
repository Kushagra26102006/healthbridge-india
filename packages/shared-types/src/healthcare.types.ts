/**
 * Healthcare Records & Clinical Domain Types
 */

export type MedicalRecordType =
  | 'OP_CONSULTATION'
  | 'DISCHARGE_SUMMARY'
  | 'DIAGNOSTIC_REPORT'
  | 'PRESCRIPTION'
  | 'IMMUNIZATION_RECORD'
  | 'WELLNESS_RECORD';

export type MedicalRecordSource = 'MANUAL_ENTRY' | 'ABDM_INGESTION' | 'EHR_SYNC';

export type RecordVerificationStatus = 'VERIFIED' | 'PENDING' | 'SELF_SUBMITTED';

export interface IMedicalRecord {
  id: string;
  patientId: string;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  source: MedicalRecordSource;
  resourceReference?: string;
  recordDate: Date | string;
  doctorName?: string;
  doctorId?: string;
  facilityName?: string;
  facilityId?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  fileData?: string;
  verificationStatus?: RecordVerificationStatus;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MedicalRecordDetailDto extends IMedicalRecord {
  fhirResource?: Record<string, unknown>;
}

export interface MedicalRecordSummaryDto {
  totalRecords: number;
  clinicalDocuments: number;
  prescriptions: number;
  labReports: number;
  immunizations: number;
  wellnessRecords: number;
}

export interface MedicalRecordFilterQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  category?: MedicalRecordType;
  recordType?: MedicalRecordType;
  source?: MedicalRecordSource;
  verificationStatus?: RecordVerificationStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: 'recordDate' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMedicalRecordDto {
  title: string;
  recordType: MedicalRecordType;
  recordDate: string;
  description?: string;
  doctorName?: string;
  doctorId?: string;
  facilityName?: string;
  facilityId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileData?: string;
}

export type EncounterType = 'AMBULATORY' | 'EMERGENCY' | 'INPATIENT' | 'HOME' | 'VIRTUAL';

export type EncounterStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface IEncounter {
  id: string;
  patientId: string;
  practitionerId: string;
  facilityId?: string;
  encounterType: EncounterType;
  startTime: Date | string;
  endTime?: Date | string;
  status: EncounterStatus;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PrescriptionStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DISPENSED'
  | 'CANCELLED'
  | 'DISCONTINUED'
  | 'EXPIRED';

export interface PrescribedMedication {
  id?: string;
  medicationCatalogId?: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  dosage: string;
  route?: string;
  frequency: string;
  duration: string;
  quantity?: number;
  instructions?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';
}

export interface IPrescription {
  id: string;
  prescriptionNumber?: string;
  patientId: string;
  doctorId: string;
  encounterId?: string;
  facilityId?: string;
  diagnosis?: string;
  medications: PrescribedMedication[];
  instructions: string;
  followUpInstructions?: string;
  issuedAt?: Date | string;
  issuedBy?: string;
  validUntil: Date | string;
  status: PrescriptionStatus;
  isDraft?: boolean;
  version?: number;
  documentUrl?: string;
  discontinuedAt?: Date | string;
  discontinuedBy?: string;
  discontinuationReason?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

import type { AppointmentStatus } from './appointment';
export type { AppointmentStatus };

export interface IAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  facilityId?: string;
  scheduledAt: Date | string;
  reason: string;
  status: AppointmentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type LabOrderStatus =
  'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_ANALYSIS' | 'COMPLETED' | 'CANCELLED';

export interface LabTestItem {
  testCode: string;
  testName: string;
  instructions?: string;
}

export interface ILaboratoryOrder {
  id: string;
  patientId: string;
  orderedBy: string;
  tests: LabTestItem[];
  status: LabOrderStatus;
  orderedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LabObservation {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  interpretation: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
}

export interface ILaboratoryReport {
  id: string;
  patientId: string;
  laboratoryId: string;
  orderId: string;
  observations: LabObservation[];
  reportUrl: string;
  publishedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

import type { IPatientProfile } from './profiles.types';

export interface PatientDashboardStatsDto {
  totalRecords: number;
  upcomingAppointments: number;
  activePrescriptions: number;
  availableLabReports: number;
  activeConsents: number;
}

export interface PatientRecentActivityDto {
  id: string;
  type: 'RECORD' | 'APPOINTMENT' | 'PRESCRIPTION' | 'LAB_REPORT' | 'CONSENT';
  title: string;
  description: string;
  timestamp: string;
  badge?: string;
  actionUrl?: string;
}

export interface PatientDashboardSummaryDto {
  profile: IPatientProfile | null;
  stats: PatientDashboardStatsDto;
  upcomingAppointments: Array<{
    id: string;
    doctorName: string;
    specialty: string;
    scheduledAt: string;
    facilityName: string;
    status: AppointmentStatus;
  }>;
  recentPrescriptions: Array<{
    id: string;
    doctorName: string;
    issuedAt: string;
    medicationsSummary: string;
    status: PrescriptionStatus;
    medicationsCount: number;
  }>;
  recentActivity: PatientRecentActivityDto[];
}
