/**
 * HealthBridge India — Laboratory Validation Schemas
 * Comprehensive Zod schemas for Laboratory Profiles, Diagnostic Tests, Orders,
 * Samples, Accessioning, Result Entry, and Quality Control.
 */

import { z } from 'zod';

// ============================================================================
// 1. CONSTANTS & ENUMS
// ============================================================================

export const labTestCategories = [
  'HEMATOLOGY',
  'BIOCHEMISTRY',
  'CLINICAL_PATHOLOGY',
  'MICROBIOLOGY',
  'SEROLOGY',
  'IMMUNOLOGY',
  'MOLECULAR_DIAGNOSTICS',
  'RADIOLOGY',
  'BLOOD_TESTS',
  'URINE_TESTS',
  'IMAGING',
  'OTHER',
] as const;

export const specimenTypes = [
  'BLOOD',
  'SERUM',
  'PLASMA',
  'URINE',
  'STOOL',
  'SWAB',
  'SPUTUM',
  'CSF',
  'BIOPSY',
  'OTHER',
] as const;

export const labOrderPriorities = ['ROUTINE', 'URGENT', 'STAT', 'EMERGENCY'] as const;

export const labSampleStatuses = [
  'COLLECTION_PENDING',
  'COLLECTED',
  'IN_TRANSIT',
  'RECEIVED',
  'ACCESSIONED',
  'REJECTED',
  'PROCESSING',
  'COMPLETED',
] as const;

export const labFacilityTypes = [
  'CLINICAL_LAB',
  'PATHOLOGY_LAB',
  'DIAGNOSTIC_CENTER',
  'HOSPITAL_LAB',
  'COLLECTION_CENTER',
] as const;

export const laboratoryDocumentTypes = [
  'REGISTRATION_CERTIFICATE',
  'CLINICAL_ESTABLISHMENT_LICENSE',
  'NABL_ACCREDITATION',
  'ICMR_APPROVAL',
  'POLLUTION_CONTROL_NOC',
  'BIO_MEDICAL_WASTE_CERTIFICATE',
  'OTHER',
] as const;

export const orderRejectionReasons = [
  'TEST_NOT_AVAILABLE',
  'INVALID_ORDER',
  'INSUFFICIENT_INFORMATION',
  'FACILITY_UNAVAILABLE',
  'SPECIMEN_REQUIREMENT_UNSUPPORTED',
  'OTHER',
] as const;

export const sampleRejectionReasons = [
  'UNLABELLED_SAMPLE',
  'INCORRECT_SPECIMEN',
  'INSUFFICIENT_QUANTITY',
  'DAMAGED_CONTAINER',
  'LEAKAGE',
  'EXPIRED_STABILITY_WINDOW',
  'DUPLICATE_SAMPLE',
  'TRANSPORT_CONDITION_FAILURE',
  'OTHER',
] as const;

export const parameterDataTypes = [
  'NUMERIC',
  'TEXT',
  'BOOLEAN',
  'QUALITATIVE',
  'DATE',
] as const;

export const qcStatuses = [
  'ACCEPTABLE',
  'OUT_OF_RANGE',
  'INVALID',
  'PENDING_REVIEW',
] as const;

// ============================================================================
// 2. LABORATORY PROFILE SCHEMAS
// ============================================================================

