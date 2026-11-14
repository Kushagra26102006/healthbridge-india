/**
 * HealthBridge India — Prescriptions & Medication Management Shared Types
 */

import type { PrescriptionStatus } from './healthcare.types';
export type { PrescriptionStatus };

export type MedicationStatus = 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';

export type RefillStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface PrescribedMedicationDto {
  id: string;
  name: string;
  genericName?: string;
  strength: string;
  dosage: string;
  route: string; // e.g. Oral, Topical, Inhalation, Intravenous
  frequency: string; // e.g. "Once daily", "Twice daily after meals", "1-0-1"
  duration: string; // e.g. "14 days", "1 month"
  quantity: number; // e.g. 28 tablets
  startDate: string;
  endDate: string;
  status: MedicationStatus;
  instructions?: string;
}

export interface RefillRequestDto {
  id: string;
  requestedAt: string;
  reason: string;
  quantity?: number;
  status: RefillStatus;
  reviewerNotes?: string;
  reviewedAt?: string;
}

export interface PrescriptionSummaryMetricsDto {
  total: number;
  active: number;
  completed: number;
  recentCount: number;
}

export interface PrescriptionListItemDto {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string[];
  facilityId?: string;
  facilityName?: string;
  issuedAt: string;
  validUntil: string;
  status: PrescriptionStatus;
  medicationCount: number;
  refillEligible: boolean;
  refillsRemaining: number;
}

export interface PrescriptionDetailDto {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName?: string;
  patientAbhaId?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string[];
  doctorRegistrationNumber?: string;
  facilityId?: string;
  facilityName?: string;
  facilityAddress?: string;
  facilityCity?: string;
  issuedAt: string;
  validUntil: string;
  status: PrescriptionStatus;
  diagnosis?: string;
  instructions: string;
  followUpInstructions?: string;
  medications: PrescribedMedicationDto[];
  refillEligible: boolean;
  refillsAllowed: number;
  refillsRemaining: number;
  refillRequests: RefillRequestDto[];
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationOverviewDto {
  id: string;
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  name: string;
  genericName?: string;
  strength: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: number;
  startDate: string;
  endDate: string;
  status: MedicationStatus;
  instructions?: string;
  prescribingDoctorName: string;
  facilityName?: string;
}

export interface PrescriptionFilterQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  doctorId?: string;
  facilityId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'issuedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MedicationFilterQueryDto {
  page?: number;
  limit?: number;
  status?: string; // 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED' | 'ALL'
  search?: string;
  sortBy?: 'startDate' | 'endDate' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateRefillRequestDto {
  reason: string;
  quantity?: number;
  notes?: string;
}
