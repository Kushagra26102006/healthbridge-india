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

export type CreateConsentRequestInput = z.infer<typeof createConsentRequestSchema>;
export type ApproveConsentArtifactInput = z.infer<typeof approveConsentArtifactSchema>;