export const updateLaboratoryProfileSchema = z.object({
  laboratoryName: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().regex(/^[0-9+\s-]{8,20}$/).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  address: z
    .object({
      street: z.string().min(3).max(200).optional(),
      city: z.string().min(2).max(100).optional(),
      state: z.string().min(2).max(100).optional(),
      postalCode: z.string().regex(/^[1-9][0-9]{5}$/).optional(),
      country: z.string().min(2).max(100).optional(),
      coordinates: z
        .object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
        .optional(),
    })
    .optional(),
  registrationNumber: z.string().max(100).optional(),
  licenseIssueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  licenseExpiryDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  issuingAuthority: z.string().max(200).optional(),
  accreditationInfo: z
    .object({
      nablAccredited: z.boolean().optional(),
      nablCertificateNumber: z.string().max(100).optional(),
      nablExpiryDate: z.string().optional(),
      capAccredited: z.boolean().optional(),
      icmrApproved: z.boolean().optional(),
      isoCertified: z.boolean().optional(),
    })
    .optional(),
  facilityName: z.string().min(2).max(100).optional(),
  facilityType: z.enum(labFacilityTypes).optional(),
  supportedDiagnosticServices: z.array(z.string()).optional(),
  operatingHours: z
    .array(
      z.object({
        dayOfWeek: z.string(),
        isOpen: z.boolean(),
        is24Hours: z.boolean(),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      })
    )
    .optional(),
  // Strict Tamper Detection: recognizing these fields allows backend to reject self-approval
  verificationStatus: z.any().optional(),
  documentSubmissionStatus: z.any().optional(),
});

export const uploadLaboratoryDocumentSchema = z.object({
  documentType: z.enum(laboratoryDocumentTypes),
  documentNumber: z.string().min(2).max(100),
  documentUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive().max(10 * 1024 * 1024), // Max 10MB
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
});

export const laboratoryDocumentIdParamSchema = z.object({
  documentId: z.string().min(1),
});

// ============================================================================
// 3. COLLECTION CENTER SCHEMAS
// ============================================================================

export const createCollectionCenterSchema = z.object({
  name: z.string().min(2).max(150),
  address: z.object({
    street: z.string().min(3).max(200),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    postalCode: z.string().regex(/^[1-9][0-9]{5}$/),
    country: z.string().default('India'),
  }),
  contactPhone: z.string().regex(/^[0-9+\s-]{8,20}$/),
  contactEmail: z.string().email().optional(),
  contactPerson: z.string().max(100).optional(),
  operatingHours: z.string().max(150).optional(),
  collectionServices: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const updateCollectionCenterSchema = createCollectionCenterSchema.partial();

export const collectionCenterIdParamSchema = z.object({
  centerId: z.string().min(1),
});

// ============================================================================
// 4. DIAGNOSTIC TEST CATALOGUE & PARAMETER SCHEMAS
// ============================================================================

export const referenceRangeSchema = z.object({
  id: z.string().optional(),
  gender: z.enum(['ALL', 'MALE', 'FEMALE']).default('ALL'),
  ageMinYears: z.number().min(0).max(150).optional(),
  ageMaxYears: z.number().min(0).max(150).optional(),
  normalMin: z.number().optional(),
  normalMax: z.number().optional(),
  criticalLow: z.number().optional(),
  criticalHigh: z.number().optional(),
  unit: z.string().min(1).max(50),
  textualInterpretation: z.string().max(500).optional(),
  version: z.number().int().positive().default(1),
  effectiveDate: z.string().optional(),
  source: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
});

export const createTestParameterSchema = z.object({
  parameterName: z.string().min(2).max(150),
  parameterCode: z.string().min(2).max(50).toUpperCase(),
  dataType: z.enum(parameterDataTypes),
  unit: z.string().max(50).optional(),
  decimalPrecision: z.number().int().min(0).max(6).optional(),
  qualitativeOptions: z.array(z.string().min(1).max(100)).optional(),
  referenceRanges: z.array(referenceRangeSchema).default([]),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateTestParameterSchema = createTestParameterSchema.partial();

export const createLabTestSchema = z.object({
  testName: z.string().min(2).max(200),
  testCode: z.string().min(2).max(50).toUpperCase(),
  category: z.enum(labTestCategories),
  description: z.string().max(2000).optional(),
  specimenType: z.enum(specimenTypes),
  collectionMethod: z.string().max(200).optional(),
  preparationInstructions: z.string().max(2000).optional(),
  containerRequirements: z.string().max(200).optional(),
  fastingRequirement: z.boolean().default(false),
  fastingDurationHours: z.number().int().min(0).max(48).optional(),
  expectedTurnaroundTime: z.string().min(1).max(100),
  price: z.number().min(0),
  isActive: z.boolean().default(true),
  performingDepartment: z.string().max(100).optional(),
  parameters: z.array(createTestParameterSchema).optional(),
  referenceRanges: z.array(referenceRangeSchema).optional(),
});

export const updateLabTestSchema = createLabTestSchema.partial();

export const labTestFilterQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(labTestCategories).optional(),
  specimenType: z.enum(specimenTypes).optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().default(1))
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100).default(20))
    .optional(),
  sortBy: z.string().default('testName').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

export const labTestIdParamSchema = z.object({
  testId: z.string().min(1),
});

// ============================================================================
// 5. LABORATORY ORDER REVIEW & TEST ASSIGNMENT SCHEMAS
// ============================================================================

export const acceptLabOrderSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const rejectLabOrderSchema = z.object({
  reasonCode: z.enum(orderRejectionReasons),
  reason: z.string().min(3).max(1000),
});

export const clarificationLabOrderSchema = z.object({
  notes: z.string().min(5).max(2000),
});

export const assignTestSchema = z.object({
  testCode: z.string().min(1),
  department: z.string().max(100).optional(),
  technicianId: z.string().optional(),
  priority: z.enum(labOrderPriorities).optional(),
  notes: z.string().max(500).optional(),
});

export const laboratoryOrderFilterQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(labOrderPriorities).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().default(1))
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100).default(20))
    .optional(),
  sortBy: z.string().default('orderedAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export const laboratoryOrderIdParamSchema = z.object({
  orderId: z.string().min(1),
});

