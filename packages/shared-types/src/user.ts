/**
 * HealthBridge India — User & Identity Types
 * One Nation One Health Record — ABHA Integrated Healthcare Platform
 */

export type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';

export const USER_ROLES: readonly UserRole[] = [
  'PATIENT',
  'DOCTOR',
  'PHARMACY',
  'LABORATORY',
  'ADMIN',
] as const;

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export const ACCOUNT_STATUSES: readonly AccountStatus[] = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
] as const;

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Public User representation returned across API boundaries.
 * Strictly excludes passwordHash and sensitive authentication internals.
 */
export interface UserPublicDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
