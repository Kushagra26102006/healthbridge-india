/**
 * User and Identity Types for HealthBridge India
 */
import type { UserRole, AccountStatus } from './user';

export type { UserRole, AccountStatus };

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  abhaNumber?: string;
  abhaAddress?: string;
  isAbhaLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyDoctorProfile extends UserProfile {
  role: 'DOCTOR';
  nmcRegistrationNumber: string;
  specialization: string[];
  qualifications: string[];
  hospitalAffiliations: string[];
}
