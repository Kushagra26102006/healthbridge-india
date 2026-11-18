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
  'IMAGING_REPORT',
  'PRESCRIPTION',
  'MEDICAL_CERTIFICATE',
  'IMMUNIZATION_RECORD',
  'WELLNESS_RECORD',
  'OTHER_MEDICAL_DOCUMENT',
] as const;

export const RECORD_VERIFICATION_STATUSES = ['VERIFIED', 'PENDING', 'SELF_SUBMITTED'] as const;

export const RECORD_SOURCES = ['MANUAL_ENTRY', 'ABDM_INGESTION', 'EHR_SYNC'] as const;

export const RECORD_TYPE_LABELS: Record<string, string> = {
  OP_CONSULTATION: 'Consultation Record',
  DISCHARGE_SUMMARY: 'Discharge Summary',
  DIAGNOSTIC_REPORT: 'Laboratory Report',
  IMAGING_REPORT: 'Imaging Report',
  PRESCRIPTION: 'Prescription',
  MEDICAL_CERTIFICATE: 'Medical Certificate',
  IMMUNIZATION_RECORD: 'Immunization Record',
  WELLNESS_RECORD: 'Wellness Record',
  OTHER_MEDICAL_DOCUMENT: 'Other Medical Document',
};

export const RECORD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB per document
  maxPatientStorageBytes: 100 * 1024 * 1024, // 100MB per patient vault
  signedAccessTtlSeconds: 180, // 3 minutes short-lived signed access link
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const,
  allowedFileExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'] as const,
} as const;

export const CONSULTATION_TYPES = ['IN_PERSON', 'TELECONSULTATION'] as const;

export const APPOINTMENT_STATUSES = [
  'REQUESTED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export const APPOINTMENT_CONFIG = {
  slotDurationMinutes: 30,
  cancellationDeadlineHours: 2,
  defaultWorkingHours: {
    start: '09:00',
    end: '17:00',
    lunchBreakStart: '13:00',
    lunchBreakEnd: '14:00',
  },
} as const;

export const LAB_TEST_CATEGORIES = [
  'BLOOD_TESTS',
  'URINE_TESTS',
  'BIOCHEMISTRY',
  'HEMATOLOGY',
  'IMAGING',
  'MICROBIOLOGY',
  'OTHER',
] as const;

export const LAB_CATEGORY_LABELS: Record<string, string> = {
  BLOOD_TESTS: 'Blood Tests',
  URINE_TESTS: 'Urine Tests',
  BIOCHEMISTRY: 'Biochemistry',
  HEMATOLOGY: 'Hematology',
  IMAGING: 'Imaging & Radiology',
  MICROBIOLOGY: 'Microbiology',
  OTHER: 'Other Diagnostic Tests',
};

export const LAB_REPORT_STATUSES = [
  'COMPLETED',
  'PENDING',
  'PRELIMINARY',
  'CANCELLED',
] as const;

export const LAB_ORDER_STATUSES = [
  'ORDERED',
  'SAMPLE_COLLECTED',
  'IN_ANALYSIS',
  'COMPLETED',
  'CANCELLED',
] as const;

export const LAB_ORDER_STATUS_LABELS: Record<string, string> = {
  ORDERED: 'Order Placed',
  SAMPLE_COLLECTED: 'Sample Collected',
  IN_ANALYSIS: 'Processing / In Analysis',
  COMPLETED: 'Completed & Report Ready',
  CANCELLED: 'Cancelled',
};

export const LAB_RESULT_INTERPRETATIONS = [
  'NORMAL',
  'ABOVE_RANGE',
  'BELOW_RANGE',
  'NOT_AVAILABLE',
] as const;

export const CONSENT_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'REVOKED',
  'EXPIRED',
] as const;

export const CONSENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Active Permission',
  REJECTED: 'Denied / Rejected',
  REVOKED: 'Revoked',
  EXPIRED: 'Expired',
};

export const CONSENT_DATA_CATEGORIES = [
  'MEDICAL_RECORDS',
  'PRESCRIPTIONS',
  'LAB_REPORTS',
  'DIAGNOSTIC_REPORTS',
  'ENCOUNTER_INFO',
] as const;

export const CONSENT_DATA_CATEGORY_LABELS: Record<string, string> = {
  MEDICAL_RECORDS: 'Health & Medical Records',
  PRESCRIPTIONS: 'Prescriptions & Medications',
  LAB_REPORTS: 'Laboratory Reports',
  DIAGNOSTIC_REPORTS: 'Diagnostic Imaging & Tests',
  ENCOUNTER_INFO: 'Clinical Encounters & Notes',
};

export const CONSENT_PURPOSE_CODES = [
  'CAREMGT',
  'BTG',
  'PUBHLTH',
  'HPAYMT',
  'DSRCH',
  'PATRQT',
] as const;

export const CONSENT_PURPOSE_LABELS: Record<string, string> = {
  CAREMGT: 'Care Management & Clinical Treatment',
  BTG: 'Emergency Break-the-Glass',
  PUBHLTH: 'Public Health Surveillance',
  HPAYMT: 'Healthcare Payment & Insurance Claims',
  DSRCH: 'Disease-Specific Medical Research',
  PATRQT: 'Patient-Requested Data Portability',
};

export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  appointmentUpdates: { inApp: true, email: true, sms: true },
  prescriptionUpdates: { inApp: true, email: true, sms: false },
  labReportAlerts: { inApp: true, email: true, sms: false },
  consentRequests: { inApp: true, email: true, sms: true },
  securityAlerts: { inApp: true, email: true, sms: true },
} as const;




