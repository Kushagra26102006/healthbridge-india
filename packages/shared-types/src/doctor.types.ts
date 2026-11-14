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
}

export interface DoctorPatientItemDto {
  id: string;
  patientId: string;
  name: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  lastEncounterDate?: string;
  nextAppointmentDate?: string;
  totalAppointments: number;
  accessStatus: 'ACTIVE_CONSENT' | 'ENCOUNTER_BOUND';
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
