/**
 * User and Identity Types for HealthBridge India
 */

export type UserRole =
  | 'PATIENT'
  | 'DOCTOR'
  | 'HOSPITAL_ADMIN'
  | 'PHARMACIST'
  | 'DIAGNOSTIC_LAB'
  | 'SUPER_ADMIN';

export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
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

export interface DoctorProfile extends UserProfile {
  role: 'DOCTOR';
  nmcRegistrationNumber: string;
  specialization: string[];
  qualifications: string[];
  hospitalAffiliations: string[];
}

