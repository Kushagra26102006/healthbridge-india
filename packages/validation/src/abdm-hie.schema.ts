/**
 * HealthBridge India — ABDM HIP / HIU Health Information Exchange Zod Schemas (Day 7 Task 04)
 */

import { z } from 'zod';

const abdmHiTypeSchema = z.enum([
  'OPConsultation',
  'Prescription',
  'DiagnosticReport',
  'DischargeSummary',
  'ImmunizationRecord',
  'HealthDocumentRecord',
  'WellnessRecord',
]);

const abdmPurposeCodeSchema = z.enum([
  'CAREMGT',
  'BTG',
  'PUBHLTH',
  'HPAYMT',
  'DSRCH',
  'PATRQT',
]);

const isoDateTimeSchema = z
  .string()
  .min(10)
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: 'Must be a valid ISO-8601 date/time string',
  });

export const abdmKeyMaterialSchema = z.object({
  cryptoAlg: z.literal('ECDH'),
  curve: z.literal('Curve25519'),
  dhPublicKey: z.object({
    expiry: isoDateTimeSchema,
    parameters: z.string().min(3).max(120),
    keyValue: z.string().min(16).max(1024),
  }),
  nonce: z.string().min(16).max(256),
});

export const initiateAbdmDiscoverySchema = z.object({
  participantId: z.string().trim().min(2).max(120),
  participantName: z.string().trim().min(2).max(200).optional(),
  requestedCategories: z.array(abdmHiTypeSchema).min(1).max(7),
  patientId: z.string().trim().min(8).max(64).optional(), // Ignored for PATIENT role; verified against JWT
  idempotencyKey: z.string().trim().min(4).max(120).optional(),
});

export const abdmDiscoveryCallbackSchema = z.object({
  eventId: z.string().trim().min(4).max(128),
  timestamp: isoDateTimeSchema,
  externalTransactionRef: z.string().trim().min(4).max(128),
  participantId: z.string().trim().min(2).max(120),
  status: z.enum(['DISCOVERY_COMPLETED', 'NO_MATCH_FOUND', 'FAILED']),
  careContexts: z
    .array(
      z.object({
        careContextReference: z.string().trim().min(1).max(128),
        display: z.string().trim().min(1).max(240),
        hiTypes: z.array(abdmHiTypeSchema).min(1),
        recordDate: isoDateTimeSchema.optional(),
        sourceCategory: z.string().trim().max(80).optional(),
      })
    )
    .default([]),
  errorReason: z.string().trim().max(500).optional(),
});

export const initiateAbdmRecordLinkingSchema = z.object({
  discoveryId: z.string().trim().min(8).max(64).optional(),
  participantId: z.string().trim().min(2).max(120),
  participantName: z.string().trim().min(2).max(200).optional(),
  careContextReference: z.string().trim().min(1).max(128),
  careContextDisplay: z.string().trim().min(1).max(240),
  hiTypes: z.array(abdmHiTypeSchema).min(1).max(7),
  linkMode: z.enum(['USER_INITIATED', 'HIP_INITIATED']).default('USER_INITIATED'),
  patientId: z.string().trim().min(8).max(64).optional(),
});

export const confirmAbdmRecordLinkingSchema = z.object({
  otpToken: z.string().trim().min(4).max(16).optional(),
  externalLinkRef: z.string().trim().min(2).max(128).optional(),
  confirmed: z.boolean().default(true),
  failureReason: z.string().trim().max(500).optional(),
});

export const unlinkAbdmRecordSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const initiateHiuHealthInfoRequestSchema = z.object({
  patientId: z.string().trim().min(8).max(64).optional(),
  consentArtefactId: z.string().trim().min(8).max(128),
  participantId: z.string().trim().min(2).max(120),
  hiTypes: z.array(abdmHiTypeSchema).min(1).max(7),
  purposeCode: abdmPurposeCodeSchema.default('CAREMGT'),
  dateRange: z.object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
  }),
  dataPushUrl: z.string().url().max(512).optional(),
});

export const incomingHipHealthInfoRequestSchema = z.object({
  externalTransactionId: z.string().trim().min(4).max(128),
  timestamp: isoDateTimeSchema,
  consentArtefactId: z.string().trim().min(4).max(128),
  hiuId: z.string().trim().min(2).max(120),
  hipId: z.string().trim().min(2).max(120).optional(),
  purposeCode: abdmPurposeCodeSchema.optional(),
  hiTypes: z.array(abdmHiTypeSchema).min(1).max(7).optional(),
  dateRange: z.object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
  }),
  dataPushUrl: z.string().url().max(512),
  keyMaterial: abdmKeyMaterialSchema,
});

export const hiuDataPushCallbackSchema = z.object({
  pageNumber: z.number().int().min(0).default(0),
  pageCount: z.number().int().min(1).max(100).default(1),
  transactionId: z.string().trim().min(4).max(128),
  timestamp: isoDateTimeSchema.optional(),
  sourceParticipantId: z.string().trim().min(2).max(120).optional(),
  sourceOrganizationName: z.string().trim().min(2).max(200).optional(),
  entries: z
    .array(
      z.object({
        content: z.string().min(1),
        media: z.string().default('application/fhir+json'),
        checksum: z.string().trim().max(128).optional(),
        careContextReference: z.string().trim().min(1).max(128),
        encrypted: z.boolean().default(true),
      })
    )
    .min(1)
    .max(50),
  keyMaterial: abdmKeyMaterialSchema.optional(),
});

export const abdmTransferAcknowledgementCallbackSchema = z.object({
  acknowledgementRef: z.string().trim().min(4).max(128),
  externalTransactionId: z.string().trim().min(4).max(128),
  role: z.enum(['HIP', 'HIU']),
  ackType: z.enum([
    'REQUEST_RECEIVED',
    'TRANSFER_INITIATED',
    'TRANSFER_ACCEPTED',
    'TRANSFER_COMPLETED',
    'TRANSFER_REJECTED',
    'TRANSFER_FAILED',
  ]),
  externalSessionStatus: z.enum([
    'REQUESTED',
    'ACKNOWLEDGED',
    'TRANSFERRED',
    'PARTIAL_TRANSFERRED',
    'RECEIVED',
    'FAILED',
    'EXPIRED',
    'UNKNOWN',
  ]),
  careContextStatuses: z
    .array(
      z.object({
        careContextReference: z.string().trim().min(1).max(128),
        hiStatus: z.enum(['OK', 'DELIVERED', 'ERRORED']),
        description: z.string().trim().max(500).optional(),
      })
    )
    .default([]),
  failureCategory: z.string().trim().max(120).optional(),
  timestamp: isoDateTimeSchema,
});

export const reviewAbdmImportedRecordSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reviewNotes: z.string().trim().min(3).max(1000),
});

export const generateHipFhirBundleSchema = z.object({
  patientId: z.string().trim().min(8).max(64),
  consentArtefactId: z.string().trim().min(8).max(128),
  hiType: abdmHiTypeSchema,
  dateRange: z
    .object({
      from: isoDateTimeSchema,
      to: isoDateTimeSchema,
    })
    .optional(),
});
