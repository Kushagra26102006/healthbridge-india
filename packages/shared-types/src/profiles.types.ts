/**
 * Healthcare Profile Types for HealthBridge India
 */

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type AbhaLinkageStatus = 'NOT_LINKED' | 'LINKED' | 'PENDING';

export type AdminLevel = 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'SUPPORT_ADMIN';

export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'DIAGNOSTIC_CENTRE' | 'PHARMACY';

export interface Address {
  line1?: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IPatientProfile {
  id: string;
  userId: string;
  dateOfBirth: Date | string;
  gender: Gender;
  address: Address;
  emergencyContact: EmergencyContact;
  abhaLinkageStatus: AbhaLinkageStatus;
  abhaAddress?: string;
  abhaNumber?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IDoctorProfile {
  id: string;
  userId: string;
  registrationNumber: string;
  specialization: string[];
  qualifications: string[];
  experience: number;
  verificationStatus: VerificationStatus;
  facilityId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IPharmacyProfile {
  id: string;
  userId: string;
  pharmacyLicenseNumber: string;
  facilityId?: string;
  verificationStatus: VerificationStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ILaboratoryProfile {
  id: string;
  userId: string;
  laboratoryLicenseNumber: string;
  facilityId?: string;
  verificationStatus: VerificationStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAdminProfile {
  id: string;
  userId: string;
  administrativeLevel: AdminLevel;
  permissions: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IFacility {
  id: string;
  name: string;
  facilityType: FacilityType;
  hfrId?: string; // Health Facility Registry ID under ABDM
  address: Address;
  contactPhone: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

