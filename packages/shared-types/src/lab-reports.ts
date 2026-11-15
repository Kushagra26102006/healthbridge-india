/**
 * HealthBridge India — Laboratory Reports & Diagnostic Results Shared Types
 */

import type { LabOrderStatus } from './healthcare.types';
export type { LabOrderStatus };

export type LabTestCategory =
  | 'HEMATOLOGY'
  | 'BIOCHEMISTRY'
  | 'CLINICAL_PATHOLOGY'
  | 'MICROBIOLOGY'
  | 'SEROLOGY'
  | 'IMMUNOLOGY'
  | 'MOLECULAR_DIAGNOSTICS'
  | 'RADIOLOGY'
  | 'BLOOD_TESTS'
  | 'URINE_TESTS'
  | 'IMAGING'
  | 'OTHER';

export type LabReportStatus = 'COMPLETED' | 'PENDING' | 'PRELIMINARY' | 'CANCELLED';

export type LabResultInterpretation =
  | 'NORMAL'
  | 'ABOVE_RANGE'
  | 'BELOW_RANGE'
  | 'NOT_AVAILABLE';

export interface LabObservationDto {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  interpretation: LabResultInterpretation;
  observationDate?: string;
}

export interface LabReportListItemDto {
  id: string;
  reportNumber: string;
  patientId: string;
  testName: string;
  category: LabTestCategory;
  testDate: string;
  reportDate: string;
  laboratoryId: string;
  laboratoryName: string;
  doctorId?: string;
  doctorName?: string;
  orderId?: string;
  status: LabReportStatus;
  observationCount: number;
  hasAbnormalResults: boolean;
  hasDocument: boolean;
}

export interface LabReportDetailDto {
  id: string;
  reportNumber: string;
  patientId: string;
  patientName?: string;
  patientAbhaId?: string;
  testName: string;
  category: LabTestCategory;
  testDate: string;
  reportDate: string;
  laboratoryId: string;
  laboratoryName: string;
  laboratoryAddress?: string;
  nablAccreditationNumber?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string[];
  orderId?: string;
  orderNumber?: string;
  status: LabReportStatus;
  observations: LabObservationDto[];
  documentUrl: string;
  documentMimeType?: string;
  documentFileSize?: number;
  verificationStatus?: string;
  clinicalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabReportSummaryMetricsDto {
  total: number;
  completed: number;
  pending: number;
  recentCount: number;
}

export interface LabOrderItemDto {
  testCode: string;
  testName: string;
  category?: string;
  instructions?: string;
}

export interface LabOrderListItemDto {
  id: string;
  orderNumber: string;
  patientId: string;
  orderedBy: string;
  doctorName: string;
  laboratoryId?: string;
  laboratoryName?: string;
  tests: LabOrderItemDto[];
  status: LabOrderStatus;
  collectionStatus?: string;
  orderedAt: string;
  reportId?: string;
  reportAvailable: boolean;
}

export interface LabOrderDetailDto {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName?: string;
  orderedBy: string;
  doctorName: string;
  doctorSpecialization?: string[];
  laboratoryId?: string;
  laboratoryName?: string;
  laboratoryAddress?: string;
  tests: LabOrderItemDto[];
  status: LabOrderStatus;
  collectionStatus?: string;
  orderedAt: string;
  reportId?: string;
  clinicalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabReportFilterQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  laboratoryId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'reportDate' | 'testDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LabOrderFilterQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: 'orderedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
