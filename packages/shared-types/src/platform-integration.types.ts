/**
 * HealthBridge India — Platform-Wide Integration & Unified Clinical Workspace Types (Day 8 Task 01)
 */

import type { AbdmIntegrationStatus } from './abdm.types';
import type { AbdmImportedRecordDto } from './abdm-hie.types';

export type UnifiedTimelineEventType =
  | 'PATIENT_REGISTERED'
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_COMPLETED'
  | 'CLINICAL_ENCOUNTER'
  | 'DIAGNOSIS_RECORDED'
  | 'PRESCRIPTION_ISSUED'
  | 'PRESCRIPTION_DISPENSED'
  | 'LAB_ORDER_CREATED'
  | 'SAMPLE_COLLECTED'
  | 'TEST_COMPLETED'
  | 'LAB_REPORT_PUBLISHED'
  | 'LAB_REPORT_AMENDED'
  | 'DOCUMENT_UPLOADED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'EXTERNAL_RECORD_IMPORTED';

export type UnifiedTimelineSourceModule =
  | 'PATIENT'
  | 'APPOINTMENTS'
  | 'ENCOUNTERS'
  | 'PRESCRIPTIONS'
  | 'PHARMACY'
  | 'LABORATORY'
  | 'RECORDS'
  | 'CONSENT'
  | 'ABDM';

export interface PatientTimelineItemDto {
  id: string;
  eventType: UnifiedTimelineEventType;
  occurredAt: string;
  timezone: 'UTC';
  sourceModule: UnifiedTimelineSourceModule;
  title: string;
  summary: string;
  status: string;
  recordReference: {
    entityType: string;
    entityId: string;
    referenceNumber?: string;
  };
  authorizedAction?: {
    label: string;
    href: string;
  };
  provenance: {
    origin: 'INTERNAL_HEALTHBRIDGE' | 'ABDM_EXTERNAL_IMPORT';
    sourceOrganization?: string;
    actorName?: string;
    isMocked?: boolean;
    isAmended?: boolean;
    readOnly: boolean;
  };
}

export interface UnifiedPatientTimelineQueryDto {
  page?: number;
  limit?: number;
  eventType?: UnifiedTimelineEventType;
  sourceModule?: UnifiedTimelineSourceModule;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface PatientTimelineResponseDto {
  patientId: string;
  items: PatientTimelineItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  availableCountsByModule: Partial<Record<UnifiedTimelineSourceModule, number>>;
  generatedAt: string;
}

export interface UnifiedPatientIdentitySummaryDto {
  authoritativePatientId: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  externalAbha: {
    linked: boolean;
    verificationStatus: string;
    maskedAbhaNumber?: string;
    abhaAddress?: string;
    linkHistoryCount: number;
    isMocked?: boolean;
  };
  duplicateAccountReview: {
    flaggedForReview: boolean;
    potentialMatchCount: number;
    autoMergeAllowed: false;
    note: string;
  };
}

export interface DoctorUnifiedPatientOverviewDto {
  patient: UnifiedPatientIdentitySummaryDto;
  authorization: {
    accessBasis: 'ACTIVE_CONSENT' | 'APPOINTMENT_OR_ENCOUNTER_RELATIONSHIP';
    internalConsentActive: boolean;
    abdmConsentActive: boolean;
    activeInternalConsentsCount: number;
    activeAbdmArtefactsCount: number;
    readOnlyExternalSections: ['LABORATORY_REPORTS', 'PHARMACY_DISPENSING', 'ABDM_EXTERNAL_RECORDS'];
  };
  appointments: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    reason?: string;
    encounterId?: string;
    facilityName?: string;
  }>;
  encounters: Array<{
    id: string;
    appointmentId?: string;
    encounterType: string;
    startTime: string;
    status: string;
    isDraft: boolean;
    chiefComplaint?: string;
    diagnoses: Array<{ name: string; code?: string; type: string }>;
    finalizedAt?: string;
    source: 'INTERNAL_HEALTHBRIDGE';
  }>;
  prescriptions: Array<{
    id: string;
    prescriptionNumber?: string;
    encounterId?: string;
    issuedAt: string;
    status: string;
    medicationsCount: number;
    medicationsSummary: string;
    dispensingStatus: 'NOT_DISPENSED' | 'PARTIALLY_DISPENSED' | 'FULLY_DISPENSED' | 'CANCELLED';
    lastDispensedAt?: string;
    dispensingPharmacyName?: string;
  }>;
  medicationHistory: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    prescribedAt: string;
    prescriptionStatus: string;
    dispensingStatus: string;
    source: 'INTERNAL_PRESCRIPTION' | 'PHARMACY_DISPENSING';
  }>;
  laboratoryReports: Array<{
    id: string;
    reportNumber: string;
    orderId?: string;
    testName: string;
    category?: string;
    status: string;
    publishedAt?: string;
    testDate: string;
    isAmended: boolean;
    currentVersion: number;
    laboratoryName?: string;
    readOnly: true;
  }>;
  medicalDocuments: Array<{
    id: string;
    title: string;
    recordType: string;
    recordDate: string;
    source: string;
    facilityName?: string;
  }>;
  externalAbdmRecords: AbdmImportedRecordDto[];
  dateFilterApplied?: {
    fromDate?: string;
    toDate?: string;
  };
  generatedAt: string;
}

export interface CreateDoctorLabOrderDto {
  patientId: string;
  encounterId?: string;
  laboratoryId?: string;
  facilityId?: string;
  priority?: 'ROUTINE' | 'URGENT' | 'STAT' | 'EMERGENCY';
  requestedCollectionDate?: string;
  clinicalNotes?: string;
  idempotencyKey?: string;
  tests: Array<{
    testCode: string;
    testName: string;
    category?: string;
    specimenType?: string;
    instructions?: string;
  }>;
}

export interface AdminPlatformOverviewDto {
  users: {
    registeredPatients: number;
    activeDoctors: number;
    activePharmacies: number;
    activeLaboratories: number;
  };
  clinicalOperations: {
    totalAppointments: number;
    upcomingAppointments: number;
    totalEncounters: number;
    finalizedEncounters: number;
    totalPrescriptions: number;
    activePrescriptions: number;
    dispensingRecords: number;
    totalLabOrders: number;
    publishedLabReports: number;
    amendedLabReports: number;
  };
  notifications: {
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  abdm: {
    overallStatus: AbdmIntegrationStatus;
    sandboxConnectivityStatus: AbdmIntegrationStatus;
    liveExchangeEnabled: false;
    verifiedAbhaLinks: number;
    activeAbdmArtefacts: number;
    hipHiuTransfersTotal: number;
    importedExternalRecords: number;
  };
  generatedAt: string;
}

export type PlatformDomainEventType =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_COMPLETED'
  | 'ENCOUNTER_STARTED'
  | 'ENCOUNTER_FINALIZED'
  | 'FOLLOW_UP_REQUIRED'
  | 'PRESCRIPTION_ISSUED'
  | 'PRESCRIPTION_CANCELLED'
  | 'PRESCRIPTION_DISPENSED'
  | 'PRESCRIPTION_PARTIALLY_DISPENSED'
  | 'LAB_ORDER_CREATED'
  | 'SAMPLE_COLLECTED'
  | 'SAMPLE_REJECTED'
  | 'TEST_COMPLETED'
  | 'REPORT_PUBLISHED'
  | 'REPORT_AMENDED'
  | 'ABHA_LINKED'
  | 'CONSENT_REQUEST_RECEIVED'
  | 'CONSENT_APPROVED'
  | 'CONSENT_REVOKED'
  | 'EXTERNAL_RECORD_IMPORTED';
