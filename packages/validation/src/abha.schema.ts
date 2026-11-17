import { z } from 'zod';

/**
 * ABHA (Ayushman Bharat Health Account) Validation Schemas — Day 7 Task 02
 * Aligned with official ABDM ABHA V3 formats (sandbox @sbx and production @abdm).
 */

export const abhaNumberRegex = /^(?:\d{14}|\d{2}-\d{4}-\d{4}-\d{4})$/;
export const abhaAddressRegex = /^[a-zA-Z0-9._]{4,32}(?:@(?:abdm|sbx))?$/;
export const aadhaarNumberRegex = /^\d{12}$/;
export const indianMobileRegex = /^[6-9]\d{9}$/;

export const abhaNumberSchema = z
  .string()
  .trim()
  .regex(
    abhaNumberRegex,
    'ABHA number must be a 14-digit number (format: XX-XXXX-XXXX-XXXX or 14 continuous digits)'
  );

export const abhaAddressSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    abhaAddressRegex,
    'ABHA address must be 4-32 characters (letters, digits, dot, underscore), optionally ending in @sbx or @abdm'
  );

export const abhaOtpRequestSchema = z.object({
  identifier: z.string().min(4, 'Identifier must be at least 4 characters long'),
  authMethod: z.enum(['MOBILE_OTP', 'AADHAAR_OTP', 'PASSWORD', 'DEMOGRAPHICS']),
});

export const abhaOtpVerifySchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
});

// ============================================================================
// DAY 7 TASK 02 — VERIFIED ABHA V3 WORKFLOW SCHEMAS
// ============================================================================

export const abhaCreationInitiateSchema = z.object({
  method: z.literal('AADHAAR_OTP', {
    errorMap: () => ({
      message: 'Only official ABHA V3 Aadhaar OTP creation (byAadhaar) is currently supported.',
    }),
  }),
  aadhaarNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ''))
    .refine((v) => aadhaarNumberRegex.test(v), {
      message: 'Aadhaar number must be exactly 12 numeric digits (synthetic sandbox values only).',
    }),
  patientConsentConfirmed: z.literal(true, {
    errorMap: () => ({
      message: 'Explicit patient authorization is required before initiating ABHA creation.',
    }),
  }),
});

export const abhaCreationCompleteSchema = z.object({
  internalTransactionId: z.string().uuid('Valid internal transaction ID is required'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
  mobileNumber: z
    .string()
    .trim()
    .regex(indianMobileRegex, 'Mobile number must be a valid 10-digit Indian mobile number')
    .optional(),
  consentAccepted: z.literal(true, {
    errorMap: () => ({
      message: 'ABHA enrolment consent (code: abha-enrollment, v1.4) must be explicitly accepted.',
    }),
  }),
});

export const abhaNumberVerifyInitiateSchema = z.object({
  abhaNumber: abhaNumberSchema,
  otpSystem: z.enum(['abdm', 'aadhaar']).default('abdm'),
  patientConsentConfirmed: z.literal(true, {
    errorMap: () => ({
      message: 'Explicit patient authorization is required before verifying ABHA number.',
    }),
  }),
});

export const abhaOtpConfirmSchema = z.object({
  internalTransactionId: z.string().uuid('Valid internal transaction ID is required'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
});

export const abhaAddressCheckSchema = z.object({
  abhaAddress: abhaAddressSchema,
});

export const abhaAddressCreateSchema = z.object({
  internalTransactionId: z.string().uuid('Valid internal transaction ID is required'),
  abhaAddress: abhaAddressSchema,
  preferred: z.boolean().optional().default(true),
});

export const abhaAddressVerifyInitiateSchema = z.object({
  abhaAddress: abhaAddressSchema,
  otpSystem: z.enum(['abdm', 'aadhaar']).default('abdm'),
  patientConsentConfirmed: z.literal(true, {
    errorMap: () => ({
      message: 'Explicit patient authorization is required before verifying ABHA address.',
    }),
  }),
});

export const abhaLinkConfirmSchema = z.object({
  internalTransactionId: z.string().uuid('Valid verified transaction ID is required'),
  patientConsentConfirmed: z.literal(true, {
    errorMap: () => ({
      message: 'Explicit patient consent for identity linking is required.',
    }),
  }),
  purposeAcknowledged: z.literal(true, {
    errorMap: () => ({
      message:
        'You must acknowledge that ABHA linking connects your identity only and does not share medical records.',
    }),
  }),
});

export const abhaUnlinkSchema = z.object({
  reason: z.string().trim().min(5, 'Please provide a brief reason (minimum 5 characters)').max(300),
  confirmUnlink: z.literal(true, {
    errorMap: () => ({
      message: 'Explicit confirmation is required to unlink your ABHA identity from HealthBridge.',
    }),
  }),
});

export type AbhaOtpRequestInput = z.infer<typeof abhaOtpRequestSchema>;
export type AbhaOtpVerifyInput = z.infer<typeof abhaOtpVerifySchema>;
export type AbhaCreationInitiateInput = z.infer<typeof abhaCreationInitiateSchema>;
export type AbhaCreationCompleteInput = z.infer<typeof abhaCreationCompleteSchema>;
export type AbhaNumberVerifyInitiateInput = z.infer<typeof abhaNumberVerifyInitiateSchema>;
export type AbhaOtpConfirmInput = z.infer<typeof abhaOtpConfirmSchema>;
export type AbhaAddressCheckInput = z.infer<typeof abhaAddressCheckSchema>;
export type AbhaAddressCreateInput = z.infer<typeof abhaAddressCreateSchema>;
export type AbhaAddressVerifyInitiateInput = z.infer<typeof abhaAddressVerifyInitiateSchema>;
export type AbhaLinkConfirmInput = z.infer<typeof abhaLinkConfirmSchema>;
export type AbhaUnlinkInput = z.infer<typeof abhaUnlinkSchema>;
