/**
 * HealthBridge India — Clinical Encounter Management Types & Contracts
 */

import type { EncounterType, EncounterStatus } from './healthcare.types';

export type DiagnosisClassification = 'PRIMARY' | 'SECONDARY';
export type DiagnosisClinicalStatus = 'ACTIVE' | 'RECURRENCE' | 'RELAPSE' | 'REMISSION' | 'RESOLVED';

export interface EncounterVitalsDto {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  recordedAt?: string;
}

export interface EncounterDiagnosisDto {
  id?: string;
  name: string;
  code?: string;
  type: DiagnosisClassification;
  clinicalStatus: DiagnosisClinicalStatus;
  notes?: string;
}

export interface EncounterExaminationDto {
  general?: string;
  systemic?: string;
}

export interface EncounterSummaryCountsDto {
  today: number;
  draft: number;
  completed: number;
  pendingDocumentation: number;
  total: number;
}

export interface EncounterItemDto {
  id: string;
  encounterReference: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  practitionerId: string;
  doctorName: string;
  appointmentId?: string;
  facilityId?: string;
  facilityName?: string;
  encounterType: EncounterType;
  status: EncounterStatus;
  isDraft: boolean;
  chiefComplaint?: string;
  primaryDiagnosis?: string;
  startTime: string;
  endTime?: string;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncounterDetailDto extends EncounterItemDto {
  historyOfPresentIllness?: string;
  medicalHistory?: string;
  vitals?: EncounterVitalsDto;
  examination?: EncounterExaminationDto;
  diagnoses: EncounterDiagnosisDto[];
  assessment?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  linkedRecordIds?: string[];
  linkedPrescriptionIds?: string[];
  prescriptions?: Array<{
    id: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    instructions: string;
    issuedAt: string;
    status: string;
  }>;
  version: number;
  finalizedBy?: string;
}

export interface PatientClinicalHistoryDto {
  patient: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    gender?: string;
    dateOfBirth?: string;
    age?: number;
    bloodGroup?: string;
    abhaAddress?: string;
    abhaNumber?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  allergies: string[];
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    prescribedBy?: string;
    issuedAt: string;
  }>;
  pastDiagnoses: Array<{
    name: string;
    code?: string;
    type: string;
    diagnosedDate: string;
    encounterId?: string;
  }>;
  encounters: EncounterItemDto[];
  labReports: Array<{
    id: string;
    testName: string;
    date: string;
    status: string;
    summary?: string;
    reportUrl?: string;
  }>;
  medicalRecords: Array<{
    id: string;
    title: string;
    recordType: string;
    recordDate: string;
    source: string;
  }>;
  consentStatus: 'GRANTED' | 'ENCOUNTER_BOUND' | 'REVOKED' | 'EXPIRED' | 'NONE';
}

export interface CreateEncounterDto {
  patientId: string;
  appointmentId?: string;
  facilityId?: string;
  encounterType?: EncounterType;
  chiefComplaint?: string;
}

export interface UpdateEncounterDto {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  medicalHistory?: string;
  vitals?: EncounterVitalsDto;
  examination?: EncounterExaminationDto;
  diagnoses?: EncounterDiagnosisDto[];
  assessment?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  linkedRecordIds?: string[];
  linkedPrescriptionIds?: string[];
  version?: number;
}

export interface EncounterFilterQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  filterTab?: 'all' | 'today' | 'draft' | 'completed' | 'pending';
  search?: string;
  patientId?: string;
  facilityId?: string;
  encounterType?: EncounterType;
  startDate?: string;
  endDate?: string;
}
