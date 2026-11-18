/**
 * HealthBridge India — Domain Event Payload & Admin API Zod Schemas (Day 8 Task 03)
 *
 * STRICT PRIVACY CONTRACT:
 *   All domain event payloads use `.strict()` and permit ONLY identifiers, statuses,
 *   timestamps, and safe operational metadata. Sensitive medical details (diagnoses,
 *   prescription text, lab values, ABHA/Aadhaar numbers, tokens) are rejected at validation time.
 */

import { z } from 'zod';

export const DOMAIN_EVENT_TYPES = [
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_COMPLETED',
  'ENCOUNTER_STARTED',
  'ENCOUNTER_FINALIZED',
  'ENCOUNTER_AMENDED',
  'PRESCRIPTION_CREATED',
  'PRESCRIPTION_ISSUED',
  'PRESCRIPTION_CANCELLED',
  'PRESCRIPTION_DISPENSED',
  'PRESCRIPTION_PARTIALLY_DISPENSED',
  'STOCK_LOW',
  'STOCK_EXPIRED',
  'DISPENSING_COMPLETED',
  'PHARMACY_ORDER_UPDATED',
  'LAB_ORDER_CREATED',
  'LAB_ORDER_ACCEPTED',
  'SAMPLE_COLLECTED',
  'SAMPLE_REJECTED',
  'TEST_PROCESSING_STARTED',
  'TEST_COMPLETED',
  'REPORT_APPROVED',
  'REPORT_PUBLISHED',
  'REPORT_AMENDED',
  'CONSENT_GRANTED',
  'CONSENT_REVOKED',
  'ABHA_LINKED',
  'EXTERNAL_RECORD_IMPORTED',
  'ABDM_TRANSFER_COMPLETED',
] as const;

export const DOMAIN_EVENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PROCESSED',
  'RETRYING',
  'FAILED',
  'DEAD_LETTER',
] as const;

export const DOMAIN_EVENT_SOURCE_MODULES = [
  'APPOINTMENTS',
  'ENCOUNTERS',
  'PRESCRIPTIONS',
  'PHARMACY',
  'LABORATORY',
  'CONSENT',
  'ABDM',
  'PLATFORM',
  'SYSTEM',
] as const;

export const domainEventTypeSchema = z.enum(DOMAIN_EVENT_TYPES);
export const domainEventStatusSchema = z.enum(DOMAIN_EVENT_STATUSES);
export const domainEventSourceModuleSchema = z.enum(DOMAIN_EVENT_SOURCE_MODULES);

const safeIdSchema = z.string().trim().min(1).max(64);
const optionalSafeIdSchema = safeIdSchema.optional();
const isoDateStringSchema = z
  .string()
  .trim()
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: 'Must be a valid ISO-8601 date string',
  });
const optionalIsoDateStringSchema = isoDateStringSchema.optional();
const safeCodeSchema = z.string().trim().min(1).max(80).optional();

// 1. Appointment Event Schemas
const appointmentBasePayloadSchema = z
  .object({
    appointmentId: safeIdSchema,
    patientId: safeIdSchema,
    doctorId: safeIdSchema,
    facilityId: optionalSafeIdSchema,
    scheduledAt: optionalIsoDateStringSchema,
    previousScheduledAt: optionalIsoDateStringSchema,
    slotReleased: z.boolean().optional(),
    status: safeCodeSchema,
    encounterEligible: z.boolean().optional(),
  })
  .strict();

// 2. Encounter Event Schemas
const encounterPayloadSchema = z
  .object({
    encounterId: safeIdSchema,
    appointmentId: optionalSafeIdSchema,
    patientId: safeIdSchema,
    doctorId: safeIdSchema,
    encounterType: safeCodeSchema,
    status: safeCodeSchema,
    isDraft: z.boolean().optional(),
    finalizedAt: optionalIsoDateStringSchema,
    version: z.number().int().min(1).optional(),
  })
  .strict();

// 3. Prescription Event Schemas (No medication details/diagnoses in event payload)
const prescriptionPayloadSchema = z
  .object({
    prescriptionId: safeIdSchema,
    prescriptionNumber: safeCodeSchema,
    encounterId: optionalSafeIdSchema,
    patientId: safeIdSchema,
    doctorId: safeIdSchema,
    pharmacyId: optionalSafeIdSchema,
    dispensingId: optionalSafeIdSchema,
    status: safeCodeSchema,
    isDraft: z.boolean().optional(),
    medicationCount: z.number().int().min(0).max(50).optional(),
    remainingQuantityTotal: z.number().min(0).optional(),
    pharmacyDiscoverable: z.boolean().optional(),
    issuedAt: optionalIsoDateStringSchema,
  })
  .strict();

