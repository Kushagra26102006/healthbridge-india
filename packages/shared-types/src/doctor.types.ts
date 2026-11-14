/**
 * HealthBridge India — Doctor Dashboard & Professional Profile Shared Contracts
 */

import type { UserRole, AccountStatus } from './roles';
import type { VerificationStatus, Address } from './profiles.types';
import type { AppointmentStatus, ConsultationType } from './appointment';

export interface DoctorProfileDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus: AccountStatus;
  registrationNumber: string;
  specialization: string[];
  qualifications: string[];
  experience: number;
  verificationStatus: VerificationStatus;
  facility?: {
    id: string;
    name: string;
    type?: string;
    address?: Address;
  };
  consultationModes: ('IN_PERSON' | 'TELECONSULTATION')[];
  bio?: string;
  languages?: string[];
  consultationFee?: number;
  profileImage?: string;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDoctorProfileDto {
  bio?: string;
  languages?: string[];
  consultationFee?: number;
  consultationModes?: ('IN_PERSON' | 'TELECONSULTATION')[];
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  profileImage?: string;
}

export interface DoctorAppointmentItemDto {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  scheduledAt: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
  reason: string;
  facilityName: string;
  status: AppointmentStatus;
  queueNumber?: number;
  checkedInAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
}

export interface DoctorAppointmentSummaryCountsDto {
  today: number;
  upcoming: number;
  pending: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface DoctorQueueItemDto {
  id: string;
  queueNumber: number;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientGender?: string;
  patientAge?: number;
  scheduledAt: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  checkedInAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
  waitingMinutes?: number;
  reason: string;
  encounterId?: string;
}

export interface DoctorAppointmentDetailDto {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientGender?: string;
  patientAge?: number;
  patientEmail?: string;
  scheduledAt: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
  facility?: {
    id: string;
    name: string;
    type?: string;
    address?: Address;
  };
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  queueNumber?: number;
  checkedInAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  encounterId?: string;
  previousEncounterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDoctorScheduleDto {
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  slotDurationMinutes?: number;
  consultationModes?: ('IN_PERSON' | 'TELECONSULTATION')[];
  blockedSlots?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }>;
}

export interface DoctorAppointmentFilterQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  filterTab?: 'all' | 'today' | 'upcoming' | 'history' | 'pending';
  startDate?: string;
  endDate?: string;
  consultationType?: ConsultationType;
  search?: string;
}

export type PatientAccessStatus =
  | 'GRANTED'
  | 'ENCOUNTER_BOUND'
  | 'ACTIVE_CONSENT'
  | 'CONSENT_REQUIRED'
  | 'ACCESS_EXPIRED'
  | 'ACCESS_REVOKED'
  | 'ACCESS_RESTRICTED';

export interface DoctorPatientItemDto {
  id: string;
  patientId: string;
  name: string;
  patientReference?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  age?: number;
  bloodGroup?: string;
  lastEncounterDate?: string;
  nextAppointmentDate?: string;
  nextAppointmentDetails?: {
    id: string;
    scheduledAt: string;
    consultationType: string;
    status: string;
  };
  assignedFacility?: {
    id: string;
    name: string;
  };
  totalAppointments: number;
  totalEncounters?: number;
  accessStatus: PatientAccessStatus;
  accessExpiresAt?: string;
}

