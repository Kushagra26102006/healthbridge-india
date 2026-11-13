/**
 * HealthBridge India — User & Identity Shared Contracts
 * One Nation One Health Record — ABHA Integrated Healthcare Platform
 */

export * from './roles';
import type { UserRole, AccountStatus } from './roles';

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
 * Strictly excludes passwordHash, refresh tokens, and sensitive authentication internals.
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
}

/**
 * Session snapshot of an authenticated user
 */
export interface UserSessionDto {
  user: UserPublicDto;
  isAuthenticated: boolean;
  activeRole: UserRole;
}
