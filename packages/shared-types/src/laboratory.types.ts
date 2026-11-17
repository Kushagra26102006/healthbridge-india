/**
 * HealthBridge India — Laboratory Management Shared Types
 * Conforms to NDHM / ABDM, LOINC and HL7 FHIR DiagnosticReport / ServiceRequest / Specimen standards
 */

import { VerificationStatus } from './profiles.types';
import type { LabTestCategory } from './lab-reports';

export type { LabTestCategory };

// ============================================================================
// 1. ENUMS & LITERAL TYPES
// ============================================================================

export type SpecimenType =
  | 'BLOOD'
  | 'SERUM'
  | 'PLASMA'
  | 'URINE'
  | 'STOOL'
  | 'SWAB'
  | 'SPUTUM'
  | 'CSF'
  | 'BIOPSY'
  | 'OTHER';

export type LabOrderPriority = 'ROUTINE' | 'URGENT' | 'STAT' | 'EMERGENCY';

export type LabSampleStatus =
  | 'COLLECTION_PENDING'
  | 'COLLECTED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'ACCESSIONED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED';

export type LabFacilityType =
  | 'CLINICAL_LAB'
  | 'PATHOLOGY_LAB'
  | 'DIAGNOSTIC_CENTER'
  | 'HOSPITAL_LAB'
  | 'COLLECTION_CENTER';

export type LaboratoryDocumentType =
  | 'REGISTRATION_CERTIFICATE'
  | 'CLINICAL_ESTABLISHMENT_LICENSE'
  | 'NABL_ACCREDITATION'
  | 'ICMR_APPROVAL'
  | 'POLLUTION_CONTROL_NOC'
  | 'BIO_MEDICAL_WASTE_CERTIFICATE'
  | 'OTHER';

export type LabDocumentSubmissionStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type OrderRejectionReason =
  | 'TEST_NOT_AVAILABLE'
  | 'INVALID_ORDER'
  | 'INSUFFICIENT_INFORMATION'
  | 'FACILITY_UNAVAILABLE'
  | 'SPECIMEN_REQUIREMENT_UNSUPPORTED'
  | 'OTHER';

export type SampleRejectionReason =
  | 'UNLABELLED_SAMPLE'
  | 'INCORRECT_SPECIMEN'
  | 'INSUFFICIENT_QUANTITY'
  | 'DAMAGED_CONTAINER'
  | 'LEAKAGE'
  | 'EXPIRED_STABILITY_WINDOW'
  | 'DUPLICATE_SAMPLE'
  | 'TRANSPORT_CONDITION_FAILURE'
  | 'OTHER';

export type TestAssignmentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export type ParameterDataType =
  | 'NUMERIC'
  | 'TEXT'
  | 'BOOLEAN'
  | 'QUALITATIVE'
  | 'DATE';

export type ResultFlag =
  | 'NORMAL'
  | 'LOW'
  | 'HIGH'
  | 'ABNORMAL'
  | 'CRITICAL'
  | 'NOT_APPLICABLE'
  | 'UNVERIFIED';

export type TestResultStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'ON_HOLD'
  | 'REJECTED'
  | 'APPROVED';

export type QCStatus =
  | 'ACCEPTABLE'
  | 'OUT_OF_RANGE'
  | 'INVALID'
  | 'PENDING_REVIEW';

// ============================================================================
// 2. LABORATORY PROFILE & REGISTRATION DTOS
// ============================================================================

export interface LaboratoryDocumentDto {
  documentId: string;
  documentType: LaboratoryDocumentType;
  documentNumber: string;
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
}

