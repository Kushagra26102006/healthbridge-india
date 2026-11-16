/**
 * HealthBridge India — Laboratory Reports & Diagnostic Results Shared Types
 * Conforms to ABDM, NABL, LOINC and HL7 FHIR DiagnosticReport / Observation standards
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

export type LabReportStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'AMENDED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PENDING'
  | 'PRELIMINARY';

export type LabResultInterpretation =
  | 'NORMAL'
  | 'ABOVE_RANGE'
  | 'BELOW_RANGE'
  | 'NOT_AVAILABLE'
  | 'ABNORMAL'
  | 'CRITICAL';

export type ReportReviewDecision = 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUESTED';

export interface LabObservationDto {
  parameterCode?: string;
  testName: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  interpretation: LabResultInterpretation;
  flag?: 'NORMAL' | 'LOW' | 'HIGH' | 'ABNORMAL' | 'CRITICAL' | 'UNVERIFIED';
  isAbnormal?: boolean;
  isCritical?: boolean;
  method?: string;
  observationDate?: string;
  notes?: string;
}

export interface ReportReviewDetailsDto {
  reviewerId: string;
  reviewerName: string;
  reviewerRole?: string;
  reviewedAt: string;
  decision: ReportReviewDecision;
  comments: string;
}

export interface ReportApprovalDetailsDto {
  approvedById: string;
  approvedByName: string;
  approvedByDesignation?: string;
  approvedByRegistrationNumber?: string;
  approvedAt: string;
  comments?: string;
}

export interface ReportPublicationDetailsDto {
  publishedById: string;
  publishedByName: string;
  publishedAt: string;
  publicationMethod?: string;
}

export interface ReportSignatureMetadataDto {
  signerId: string;
  signerName: string;
  signerRole: string;
  signingMethod: 'INTERNAL_CRYPTOGRAPHIC_HASH' | 'METADATA_ATTESTATION';
  signedAt: string;
  documentHash: string;
  versionHash: string;
  verificationStatus: 'VERIFIED_INTERNAL' | 'PENDING' | 'REJECTED';
}

export interface ReportAmendmentDetailsDto {
  isAmended: boolean;
  amendedAt?: string;
  amendedById?: string;
  amendedByName?: string;
  amendmentReason?: string;
  supersedesReportId?: string;
  supersededVersion?: number;
  changedFields?: string[];
}

export interface LabReportVersionDto {
  id: string;
  reportId: string;
  reportNumber: string;
  version: number;
  status: LabReportStatus;
  contentSnapshot: any;
  documentHash: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  amendmentReason?: string;
  changedFields?: string[];
  approvalSnapshot?: {
    approvedByName: string;
    approvedAt: string;
    comments?: string;
  };
}

export interface GenerateReportDraftDto {
  orderId: string;
  testCodes?: string[];
  clinicalNotes?: string;
  interpretation?: string;
}

export interface SubmitReportForReviewDto {
  notes?: string;
}

export interface ReviewReportDto {
  decision: ReportReviewDecision;
  comments: string;
}

export interface ApproveReportDto {
  comments?: string;
  designation?: string;
  registrationNumber?: string;
}

export interface PublishReportDto {
  publicationNotes?: string;
}

export interface RequestAmendmentDto {
  amendmentReason: string;
  explanation: string;
  changedResultCodes?: string[];
}

export interface LabReportListItemDto {
  id: string;
  reportNumber: string;
  patientId: string;
  testName: string;
  category: LabTestCategory;
  testDate: string;
  reportDate: string;
  publishedAt?: string;
  laboratoryId: string;
  laboratoryName: string;
  doctorId?: string;
  doctorName?: string;
  orderId?: string;
  status: LabReportStatus;
  currentVersion?: number;
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
  patientGender?: string;
  patientAge?: number;
  testName: string;
  category: LabTestCategory;
  testDate: string;
  reportDate: string;
  publishedAt?: string;
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
  currentVersion?: number;
  tests?: {
    testCode: string;
    testName: string;
    specimenType?: string;
    category?: string;
  }[];
  observations: LabObservationDto[];
  documentUrl: string;
  documentHash?: string;
  documentMimeType?: string;
  documentFileSize?: number;
  verificationStatus?: string;
  clinicalNotes?: string;
  interpretation?: string;
  reviewDetails?: ReportReviewDetailsDto;
  approvalDetails?: ReportApprovalDetailsDto;
  publicationDetails?: ReportPublicationDetailsDto;
  signatureMetadata?: ReportSignatureMetadataDto;
  amendmentDetails?: ReportAmendmentDetailsDto;
  versionHistory?: LabReportVersionDto[];
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
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'reportDate' | 'testDate' | 'createdAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LabOrderFilterQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// FHIR R4 DIAGNOSTIC REPORT COMPATIBILITY TYPES
// ============================================================================

export interface FHIRResourceReference {
  reference: string;
  display?: string;
}

export interface FHIRDiagnosticReportObservation {
  resourceType: 'Observation';
  id: string;
  status: 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
  category?: {
    coding: { system: string; code: string; display: string }[];
  }[];
  code: {
    coding: { system: string; code: string; display: string }[];
    text?: string;
  };
  subject: FHIRResourceReference;
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  interpretation?: {
    coding: { system: string; code: string; display: string }[];
  }[];
  referenceRange?: {
    low?: { value: number; unit?: string };
    high?: { value: number; unit?: string };
    text?: string;
  }[];
}

export interface FHIRDiagnosticReportResource {
  resourceType: 'DiagnosticReport';
  id: string;
  identifier: { system: string; value: string }[];
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
  category: { coding: { system: string; code: string; display: string }[] }[];
  code: { coding: { system: string; code: string; display: string }[]; text?: string };
  subject: FHIRResourceReference;
  encounter?: FHIRResourceReference;
  effectiveDateTime: string;
  issued: string;
  performer: FHIRResourceReference[];
  result: FHIRResourceReference[];
  presentedForm?: {
    contentType: string;
    data?: string;
    url?: string;
    title?: string;
  }[];
  conclusion?: string;
}

export interface FHIRDiagnosticReportBundle {
  resourceType: 'Bundle';
  type: 'document' | 'collection';
  timestamp: string;
  entry: {
    fullUrl: string;
    resource: FHIRDiagnosticReportResource | FHIRDiagnosticReportObservation | any;
  }[];
}