// 4. Pharmacy Event Schemas
const pharmacyStockPayloadSchema = z
  .object({
    pharmacyId: safeIdSchema,
    inventoryItemId: safeIdSchema,
    medicineId: optionalSafeIdSchema,
    batchCode: safeCodeSchema,
    currentQuantity: z.number().min(0).optional(),
    reorderThreshold: z.number().min(0).optional(),
    expiryDate: optionalIsoDateStringSchema,
    alertLevel: z.enum(['WARNING', 'CRITICAL']).optional(),
  })
  .strict();

const pharmacyDispensingPayloadSchema = z
  .object({
    dispensingId: safeIdSchema,
    prescriptionId: safeIdSchema,
    pharmacyId: safeIdSchema,
    patientId: safeIdSchema,
    dispensingStatus: z.enum(['PARTIALLY_DISPENSED', 'FULLY_DISPENSED', 'CANCELLED']),
    itemsDispensedCount: z.number().int().min(0).max(100),
    remainingQuantityTotal: z.number().min(0).optional(),
    stockDeductedAtomically: z.boolean().default(true),
    dispensedAt: optionalIsoDateStringSchema,
  })
  .strict();

const pharmacyOrderPayloadSchema = z
  .object({
    pharmacyOrderId: safeIdSchema,
    pharmacyId: safeIdSchema,
    patientId: optionalSafeIdSchema,
    prescriptionId: optionalSafeIdSchema,
    orderNumber: safeCodeSchema,
    previousStatus: safeCodeSchema,
    newStatus: safeCodeSchema,
  })
  .strict();

// 5. Laboratory Event Schemas (No numeric lab values or interpretation text in event payload)
const labOrderPayloadSchema = z
  .object({
    labOrderId: safeIdSchema,
    orderNumber: safeCodeSchema,
    laboratoryId: safeIdSchema,
    patientId: safeIdSchema,
    doctorId: optionalSafeIdSchema,
    encounterId: optionalSafeIdSchema,
    testCount: z.number().int().min(1).max(100).optional(),
    priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).optional(),
    status: safeCodeSchema,
  })
  .strict();

const labSamplePayloadSchema = z
  .object({
    sampleId: safeIdSchema,
    barcode: safeCodeSchema,
    labOrderId: safeIdSchema,
    laboratoryId: safeIdSchema,
    patientId: safeIdSchema,
    collectedByStaffId: optionalSafeIdSchema,
    status: safeCodeSchema,
    rejectionCode: safeCodeSchema,
    collectedAt: optionalIsoDateStringSchema,
  })
  .strict();

const labTestPayloadSchema = z
  .object({
    labOrderId: safeIdSchema,
    sampleId: optionalSafeIdSchema,
    laboratoryId: safeIdSchema,
    patientId: safeIdSchema,
    testId: optionalSafeIdSchema,
    status: safeCodeSchema,
  })
  .strict();

const labReportPayloadSchema = z
  .object({
    reportId: safeIdSchema,
    reportNumber: safeCodeSchema,
    labOrderId: optionalSafeIdSchema,
    laboratoryId: safeIdSchema,
    patientId: safeIdSchema,
    orderingDoctorId: optionalSafeIdSchema,
    approvedByStaffId: optionalSafeIdSchema,
    qcPassed: z.boolean().optional(),
    status: z.enum(['APPROVED', 'PUBLISHED', 'AMENDED']),
    version: z.number().int().min(1).default(1),
    previousVersion: z.number().int().min(1).optional(),
    publishedAt: optionalIsoDateStringSchema,
  })
  .strict();

// 6. Consent & ABDM Event Schemas (No ABHA/Aadhaar raw numbers or raw FHIR payloads!)
const consentPayloadSchema = z
  .object({
    consentId: safeIdSchema,
    patientId: safeIdSchema,
    requesterId: optionalSafeIdSchema,
    consentScope: z.enum(['INTERNAL', 'ABDM']).default('INTERNAL'),
    status: z.enum(['GRANTED', 'ACTIVE', 'REVOKED']),
    revokedSynchronously: z.boolean().optional(),
    effectiveAt: optionalIsoDateStringSchema,
  })
  .strict();