export interface LaboratoryOperatingHoursDto {
  dayOfWeek: string;
  isOpen: boolean;
  is24Hours: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface CollectionCenterDto {
  id?: string;
  laboratoryId?: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPhone: string;
  contactEmail?: string;
  contactPerson?: string;
  operatingHours?: string;
  collectionServices?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LaboratoryProfileDto {
  id: string;
  userId: string;
  laboratoryName: string;
  laboratoryLicenseNumber: string;
  registrationNumber?: string;
  logo?: string;
  description?: string;
  contactEmail?: string;
  contactPhone: string;
  websiteUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  issuingAuthority?: string;
  accreditationInfo?: {
    nablAccredited: boolean;
    nablCertificateNumber?: string;
    nablExpiryDate?: string;
    capAccredited?: boolean;
    icmrApproved?: boolean;
    isoCertified?: boolean;
  };
  facilityName: string;
  facilityType: LabFacilityType;
  collectionCenterDetails?: CollectionCenterDto[];
  operatingHours?: LaboratoryOperatingHoursDto[];
  supportedDiagnosticServices: string[];
  verificationStatus: VerificationStatus;
  documentSubmissionStatus: LabDocumentSubmissionStatus;
  documents: LaboratoryDocumentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLaboratoryProfileDto {
  laboratoryName?: string;
  description?: string;
  logo?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  registrationNumber?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  issuingAuthority?: string;
  accreditationInfo?: {
    nablAccredited?: boolean;
    nablCertificateNumber?: string;
    nablExpiryDate?: string;
    capAccredited?: boolean;
    icmrApproved?: boolean;
    isoCertified?: boolean;
  };
  facilityName?: string;
  facilityType?: LabFacilityType;
  collectionCenterDetails?: CollectionCenterDto[];
  operatingHours?: LaboratoryOperatingHoursDto[];
  supportedDiagnosticServices?: string[];
}

export interface UploadLaboratoryDocumentDto {
  documentType: LaboratoryDocumentType;
  documentNumber: string;
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// ============================================================================
// 3. DIAGNOSTIC TEST CATALOGUE & TEST PARAMETER DTOS
// ============================================================================

export interface ReferenceRangeDto {
  id?: string;
  gender?: 'ALL' | 'MALE' | 'FEMALE';
  ageMinYears?: number;
  ageMaxYears?: number;
  normalMin?: number;
  normalMax?: number;
  criticalLow?: number;
  criticalHigh?: number;
  unit: string;
  textualInterpretation?: string;
  version?: number;
  effectiveDate?: string;
  source?: string;
  isActive?: boolean;
}

export interface TestParameterDto {
  id?: string;
  testId?: string;
  parameterName: string;
  parameterCode: string;
  dataType: ParameterDataType;
  unit?: string;
  decimalPrecision?: number;
  qualitativeOptions?: string[]; // e.g. ['Positive', 'Negative', 'Reactive', 'Non-reactive']
  referenceRanges: ReferenceRangeDto[];
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTestParameterDto {
  parameterName: string;
  parameterCode: string;
  dataType: ParameterDataType;
  unit?: string;
  decimalPrecision?: number;
  qualitativeOptions?: string[];
  referenceRanges?: ReferenceRangeDto[];
  isRequired?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateTestParameterDto {
  parameterName?: string;
  dataType?: ParameterDataType;
  unit?: string;
  decimalPrecision?: number;
  qualitativeOptions?: string[];
  referenceRanges?: ReferenceRangeDto[];
  isRequired?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export interface LabTestDto {
  id: string;
  laboratoryId: string;
  facilityId?: string;
  testName: string;
  testCode: string;
  category: LabTestCategory;
  description?: string;
  specimenType: SpecimenType;
  collectionMethod?: string;
  preparationInstructions?: string;
  containerRequirements?: string;
  fastingRequirement: boolean;
  fastingDurationHours?: number;
  expectedTurnaroundTime: string;
  price: number;
  isActive: boolean;
  performingDepartment?: string;
  parameters?: TestParameterDto[];
  referenceRanges?: ReferenceRangeDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabTestDto {
  testName: string;
  testCode: string;
  category: LabTestCategory;
  description?: string;
  specimenType: SpecimenType;
  collectionMethod?: string;
  preparationInstructions?: string;
  containerRequirements?: string;
  fastingRequirement?: boolean;
  fastingDurationHours?: number;
  expectedTurnaroundTime: string;
  price: number;
  isActive?: boolean;
  performingDepartment?: string;
  parameters?: CreateTestParameterDto[];
  referenceRanges?: ReferenceRangeDto[];
}

export interface UpdateLabTestDto {
  testName?: string;
  category?: LabTestCategory;
  description?: string;
  specimenType?: SpecimenType;
  collectionMethod?: string;
  preparationInstructions?: string;
  containerRequirements?: string;
  fastingRequirement?: boolean;
  fastingDurationHours?: number;
  expectedTurnaroundTime?: string;
  price?: number;
  isActive?: boolean;
  performingDepartment?: string;
  parameters?: CreateTestParameterDto[];
  referenceRanges?: ReferenceRangeDto[];
}

export interface LabTestFilterDto {
  search?: string;
  category?: LabTestCategory;
  specimenType?: SpecimenType;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// 4. TEST ASSIGNMENT & LABORATORY ORDER QUEUE DTOS
// ============================================================================

export interface TestAssignmentDto {
  id?: string;
  testCode: string;
  testName: string;
  testId?: string;
  department?: string;
  facilityId?: string;
  specimenType: SpecimenType;
  collectionMethod?: string;
  collectionInstructions?: string;
  priority?: LabOrderPriority;
  status: TestAssignmentStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedAt?: string;
  assignedBy?: string;
}

export interface LabOrderStatusHistoryDto {
  status: string;
  changedBy: string;
  changedByName?: string;
  timestamp: string;
  reason?: string;
}

export interface LabOrderPatientSummaryDto {
  id: string;
  name: string;
  gender?: string;
  age?: number;
  dateOfBirth?: string;
  phone?: string;
  abhaAddress?: string;
}

export interface LabOrderDoctorSummaryDto {
  id: string;
  name: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  facilityName?: string;
}

export interface LaboratoryOrderDto {
  id: string;
  orderNumber: string;
  patientId: string;
  patient?: LabOrderPatientSummaryDto;
  orderedBy: string;
  doctor?: LabOrderDoctorSummaryDto;
  laboratoryId?: string;
  facilityId?: string;
  tests: {
    testCode: string;
    testName: string;
    category?: string;
    specimenType?: string;
    instructions?: string;
  }[];
  testAssignments?: TestAssignmentDto[];
  status:
    | 'ORDERED'
    | 'ACCEPTED'
    | 'SAMPLE_COLLECTED'
    | 'IN_ANALYSIS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'REJECTED'
    | 'CLARIFICATION_REQUESTED';
  priority?: LabOrderPriority;
  collectionStatus?: string;
  orderedAt: string;
  requestedCollectionDate?: string;
  acceptedAt?: string;
  rejectionReasonCode?: OrderRejectionReason;
  rejectionReason?: string;
  clarificationNotes?: string;
  clinicalNotes?: string;
  reportId?: string;
  statusHistory?: LabOrderStatusHistoryDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AcceptLabOrderDto {
  notes?: string;
}

export interface RejectLabOrderDto {
  reasonCode: OrderRejectionReason;
  reason: string;
}

export interface ClarificationLabOrderDto {
  notes: string;
}

export interface AssignTestDto {
  testCode: string;
  department?: string;
  technicianId?: string;
  priority?: LabOrderPriority;
  notes?: string;
}

export interface LaboratoryOrderFilterDto {
  search?: string;
  status?: string;
  priority?: LabOrderPriority;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// 5. SAMPLE MANAGEMENT, BARCODE & ACCESSIONING DTOS
// ============================================================================

export interface SampleTimelineEventDto {
  id?: string;
  eventType: string; // 'REGISTERED' | 'BARCODE_GENERATED' | 'COLLECTED' | 'DISPATCHED' | 'RECEIVED' | 'ACCESSIONED' | 'REJECTED' | 'RECOLLECTION_REQUESTED' | 'PROCESSING_STARTED'
  previousStatus?: string;
  newStatus: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  reason?: string;
  notes?: string;
}

export interface LabSampleDto {
  id: string;
  sampleNumber: string; // Unique human-readable reference e.g. SMP-2026-0001
  barcode: string;      // Opaque unique barcode reference e.g. BC128-SMP-2026-XXXXX
  orderId: string;
  orderNumber: string;
  laboratoryId: string;
  patientId: string;
  patientName?: string;
  testCodes: string[];
  specimenType: SpecimenType;
  collectionMethod?: string;
  containerType?: string;
  status: LabSampleStatus;
  collectionCenterId?: string;
  collectionCenterName?: string;
  collectedAt?: string;
  collectedById?: string;
  collectedByName?: string;
  receivedAt?: string;
  receivedById?: string;
  receivedByName?: string;
  accessionedAt?: string;
  accessionedById?: string;
  accessionedByName?: string;
  rejectionReasonCode?: SampleRejectionReason;
  rejectionReason?: string;
  recollectionRequested?: boolean;
  notes?: string;
  events?: SampleTimelineEventDto[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterSampleCollectionDto {
  orderId: string;
  specimenType: SpecimenType;
  testCodes: string[];
  collectionMethod?: string;
  containerType?: string;
  collectionCenterId?: string;
  collectedAt?: string;
  notes?: string;
}

export interface SampleAccessioningDto {
  barcode: string;
  receivedAt?: string;
  notes?: string;
}

export interface SampleRejectionDto {
  reasonCode: SampleRejectionReason;
  explanation: string;
  requestRecollection?: boolean;
}

export interface LabSampleFilterDto {
  search?: string;
  status?: LabSampleStatus;
  specimenType?: SpecimenType;
  orderId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LabSampleSummaryDto {
  totalSamples: number;
  collectionPending: number;
  collected: number;
  received: number;
  accessioned: number;
  processing: number;
  completed: number;
  rejected: number;
}

export interface PrintableSampleLabelDto {
  sampleNumber: string;
  barcode: string;
  specimenType: SpecimenType;
  orderNumber: string;
  collectedAt: string;
  laboratoryName: string;
  patientIdentifier: string; // Opaque minimal identifier (e.g. PT-XXX or initials)
}

// ============================================================================
// 6. WORKLISTS, RESULT ENTRY, FLAGS & QUALITY CONTROL DTOS
// ============================================================================

export interface ProcessingWorklistItemDto {
  id: string;
  orderId: string;
  orderNumber: string;
  sampleId: string;
  sampleNumber: string;
  barcode: string;
  testId?: string;
  testCode: string;
  testName: string;
  category: LabTestCategory;
  specimenType: SpecimenType;
  priority: LabOrderPriority;
  status: TestResultStatus;
  assignedDepartment?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  sampleReceivedAt?: string;
  processingStartedAt?: string;
  createdAt: string;
}

export interface ParameterResultEntryDto {
  parameterId?: string;
  parameterCode: string;
  parameterName: string;
  dataType: ParameterDataType;
  numericValue?: number;
  textValue?: string;
  booleanValue?: boolean;
  qualitativeValue?: string;
  unit?: string;
  referenceRangeSnapshot?: ReferenceRangeDto;
  flag: ResultFlag;
  isAbnormal: boolean;
  isCritical: boolean;
  notes?: string;
}

export interface TestResultDto {
  id: string;
  laboratoryId: string;
  orderId: string;
  orderNumber: string;
  sampleId: string;
  sampleNumber: string;
  testId?: string;
  testCode: string;
  testName: string;
  parameters: ParameterResultEntryDto[];
  overallFlag: ResultFlag;
  hasAbnormalResults: boolean;
  hasCriticalResults: boolean;
  status: TestResultStatus;
  enteredById: string;
  enteredByName?: string;
  enteredAt: string;
  updatedById?: string;
  updatedByName?: string;
  updatedAt: string;
  processingNotes?: {
    actorName: string;
    timestamp: string;
    note: string;
    category?: 'DELAY' | 'INSTRUMENT' | 'SAMPLE_QUALITY' | 'REPEAT_REQUEST' | 'QC_ISSUE' | 'GENERAL';
  }[];
}

export interface SaveResultDraftDto {
  orderId: string;
  sampleId: string;
  testCode: string;
  parameters: {
    parameterCode: string;
    parameterName: string;
    dataType: ParameterDataType;
    numericValue?: number;
    textValue?: string;
    booleanValue?: boolean;
    qualitativeValue?: string;
    unit?: string;
    notes?: string;
  }[];
  processingNotes?: string;
}

export interface SubmitResultDto {
  notes?: string;
}

export interface AddProcessingNoteDto {
  note: string;
  category?: 'DELAY' | 'INSTRUMENT' | 'SAMPLE_QUALITY' | 'REPEAT_REQUEST' | 'QC_ISSUE' | 'GENERAL';
}

export interface CriticalResultEventDto {
  id: string;
  laboratoryId: string;
  orderId: string;
  orderNumber: string;
  sampleId: string;
  testCode: string;
  parameterCode: string;
  parameterName: string;
  observedValue: string;
  criticalThreshold: string;
  timestamp: string;
  isAcknowledged: boolean;
  acknowledgedById?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  acknowledgementNotes?: string;
}

// Quality Control DTOs
export interface QCMaterialDto {
  id: string;
  laboratoryId: string;
  materialName: string;
  manufacturer: string;
  lotNumber: string;
  expiryDate: string;
  targetTestCode: string;
  targetTestName: string;
  instrumentName?: string;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  unit?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateQCMaterialDto {
  materialName: string;
  manufacturer: string;
  lotNumber: string;
  expiryDate: string;
  targetTestCode: string;
  targetTestName: string;
  instrumentName?: string;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  unit?: string;
  isActive?: boolean;
}

export interface LegacyQCRunDto {
  id: string;
  laboratoryId: string;
  materialId: string;
  materialName: string;
  testCode: string;
  observedValue: number;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  unit?: string;
  qcStatus: QCStatus;
  runDate: string;
  performedById: string;
  performedByName: string;
  instrumentName?: string;
  notes?: string;
  createdAt: string;
}

export interface RecordQCRunDto {
  materialId: string;
  observedValue: number;
  instrumentName?: string;
  notes?: string;
}

// ============================================================================
// 7. DASHBOARD ANALYTICS & ACTIVITY DTOS
// ============================================================================

export interface LaboratoryDashboardSummaryDto {
  totalActiveTests: number;
  newOrders: number;
  pendingOrderReviews: number;
  acceptedOrders: number;
  samplesAwaitingCollection: number;
  samplesReceived: number;
  samplesAccessioned: number;
  activeWorklistItems: number;
  resultsDraftCount: number;
  resultsSubmittedCount: number;
  criticalAlertsCount: number;
  completedOrders: number;
  recentOrders: LaboratoryOrderDto[];
  testCatalogueSummary: {
    category: LabTestCategory;
    count: number;
  }[];
}

export interface LaboratoryActivityDto {
  id: string;
  action: string;
  description: string;
  actorName: string;
  timestamp: string;
  resourceType: string;
  resourceId?: string;
}
