/**
 * Clinical Appointment Shared Contracts
 */

export type AppointmentStatus =
  | 'REQUESTED'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface AppointmentSummaryDto {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  facilityId?: string;
  scheduledAt: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  facilityId?: string;
  scheduledAt: string;
  reason: string;
}
