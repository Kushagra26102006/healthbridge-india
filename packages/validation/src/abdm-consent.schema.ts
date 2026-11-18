/**
 * HealthBridge India — ABDM Consent Manager Validation Schemas (Day 7 Task 03)
 *
 * Strict Zod validation aligned with verified ABDM V3 HIE-CM specifications:
 * - Official Purpose Codes (`CAREMGT`, `BTG`, `PUBHLTH`, `HPAYMT`, `DSRCH`, `PATRQT`)
 * - Official Health Information Types (`hiTypes`)
 * - Official Permission semantics (`accessMode`, `dateRange`, `dataEraseAt`, `frequency`)
 */

import { z } from 'zod';
import { abdmHealthInfoTypes, abdmPurposeCodes } from './abdm.schema';

export const abdmConsentAccessModes = ['VIEW', 'STORE', 'QUERY', 'STREAM'] as const;

export const abdmConsentFrequencyUnits = ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'] as const;

export const abdmExternalConsentStatuses = [
  'REQUESTED',
  'GRANTED',
  'DENIED',
  'EXPIRED',
  'REVOKED',
] as const;

export const abdmConsentFrequencySchema = z.object({
  unit: z.enum(abdmConsentFrequencyUnits),
  value: z.number().int().min(1).max(365),
  repeats: z.number().int().min(0).max(100),
});

export const abdmConsentDateRangeSchema = z
  .object({
    from: z.string().datetime({ offset: true, message: 'dateRange.from must be ISO-8601 datetime' }),
    to: z.string().datetime({ offset: true, message: 'dateRange.to must be ISO-8601 datetime' }),
  })
  .refine((val) => new Date(val.from).getTime() <= new Date(val.to).getTime(), {
    message: 'dateRange.from must be earlier than or equal to dateRange.to',
    path: ['to'],
  });

export const createAbdmConsentRequestSchema = z
  .object({
    patientId: z.string().min(12, 'Valid patientId is required').max(64),
    patientAbhaAddress: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9][a-z0-9._-]{2,60}@(abdm|sbx)$/i, 'Valid ABHA address (@abdm or @sbx) required')
      .optional(),
    requestingParticipantId: z.string().trim().min(2).max(100).optional(),
    requestingOrganizationName: z.string().trim().min(2).max(160).optional(),
    purposeCode: z.enum(abdmPurposeCodes, {
      errorMap: () => ({
        message: 'Unsupported ABDM purpose code. Allowed: CAREMGT, BTG, PUBHLTH, HPAYMT, DSRCH, PATRQT',
      }),
    }),
    purposeText: z.string().trim().min(2).max(200).optional(),
    hiTypes: z
      .array(z.enum(abdmHealthInfoTypes))
      .min(1, 'At least one official ABDM HI-type must be requested')
      .max(7),
    accessMode: z.enum(abdmConsentAccessModes).default('VIEW'),
    dateRange: abdmConsentDateRangeSchema,
    dataEraseAt: z
      .string()
      .datetime({ offset: true, message: 'dataEraseAt must be a valid ISO-8601 datetime' }),
    frequency: abdmConsentFrequencySchema.default({
      unit: 'HOUR',
      value: 1,
      repeats: 0,
    }),
    expiresAt: z
      .string()
      .datetime({ offset: true, message: 'expiresAt must be a valid ISO-8601 datetime' })
      .optional(),
  })
  .refine(
    (data) => new Date(data.dataEraseAt).getTime() > Date.now(),
    {
      message: 'dataEraseAt must be in the future',
      path: ['dataEraseAt'],
    }
  )
  .refine(
    (data) => !data.expiresAt || new Date(data.expiresAt).getTime() > Date.now(),
    {
      message: 'expiresAt must be in the future',
      path: ['expiresAt'],
    }
  );

export const externalAbdmArtefactPayloadSchema = z.object({
  consentId: z.string().min(4).max(128),
  createdAt: z.string().datetime({ offset: true }),
  status: z.enum(abdmExternalConsentStatuses),
  signature: z.string().min(8).optional(),
  consentDetail: z.object({
    schemaVersion: z.string().optional(),
    consentId: z.string().min(4).max(128).optional(),
    createdAt: z.string().datetime({ offset: true }).optional(),
    purpose: z.object({
      code: z.enum(abdmPurposeCodes),
      text: z.string().min(1).max(200),
      refUri: z.string().url().optional(),
    }),
    patient: z.object({
      id: z.string().min(4).max(128),
    }),
    hip: z
      .object({
        id: z.string().min(2).max(100),
        name: z.string().max(200).optional(),
      })
      .optional(),
    hiu: z.object({
      id: z.string().min(2).max(100),
      name: z.string().max(200).optional(),
    }),
    consentManager: z
      .object({
        id: z.string().min(2).max(100),
      })
      .optional(),
    hiTypes: z.array(z.enum(abdmHealthInfoTypes)).min(1),
    permission: z.object({
      accessMode: z.enum(abdmConsentAccessModes),
      dateRange: abdmConsentDateRangeSchema,
      dataEraseAt: z.string().datetime({ offset: true }),
      frequency: abdmConsentFrequencySchema.optional(),
    }),
    careContexts: z
      .array(
        z.object({
          patientReference: z.string().min(1),
          careContextReference: z.string().min(1),
        })
      )
      .optional(),
  }),
});

export const revokeAbdmConsentSchema = z.object({
  reason: z.string().trim().min(3, 'Please provide a brief revocation reason').max(500),
});

export const validateAbdmConsentAccessSchema = z.object({
  patientId: z.string().min(12).max(64),
  participantId: z.string().min(2).max(100).optional(),
  externalConsentId: z.string().min(4).max(128).optional(),
  artefactId: z.string().min(4).max(128).optional(),
  requestedHiType: z.enum(abdmHealthInfoTypes),
  requestedPurposeCode: z.enum(abdmPurposeCodes),
  recordDateIso: z.string().datetime({ offset: true }).optional(),
  requireExternalConfirmation: z.boolean().default(true),
});

export const abdmConsentSyncTriggerSchema = z.object({
  nearingExpiryHours: z.number().int().min(1).max(168).default(24),
  pollExternalStatus: z.boolean().default(true),
});

export type CreateAbdmConsentRequestInput = z.infer<typeof createAbdmConsentRequestSchema>;
export type ExternalAbdmArtefactPayloadInput = z.infer<typeof externalAbdmArtefactPayloadSchema>;
export type RevokeAbdmConsentInput = z.infer<typeof revokeAbdmConsentSchema>;
export type ValidateAbdmConsentAccessInput = z.infer<typeof validateAbdmConsentAccessSchema>;
export type AbdmConsentSyncTriggerInput = z.infer<typeof abdmConsentSyncTriggerSchema>;