const abhaLinkedPayloadSchema = z
  .object({
    patientId: safeIdSchema,
    abhaLinkRecordId: safeIdSchema,
    verificationStatus: safeCodeSchema,
    linkedAt: optionalIsoDateStringSchema,
  })
  .strict();

const abdmExternalRecordPayloadSchema = z
  .object({
    importedRecordId: safeIdSchema,
    internalImportRef: safeCodeSchema,
    patientId: safeIdSchema,
    consentArtefactId: optionalSafeIdSchema,
    hiType: safeCodeSchema,
    sourceOrganizationId: optionalSafeIdSchema,
    isMocked: z.boolean().optional(),
    importedAt: optionalIsoDateStringSchema,
  })
  .strict();

const abdmTransferPayloadSchema = z
  .object({
    transferId: safeIdSchema,
    transactionId: safeCodeSchema,
    patientId: safeIdSchema,
    consentArtefactId: optionalSafeIdSchema,
    direction: z.enum(['HIP_OUTBOUND', 'HIU_INBOUND']),
    bundleCount: z.number().int().min(0).max(500).optional(),
    completedAt: optionalIsoDateStringSchema,
  })
  .strict();

export const DOMAIN_EVENT_PAYLOAD_SCHEMAS = {
  APPOINTMENT_BOOKED: appointmentBasePayloadSchema,
  APPOINTMENT_CONFIRMED: appointmentBasePayloadSchema,
  APPOINTMENT_RESCHEDULED: appointmentBasePayloadSchema,
  APPOINTMENT_CANCELLED: appointmentBasePayloadSchema,
  APPOINTMENT_COMPLETED: appointmentBasePayloadSchema,
  ENCOUNTER_STARTED: encounterPayloadSchema,
  ENCOUNTER_FINALIZED: encounterPayloadSchema,
  ENCOUNTER_AMENDED: encounterPayloadSchema,
  PRESCRIPTION_CREATED: prescriptionPayloadSchema,
  PRESCRIPTION_ISSUED: prescriptionPayloadSchema,
  PRESCRIPTION_CANCELLED: prescriptionPayloadSchema,
  PRESCRIPTION_DISPENSED: prescriptionPayloadSchema,
  PRESCRIPTION_PARTIALLY_DISPENSED: prescriptionPayloadSchema,
  STOCK_LOW: pharmacyStockPayloadSchema,
  STOCK_EXPIRED: pharmacyStockPayloadSchema,
  DISPENSING_COMPLETED: pharmacyDispensingPayloadSchema,
  PHARMACY_ORDER_UPDATED: pharmacyOrderPayloadSchema,
  LAB_ORDER_CREATED: labOrderPayloadSchema,
  LAB_ORDER_ACCEPTED: labOrderPayloadSchema,
  SAMPLE_COLLECTED: labSamplePayloadSchema,
  SAMPLE_REJECTED: labSamplePayloadSchema,
  TEST_PROCESSING_STARTED: labTestPayloadSchema,
  TEST_COMPLETED: labTestPayloadSchema,
  REPORT_APPROVED: labReportPayloadSchema,
  REPORT_PUBLISHED: labReportPayloadSchema,
  REPORT_AMENDED: labReportPayloadSchema,
  CONSENT_GRANTED: consentPayloadSchema,
  CONSENT_REVOKED: consentPayloadSchema,
  ABHA_LINKED: abhaLinkedPayloadSchema,
  EXTERNAL_RECORD_IMPORTED: abdmExternalRecordPayloadSchema,
  ABDM_TRANSFER_COMPLETED: abdmTransferPayloadSchema,
} as const;

export const eventAdminListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: domainEventStatusSchema.optional(),
  eventType: domainEventTypeSchema.optional(),
  sourceModule: domainEventSourceModuleSchema.optional(),
  from: optionalIsoDateStringSchema,
  to: optionalIsoDateStringSchema,
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const eventReplayBodySchema = z.object({
  reason: z
    .string({ required_error: 'An operational replay reason is required' })
    .trim()
    .min(5, 'Replay reason must be at least 5 characters')
    .max(240, 'Replay reason must not exceed 240 characters'),
});