// ============================================================================
// 6. SAMPLE COLLECTION & ACCESSIONING SCHEMAS
// ============================================================================

export const registerSampleCollectionSchema = z.object({
  orderId: z.string().min(1),
  specimenType: z.enum(specimenTypes),
  testCodes: z.array(z.string().min(1)).min(1),
  collectionMethod: z.string().max(200).optional(),
  containerType: z.string().max(100).optional(),
  collectionCenterId: z.string().optional(),
  collectedAt: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)).optional(),
  notes: z.string().max(1000).optional(),
});

export const sampleAccessioningSchema = z.object({
  barcode: z.string().min(3).max(100),
  receivedAt: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)).optional(),
  notes: z.string().max(1000).optional(),
});

export const sampleRejectionSchema = z.object({
  reasonCode: z.enum(sampleRejectionReasons),
  explanation: z.string().min(3).max(1000),
  requestRecollection: z.boolean().default(false),
});

export const barcodeParamSchema = z.object({
  barcode: z.string().min(1),
});

export const labSampleFilterQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(labSampleStatuses).optional(),
  specimenType: z.enum(specimenTypes).optional(),
  orderId: z.string().optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().default(1))
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100).default(20))
    .optional(),
  sortBy: z.string().default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export const labSampleIdParamSchema = z.object({
  sampleId: z.string().min(1),
});

// ============================================================================
// 7. RESULT ENTRY & QUALITY CONTROL SCHEMAS
// ============================================================================

