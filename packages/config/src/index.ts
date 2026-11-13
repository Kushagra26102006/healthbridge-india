/**
 * HealthBridge India — Global Shared Configuration
 * One Nation One Health Record — ABHA Integrated Healthcare Platform
 */

export * from './constants';
export * from './env';

export const APP_CONFIG = {
  name: 'HealthBridge India',
  description: 'ABHA Integrated Unified Healthcare Platform',
  version: '1.0.0',
  apiVersion: 'v1',
  apiPrefix: '/api/v1',
} as const;

export const DEFAULT_PORTS = {
  web: 3000,
  api: 5001,
} as const;

export const AUTH_CONFIG = {
  accessTokenCookieName: 'hb_access_token',
  refreshTokenCookieName: 'hb_refresh_token',
  tokenIssuer: 'healthbridge.gov.in',
  defaultTokenExpiry: '15m',
  defaultRefreshTokenExpiry: '7d',
} as const;

export const ABHA_CONFIG = {
  sandboxBaseUrl: 'https://dev.abdm.gov.in/gateway/v0.5',
  productionBaseUrl: 'https://abdm.gov.in/gateway/v0.5',
  abhaNumberLength: 14,
  abhaAddressSuffix: '@abdm',
  supportedAuthModes: ['MOBILE_OTP', 'AADHAAR_OTP', 'DEMOGRAPHICS'] as const,
} as const;

export const HEALTH_RECORD_TYPES = [
  'OP_CONSULTATION',
  'DISCHARGE_SUMMARY',
  'DIAGNOSTIC_REPORT',
  'PRESCRIPTION',
  'IMMUNIZATION_RECORD',
  'WELLNESS_RECORD',
] as const;

export const RECORD_VERIFICATION_STATUSES = ['VERIFIED', 'PENDING', 'SELF_SUBMITTED'] as const;

export const RECORD_SOURCES = ['MANUAL_ENTRY', 'ABDM_INGESTION', 'EHR_SYNC'] as const;

export const RECORD_TYPE_LABELS: Record<string, string> = {
  OP_CONSULTATION: 'Doctor Consultation',
  DISCHARGE_SUMMARY: 'Discharge Summary',
  DIAGNOSTIC_REPORT: 'Diagnostic & Lab Report',
  PRESCRIPTION: 'Prescription',
  IMMUNIZATION_RECORD: 'Immunization Record',
  WELLNESS_RECORD: 'Wellness & Medical Record',
};

export const RECORD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const,
  allowedFileExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'] as const,
} as const;
