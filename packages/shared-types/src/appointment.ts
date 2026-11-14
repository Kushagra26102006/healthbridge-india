/**
 * Clinical Appointment & Doctor Scheduling Shared Contracts
 */

import type { VerificationStatus } from './profiles.types';
import type { Address } from './healthcare';

export type AppointmentStatus =
  | 'REQUESTED'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type ConsultationType = 'IN_PERSON' | 'TELECONSULTATION';

export interface TimeSlotDto {
  time: string; // e.g. "09:30 AM"
  startTime: string; // "09:30"
  endTime: string; // "10:00"
  timestamp: string; // ISO 8601 UTC string
  isAvailable: boolean;
}

export interface DoctorFacilityDto {
  id: string;
  name: string;
  type: string;
  address?: Address;
}

export interface DoctorPublicDto {
  id: string; // DoctorProfile ID
  userId: string; // User ID
  name: string;
  email?: string;
  phone?: string;
  specialization: string[];
  qualifications: string[];
  experience: number;
  registrationNumber?: string;
  verificationStatus: VerificationStatus;
  facility?: DoctorFacilityDto;
  consultationModes: ConsultationType[];
  availableToday?: boolean;
}

export interface AppointmentSummaryDto {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string[];
  facilityId?: string;
  facilityName?: string;
  scheduledAt: string;
  startTime?: string;
  endTime?: string;
  consultationType?: ConsultationType;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface AppointmentDetailDto {
  id: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string[];
  doctorQualifications?: string[];
  facilityId?: string;
  facilityName?: string;
  facilityAddress?: string;
  facilityCity?: string;
  scheduledAt: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
  reason: string;
  notes?: string;
  status: AppointmentStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  rescheduledFrom?: string;
  rescheduledAt?: string;
  rescheduleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId?: string;
  doctorId: string;
  facilityId?: string;
  scheduledAt: string;
  startTime?: string;
  endTime?: string;
  consultationType?: ConsultationType;
  reason: string;
  notes?: string;
}

export interface BookAppointmentDto {
  doctorId: string;
  facilityId?: string;
  scheduledAt: string;
  startTime: string;
  endTime?: string;
  consultationType: ConsultationType;
  reason: string;
  notes?: string;
}

export interface CancelAppointmentDto {
  reason: string;
}

export interface RescheduleAppointmentDto {
  newScheduledAt: string;
  newStartTime: string;
  newEndTime?: string;
  reason?: string;
}

export interface AppointmentFilterQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'scheduledAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorFilterQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  facilityId?: string;
  city?: string;
  consultationType?: ConsultationType;
}