export const parameterResultInputSchema = z.object({
  parameterCode: z.string().min(1),
  parameterName: z.string().min(1),
  dataType: z.enum(parameterDataTypes),
  numericValue: z.number().optional(),
  textValue: z.string().max(2000).optional(),
  booleanValue: z.boolean().optional(),
  qualitativeValue: z.string().max(100).optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const saveResultDraftSchema = z.object({
  orderId: z.string().min(1),
  sampleId: z.string().min(1),
  testCode: z.string().min(1),
  parameters: z.array(parameterResultInputSchema).min(1),
  processingNotes: z.string().max(1000).optional(),
});

export const submitResultSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const addProcessingNoteSchema = z.object({
  note: z.string().min(3).max(2000),
  category: z
    .enum(['DELAY', 'INSTRUMENT', 'SAMPLE_QUALITY', 'REPEAT_REQUEST', 'QC_ISSUE', 'GENERAL'])
    .default('GENERAL'),
});

export const acknowledgeCriticalResultSchema = z.object({
  notes: z.string().min(3).max(1000),
});

export const createQCMaterialSchema = z.object({
  materialName: z.string().min(2).max(150),
  manufacturer: z.string().min(2).max(150),
  lotNumber: z.string().min(2).max(100),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetTestCode: z.string().min(1).max(50).toUpperCase(),
  targetTestName: z.string().min(2).max(150),
  instrumentName: z.string().max(150).optional(),
  targetValue: z.number().optional(),
  acceptableMin: z.number().optional(),
  acceptableMax: z.number().optional(),
  unit: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

export const recordQCRunSchema = z.object({
  materialId: z.string().min(1),
  observedValue: z.number(),
  instrumentName: z.string().max(150).optional(),
  notes: z.string().max(1000).optional(),
});

export const qcMaterialIdParamSchema = z.object({
  materialId: z.string().min(1),
});

export const qcRunFilterQuerySchema = z.object({
  materialId: z.string().optional(),
  testCode: z.string().optional(),
  qcStatus: z.enum(qcStatuses).optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().default(1))
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100).default(20))
    .optional(),
});

// ============================================================================
// 8. REPORT GENERATION, REVIEW, APPROVAL, PUBLICATION & AMENDMENT SCHEMAS
// ============================================================================

export const labReportStatuses = [
  'DRAFT',
  'GENERATED',
  'PENDING_REVIEW',
  'UNDER_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'AMENDED',
  'CANCELLED',
  'COMPLETED',
  'PENDING',
  'PRELIMINARY',
] as const;

export const reportReviewDecisions = [
  'APPROVED',
  'REJECTED',
  'CORRECTION_REQUESTED',
] as const;

export const generateReportDraftSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  testCodes: z.array(z.string().min(1).toUpperCase()).optional(),
  clinicalNotes: z.string().max(3000).optional(),
  interpretation: z.string().max(5000).optional(),
});

export const submitReportForReviewSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const reviewReportSchema = z.object({
  decision: z.enum(reportReviewDecisions),
  comments: z.string().min(3, 'Review comments/justification is required').max(3000),
});

export const approveReportSchema = z.object({
  comments: z.string().max(2000).optional(),
  designation: z.string().max(150).optional(),
  registrationNumber: z.string().max(100).optional(),
});

export const publishReportSchema = z.object({
  publicationNotes: z.string().max(1000).optional(),
});

export const requestAmendmentSchema = z.object({
  amendmentReason: z
    .string()
    .min(5, 'Specific statutory amendment reason is required')
    .max(500),
  explanation: z
    .string()
    .min(10, 'Detailed clinical explanation of changes is required')
    .max(3000),
  changedResultCodes: z.array(z.string().min(1).toUpperCase()).optional(),
});

export const labReportFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  laboratoryId: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().default(1))
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100).default(20))
    .optional(),
  sortBy: z.enum(['reportDate', 'testDate', 'createdAt', 'publishedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type GenerateReportDraftInput = z.infer<typeof generateReportDraftSchema>;
export type SubmitReportForReviewInput = z.infer<typeof submitReportForReviewSchema>;
export type ReviewReportInput = z.infer<typeof reviewReportSchema>;
export type ApproveReportInput = z.infer<typeof approveReportSchema>;
export type PublishReportInput = z.infer<typeof publishReportSchema>;
export type RequestAmendmentInput = z.infer<typeof requestAmendmentSchema>;
export type LabReportFilterInput = z.infer<typeof labReportFilterSchema>;

