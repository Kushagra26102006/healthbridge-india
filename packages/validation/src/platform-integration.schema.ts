/**
 * HealthBridge India — Platform-Wide Integration Zod Validation Schemas (Day 8 Task 01)
 */

import { z } from 'zod';

const objectIdString = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ObjectId');

const isoDateOptional = z
  .string()
  .trim()
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: 'Must be a valid ISO-8601 date string',
  })
  .optional();

export const unifiedPatientTimelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  eventType: z
    .enum([
      'PATIENT_REGISTERED',
      'APPOINTMENT_BOOKED',
      'APPOINTMENT_COMPLETED',
      'CLINICAL_ENCOUNTER',
      'DIAGNOSIS_RECORDED',
      'PRESCRIPTION_ISSUED',
      'PRESCRIPTION_DISPENSED',
      'LAB_ORDER_CREATED',
      'SAMPLE_COLLECTED',
      'TEST_COMPLETED',
      'LAB_REPORT_PUBLISHED',
      'LAB_REPORT_AMENDED',
      'DOCUMENT_UPLOADED',
      'CONSENT_GRANTED',
      'CONSENT_REVOKED',
      'EXTERNAL_RECORD_IMPORTED',
    ])
    .optional(),
  sourceModule: z
    .enum([
      'PATIENT',
      'APPOINTMENTS',
      'ENCOUNTERS',
      'PRESCRIPTIONS',
      'PHARMACY',
      'LABORATORY',
      'RECORDS',
      'CONSENT',
      'ABDM',
    ])
    .optional(),
  fromDate: isoDateOptional,
  toDate: isoDateOptional,
  search: z.string().trim().max(120).optional(),
});

export const doctorWorkspaceOverviewQuerySchema = z.object({
  fromDate: isoDateOptional,
  toDate: isoDateOptional,
});

export const createDoctorLabOrderSchema = z.object({
  patientId: objectIdString,
  encounterId: objectIdString.optional(),
  laboratoryId: objectIdString.optional(),
  facilityId: objectIdString.optional(),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT', 'EMERGENCY']).default('ROUTINE'),
  requestedCollectionDate: isoDateOptional,
  clinicalNotes: z.string().trim().max(2000).optional(),
  idempotencyKey: z.string().trim().min(4).max(120).optional(),
  tests: z
    .array(
      z.object({
        testCode: z.string().trim().min(1).max(60),
        testName: z.string().trim().min(2).max(200),
        category: z.string().trim().max(80).optional(),
        specimenType: z.string().trim().max(80).optional(),
        instructions: z.string().trim().max(500).optional(),
      })
    )
    .min(1)
    .max(25),
});
