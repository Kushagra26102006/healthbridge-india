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
  isDraft?: boolean;
  version?: number;
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
  patientId?: string;
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

export interface DoctorPrescriptionSummaryDto {
  total: number;
  issued: number;
  draft: number;
  recent: number;
}

export interface MedicationCatalogItemDto {
  id: string;
  name: string;
  brandName: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  route: string;
  manufacturer: string;
  packageSize: string;
  schedule: string;
  therapeuticClass?: string;
  standardDosageUnit: string;
  isActive: boolean;
  instructionsHint?: string;
}

export interface MedicationCatalogFilterQueryDto {
  search?: string;
  dosageForm?: string;
  therapeuticClass?: string;
  page?: number;
  limit?: number;
}

export interface CreateMedicationInputDto {
  medicationCatalogId?: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export interface CreateDoctorPrescriptionDto {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  diagnosis?: string;
  instructions: string;
  followUpInstructions?: string;
  validUntil?: string;
  medications: CreateMedicationInputDto[];
  isDraft?: boolean;
}

export interface UpdateDoctorPrescriptionDto {
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
  diagnosis?: string;
  instructions?: string;
  followUpInstructions?: string;
  validUntil?: string;
  medications?: CreateMedicationInputDto[];
  isDraft?: boolean;
  version?: number;
}

export interface IssuePrescriptionDto {
  notes?: string;
  confirmAttribution: boolean;
}

export interface DiscontinuePrescriptionDto {
  reason: string;
}
