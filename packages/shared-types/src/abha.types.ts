/**
 * Ayushman Bharat Health Account (ABHA) Types
 * Aligned with National Health Authority (NHA) / ABDM M1, M2, M3 specifications
 */

export type AbhaAuthMethod = 'MOBILE_OTP' | 'AADHAAR_OTP' | 'PASSWORD' | 'DEMOGRAPHICS';

export interface AbhaVerificationRequest {
  abhaNumber?: string;
  abhaAddress?: string;
  authMethod: AbhaAuthMethod;
}

export interface AbhaOtpVerificationRequest {
  transactionId: string;
  otp: string;
}

export interface AbhaProfile {
  abhaNumber: string;
  abhaAddress: string;
  fullName: string;
  gender: 'M' | 'F' | 'O';
  dateOfBirth: string; // YYYY-MM-DD
  mobile: string;
  address: {
    line?: string;
    district: string;
    state: string;
    pincode: string;
  };
  kycPhotoUrl?: string;
  isKycVerified: boolean;
}

export type ConsentStatus = 'REQUESTED' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';

export interface AbhaConsentArtifact {
  consentId: string;
  patientAbhaAddress: string;
  requesterId: string;
  requesterName: string;
  purpose: string;
  hiTypes: string[];
  status: ConsentStatus;
  dateRange: {
    from: string;
    to: string;
  };
  expiryDate: string;
  createdAt: string;
}
