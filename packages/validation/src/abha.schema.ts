import { z } from 'zod';

/**
 * ABHA (Ayushman Bharat Health Account) Validation Schemas
 */

export const abhaNumberRegex = /^(?:\d{14}|\d{2}-\d{4}-\d{4}-\d{4})$/;
export const abhaAddressRegex = /^[a-zA-Z0-9._]{4,32}(?:@abdm)?$/;

export const abhaNumberSchema = z
  .string()
  .trim()
  .regex(abhaNumberRegex, 'ABHA number must be a 14-digit number (format: XX-XXXX-XXXX-XXXX or 14 continuous digits)');

export const abhaAddressSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(abhaAddressRegex, 'ABHA address must be 4-32 characters, alphanumeric or dot/underscore, ending in @abdm or plain identifier');

export const abhaOtpRequestSchema = z.object({
  identifier: z.string().min(4, 'Identifier must be at least 4 characters long'),
  authMethod: z.enum(['MOBILE_OTP', 'AADHAAR_OTP', 'PASSWORD', 'DEMOGRAPHICS']),
});

export const abhaOtpVerifySchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
});

export type AbhaOtpRequestInput = z.infer<typeof abhaOtpRequestSchema>;
export type AbhaOtpVerifyInput = z.infer<typeof abhaOtpVerifySchema>;

