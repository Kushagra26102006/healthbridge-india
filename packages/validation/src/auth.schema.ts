import { z } from 'zod';
import { USER_ROLES } from '@healthbridge/shared-types';

/**
 * Authentication and User Validation Schemas for HealthBridge India
 */

export const userRoleEnum = z.enum(USER_ROLES as [string, ...string[]]);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one numeric digit')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerValidationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(100, 'Full name cannot exceed 100 characters'),
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: userRoleEnum.default('PATIENT'),
    adminRegistrationKey: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      // Disallow public administrator registration without administrative key
      if (data.role === 'ADMIN') {
        return !!data.adminRegistrationKey && data.adminRegistrationKey.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Public administrator registration is disabled. Administrative key required.',
      path: ['adminRegistrationKey'],
    }
  );

export const loginValidationSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Identifier must be at least 3 characters long')
    .refine(
      (val) => /^\S+@\S+\.\S+$/.test(val) || /^[6-9]\d{9}$/.test(val),
      'Identifier must be a valid email address or 10-digit Indian mobile number'
    ),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordValidationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

export const resetPasswordValidationSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyEmailValidationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const resendVerificationValidationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

// Backward-compatibility aliases
export const registerUserSchema = registerValidationSchema;
export const loginUserSchema = loginValidationSchema;

export type RegisterValidationInput = z.infer<typeof registerValidationSchema>;
export type LoginValidationInput = z.infer<typeof loginValidationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordValidationSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordValidationSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailValidationSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationValidationSchema>;
