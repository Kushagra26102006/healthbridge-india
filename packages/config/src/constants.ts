/**
 * Shared Application Constants
 */

export const APP_METADATA = {
  name: 'HealthBridge India',
  tagline: 'One Nation One Health Record',
  version: '1.0.0',
  description:
    'National Unified Healthcare Platform integrated with Ayushman Bharat Digital Mission (ABDM)',
  author: 'HealthBridge India Architecture Team',
} as const;

export const API_ROUTES = {
  v1Prefix: '/api/v1',
  health: '/api/v1/health',
  docs: '/api/v1/docs',
  openApi: '/api/v1/docs/openapi.json',
  auth: {
    register: '/api/v1/auth/register',
    login: '/api/v1/auth/login',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
    logoutAll: '/api/v1/auth/logout-all',
    me: '/api/v1/auth/me',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password',
    verifyEmail: '/api/v1/auth/verify-email',
    resendVerification: '/api/v1/auth/resend-verification',
  },
} as const;

export const ROLE_LABELS = {
  PATIENT: 'Citizen / Patient',
  DOCTOR: 'Medical Practitioner',
  PHARMACY: 'Licensed Pharmacy',
  LABORATORY: 'Diagnostic Center',
  ADMIN: 'System Administrator',
} as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc' as const,
} as const;
