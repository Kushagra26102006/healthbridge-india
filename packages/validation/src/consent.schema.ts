import { z } from 'zod';

export const consentPurposeCodeSchema = z.enum([
  'CAREMGT',
  'BTG',
  'PUBHLTH',
  'HPAYMT',
  'DSRCH',
  'PATRQT',
]);

export const dateRangeSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((data) => data.to >= data.from, {
    message: 'Date range "to" must be equal to or after "from"',
  });

export const createConsentRequestSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  requesterId: z.string().min(1, 'Requester ID is required'),
  requesterName: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  purpose: z.string().min(2, 'Consent purpose is required'),
  purposeDescription: z.string().trim().optional(),
  requestedDataTypes: z
    .array(z.string().trim().min(2))
    .min(1, 'At least one health record data type must be requested'),
  dateRange: dateRangeSchema,
  expiresAt: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Consent request expiry must be in the future',
  }),
});

export const approveConsentArtifactSchema = z.object({
  consentRequestId: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  requesterId: z.string().min(1, 'Requester ID is required'),
  purpose: z.string().min(2, 'Consent purpose is required'),
  permittedDataTypes: z
    .array(z.string().trim().min(2))
    .min(1, 'At least one health record data type must be permitted'),
  validityPeriod: dateRangeSchema,
  signature: z.string().optional(),
});

export const consentIdParamSchema = z.object({
  consentId: z.string().min(1, 'Consent ID is required'),
});

export const consentFilterQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.string().optional(),
  search: z.string().trim().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['requestedAt', 'expiresAt', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const approveConsentActionSchema = z.object({
  signature: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const rejectConsentActionSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const revokeConsentActionSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type CreateConsentRequestInput = z.infer<typeof createConsentRequestSchema>;
export type ApproveConsentArtifactInput = z.infer<typeof approveConsentArtifactSchema>;
export type ConsentIdParamInput = z.infer<typeof consentIdParamSchema>;
export type ConsentFilterQueryInput = z.infer<typeof consentFilterQuerySchema>;
export type ApproveConsentActionInput = z.infer<typeof approveConsentActionSchema>;
export type RejectConsentActionInput = z.infer<typeof rejectConsentActionSchema>;
export type RevokeConsentActionInput = z.infer<typeof revokeConsentActionSchema>;