export interface DoctorPatientFilterQueryDto {
  search?: string;
  filter?: 'all' | 'recently-seen' | 'upcoming-appointments' | 'active-care';
  facilityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'lastEncounterDate' | 'nextAppointmentDate' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorPatientProfileOverviewDto {
  patient: {
    id: string;
    name: string;
    patientReference: string;
    profileImage?: string;
    gender?: string;
    dateOfBirth?: string;
    age?: number;
    bloodGroup?: string;
    phone?: string;
    email?: string;
    abhaAddress?: string;
    abhaNumber?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    address?: {
      line1?: string;
      city?: string;
      district?: string;
      state?: string;
      postalCode?: string;
    };
  };
  accessStatus: PatientAccessStatus;
  accessDetails?: {
    consentId?: string;
    grantedAt?: string;
    expiresAt?: string;
    permittedDataTypes?: string[];
    purpose?: string;
    isEncounterBound?: boolean;
    reason?: string;
  };
  clinicalSummary: {
    medicalHistory?: string;
    allergies: string[];
    currentMedications: Array<{
      id?: string;
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
    recentEncounters: Array<{
      id: string;
      encounterReference: string;
      date: string;
      doctorName: string;
      facilityName?: string;
      chiefComplaint?: string;
      primaryDiagnosis?: string;
      status: string;
    }>;
    recentPrescriptions: Array<{
      id: string;
      prescriptionNumber: string;
      date: string;
      doctorName: string;
      medicationsCount: number;
      medicationNames: string[];
      status: string;
    }>;
    recentLabReports: Array<{
      id: string;
      reportNumber: string;
      testName: string;
      date: string;
      status: string;
      laboratoryName?: string;
      observationsCount: number;
    }>;
    upcomingAppointments: Array<{
      id: string;
      scheduledAt: string;
      consultationType: string;
      status: string;
      facilityName?: string;
    }>;
    vitalSigns?: {
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      bmi?: number;
      recordedAt?: string;
    };
  };
}

export type TimelineEventCategory =
  | 'ENCOUNTER'
  | 'PRESCRIPTION'
  | 'LAB_REPORT'
  | 'RECORD'
  | 'APPOINTMENT';

export interface DoctorPatientTimelineItemDto {
  id: string;
  category: TimelineEventCategory;
  title: string;
  timestamp: string;
  source: string;
  responsibleProvider: string;
  summary?: string;
  badgeText: string;
  badgeVariant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' | 'warning';
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PatientTimelineQueryDto {
  category?: 'ALL' | TimelineEventCategory;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientRecordItemDto {
  id: string;
  title: string;
  recordType: string;
  recordDate: string;
  source: string;
  doctorName?: string;
  facilityName?: string;
  verificationStatus: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
}

export interface PatientRecordFilterQueryDto {
  recordType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PatientEncounterHistoryItemDto {
  id: string;
  encounterReference: string;
  encounterType: string;
  startTime: string;
  endTime?: string;
  treatingDoctor: {
    id: string;
    name: string;
    specialization?: string[];
  };
  facility?: {
    id: string;
    name: string;
  };
  chiefComplaint?: string;
  primaryDiagnosis?: string;
  diagnoses: Array<{
    name: string;
    code?: string;
    type: string;
  }>;
  status: string;
  isDraft: boolean;
  isOwner: boolean;
  actionUrl: string;
}

export interface PatientPrescriptionHistoryItemDto {
  id: string;
  prescriptionNumber: string;
  issuedAt: string;
  doctor: {
    id: string;
    name: string;
    registrationNumber?: string;
  };
  diagnosis?: string;
  medications: Array<{
    name: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
    instructions?: string;
  }>;
  medicationsCount: number;
  status: string;
  isDraft: boolean;
  isOwner: boolean;
  documentUrl?: string;
  discontinuedAt?: string;
  discontinuationReason?: string;
}

export interface PatientLabReportHistoryItemDto {
  id: string;
  reportNumber: string;
  testName: string;
  category: string;
  testDate: string;
  publishedAt: string;
  status: string;
  laboratory: {
    id: string;
    name: string;
  };
  doctorName?: string;
  observations: Array<{
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
    interpretation: string;
  }>;
  clinicalNotes?: string;
  reportUrl?: string;
}

export interface CreateDoctorConsentRequestDto {
  purpose: string;
  purposeDescription?: string;
  requestedDataTypes: string[];
  durationDays?: number;
}

export interface DoctorClinicalActivityDto {
  id: string;
  type: 'APPOINTMENT' | 'ENCOUNTER' | 'PRESCRIPTION' | 'CONSENT';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  patientName?: string;
  actionUrl?: string;
}

export interface DoctorDashboardSummaryDto {
  profile: DoctorProfileDto;
  stats: {
    todayAppointments: number;
    upcomingAppointments: number;
    totalAssignedPatients: number;
    pendingEncounters: number;
    pendingPrescriptions: number;
  };
  todayAppointments: DoctorAppointmentItemDto[];
  upcomingAppointments: DoctorAppointmentItemDto[];
  recentActivities: DoctorClinicalActivityDto[];
}

export interface DoctorScheduleDto {
  doctorId: string;
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  slotDurationMinutes: number;
  consultationModes: ('IN_PERSON' | 'TELECONSULTATION')[];
  existingBlocks: Array<{
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }>;
}

