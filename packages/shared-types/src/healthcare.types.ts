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

export interface IMedicalRecord {
  id: string;
  patientId: string;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  source: MedicalRecordSource;
  resourceReference?: string;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
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

export type PrescriptionStatus = 'ACTIVE' | 'DISPENSED' | 'CANCELLED' | 'EXPIRED';

export interface PrescribedMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  encounterId?: string;
  medications: PrescribedMedication[];
  instructions: string;
  issuedAt: Date | string;
  validUntil: Date | string;
  status: PrescriptionStatus;
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
  | 'ORDERED'
  | 'SAMPLE_COLLECTED'
  | 'IN_ANALYSIS'
  | 'COMPLETED'
  | 'CANCELLED';

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

