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
    PROFILE: '/patients/profile',
  },
  DOCTORS: '/doctors',
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
