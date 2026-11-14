/**
 * HealthBridge India — Patient Profile, Settings & Session Shared Types
 */

import type { Gender, Address, EmergencyContact, AbhaLinkageStatus } from './profiles.types';
import type { UserRole, AccountStatus } from './roles';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface ChannelPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface NotificationPreferencesDto {
  appointmentUpdates: ChannelPreferences;
  prescriptionUpdates: ChannelPreferences;
  labReportAlerts: ChannelPreferences;
  consentRequests: ChannelPreferences;
  securityAlerts: ChannelPreferences;
  channelAvailability: {
    emailConfigured: boolean;
    smsConfigured: boolean;
  };
}

export interface UpdateNotificationPreferencesDto {
  appointmentUpdates?: Partial<ChannelPreferences>;
  prescriptionUpdates?: Partial<ChannelPreferences>;
  labReportAlerts?: Partial<ChannelPreferences>;
  consentRequests?: Partial<ChannelPreferences>;
  securityAlerts?: Partial<ChannelPreferences>;
}

export interface PatientProfileDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: BloodGroup;
  profileImage?: string;
  address: Address;
  emergencyContact: EmergencyContact;
  abhaLinkageStatus: AbhaLinkageStatus;
  abhaAddress?: string;
  abhaNumber?: string;
  completionPercentage: number;
  notificationPreferences?: NotificationPreferencesDto;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePatientProfileDto {
  name?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  profileImage?: string;
  address?: Partial<Address>;
  emergencyContact?: Partial<EmergencyContact>;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface UserSessionItemDto {
  id: string;
  deviceName: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
  expiresAt: string;
}
