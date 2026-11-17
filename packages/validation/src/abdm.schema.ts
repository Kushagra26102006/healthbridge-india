/**
 * HealthBridge India — ABDM Integration Validation Schemas (Day 7 Task 01)
 */

import { z } from 'zod';

export const abdmEnvironmentValues = ['disabled', 'development', 'sandbox', 'production'] as const;

export const abdmHealthInfoTypes = [
  'DiagnosticReport',
  'Prescription',
  'OPConsultation',
  'DischargeSummary',
  'ImmunizationRecord',
  'HealthDocumentRecord',
  'WellnessRecord',
] as const;

export const abdmPurposeCodes = [
  'CAREMGT',
  'BTG',
  'PUBHLTH',
  'HPAYMT',
  'DSRCH',
  'PATRQT',
] as const;

export const abdmWebhookCallbackSchema = z.object({
  requestId: z
    .string({ required_error: 'ABDM callback requestId is required' })
    .min(8, 'requestId must be at least 8 characters')
    .max(128, 'requestId cannot exceed 128 characters'),
  timestamp: z
    .string({ required_error: 'ABDM callback ISO timestamp is required' })
    .datetime({ offset: true, message: 'timestamp must be a valid ISO-8601 datetime' }),
  eventType: z
    .string({ required_error: 'Callback eventType is required' })
    .min(2)
    .max(100),
  resp: z
    .object({
      requestId: z.string().min(8).max(128),
    })
    .optional(),
  error: z
    .object({
      code: z.union([z.number(), z.string()]),
      message: z.string().max(1000),
    })
    .optional(),
  payload: z.record(z.unknown()).optional(),
});

export const abdmFhirValidationRequestSchema = z.object({
  resource: z.record(z.unknown(), {
    required_error: 'FHIR resource JSON object is required',
  }),
  strictAbdmProfile: z.boolean().default(true),
});

export type AbdmWebhookCallbackInput = z.infer<typeof abdmWebhookCallbackSchema>;
export type AbdmFhirValidationRequestInput = z.infer<typeof abdmFhirValidationRequestSchema>;
