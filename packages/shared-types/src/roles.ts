/**
 * Healthcare User Roles & Account Status Contracts for HealthBridge India
 */

export const UserRole = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  PHARMACY: 'PHARMACY',
  LABORATORY: 'LABORATORY',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AccountStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const USER_ROLES: readonly [UserRole, ...UserRole[]] = [
  'PATIENT',
  'DOCTOR',
  'PHARMACY',
  'LABORATORY',
  'ADMIN',
];

export const ACCOUNT_STATUSES: readonly [AccountStatus, ...AccountStatus[]] = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
];

export const ALL_USER_ROLES = USER_ROLES;

export const PUBLIC_REGISTERABLE_ROLES: UserRole[] = [
  UserRole.PATIENT,
  UserRole.DOCTOR,
  UserRole.PHARMACY,
  UserRole.LABORATORY,
];
