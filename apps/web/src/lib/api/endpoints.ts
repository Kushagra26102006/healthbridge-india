/**
 * Centralized API Endpoint Registry for HealthBridge India
 * Note: Only actively implemented endpoints are bound for runtime use.
 */

export const API_ENDPOINTS = {
  // System Health & Documentation
  HEALTH: '/health',
  DOCS: '/docs',
  OPENAPI_SPEC: '/docs/openapi.json',

  // Authentication & Session Lifecycle
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
  },

  // Healthcare Domain Endpoints
  USERS: '/users',
  PATIENTS: {
    ROOT: '/patients',
    DASHBOARD_SUMMARY: '/patients/dashboard-summary',
    PROFILE: '/patients/me',
    CHANGE_PASSWORD: '/patients/me/change-password',
    SESSIONS: '/patients/me/sessions',
    REVOKE_OTHERS: '/patients/me/sessions/revoke-others',
    NOTIFICATION_PREFERENCES: '/patients/me/notification-preferences',
  },
  DOCTORS: {
    ROOT: '/doctors',
    ME: '/doctors/me',
    PROFILE: '/doctors/profile',
    DASHBOARD_SUMMARY: '/doctors/dashboard/summary',
    APPOINTMENTS: '/doctors/appointments',
    APPOINTMENTS_SUMMARY: '/doctors/appointments/summary',
    TODAY_APPOINTMENTS: '/doctors/appointments/today',
    UPCOMING_APPOINTMENTS: '/doctors/appointments/upcoming',
    PATIENTS: '/doctors/patients',
    QUEUE: '/doctors/queue',
    SCHEDULE: '/doctors/schedule',
    ENCOUNTERS: '/doctors/encounters',
    ENCOUNTERS_SUMMARY: '/doctors/encounters/summary',
    PATIENT_CLINICAL_HISTORY: (patientId: string) => `/doctors/patients/${patientId}/clinical-history`,
    PATIENT_DETAIL: (patientId: string) => `/doctors/patients/${patientId}`,
    PATIENT_HISTORY: (patientId: string) => `/doctors/patients/${patientId}/history`,
    PATIENT_RECORDS: (patientId: string) => `/doctors/patients/${patientId}/records`,
    PATIENT_ENCOUNTERS: (patientId: string) => `/doctors/patients/${patientId}/encounters`,
    PATIENT_PRESCRIPTIONS: (patientId: string) => `/doctors/patients/${patientId}/prescriptions`,
    PATIENT_LAB_REPORTS: (patientId: string) => `/doctors/patients/${patientId}/lab-reports`,
    PATIENT_CONSENT_REQUEST: (patientId: string) => `/doctors/patients/${patientId}/consent-requests`,
    PRESCRIPTIONS: '/doctors/prescriptions',
    PRESCRIPTIONS_SUMMARY: '/doctors/prescriptions/summary',
  },
  MEDICATION_CATALOG: '/medication-catalog',
  APPOINTMENTS: '/appointments',
  RECORDS: '/records',
  PRESCRIPTIONS: '/prescriptions',
  CONSENT: '/consent',
  ABDM: '/abdm',
  PHARMACY: '/pharmacy',
  LABORATORY: '/laboratory',
  LAB_REPORTS: '/lab-reports',
  LAB_ORDERS: '/lab-orders',
  AUDIT: '/audit',
} as const;
