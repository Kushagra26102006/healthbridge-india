import { z } from 'zod';

/**
 * Authentication and User Validation Schemas
 */

export const userRoleEnum = z.enum([
  'PATIENT',
  'DOCTOR',
  'HOSPITAL_ADMIN',
  'PHARMACIST',
  'DIAGNOSTIC_LAB',
  'SUPER_ADMIN',
]);

export const registerUserSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(1, 'Last name must be at least 1 character').max(50),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: userRoleEnum.default('PATIENT'),
});

export const loginUserSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;

