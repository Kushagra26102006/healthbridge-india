import { z } from 'zod';
import { USER_ROLES, ACCOUNT_STATUSES } from '@healthbridge/shared-types';

export const userRoleSchema = z.enum(USER_ROLES as [string, ...string[]]);

export const accountStatusSchema = z.enum(ACCOUNT_STATUSES as [string, ...string[]]);

export const userRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one numeric digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: userRoleSchema.default('PATIENT'),
});

export const userLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;

