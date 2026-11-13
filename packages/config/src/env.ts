/**
 * Environment-Related Shared Constants
 *
 * NOTE: Only client-safe environment metadata and defaults are defined here.
 * Server-only secrets (JWT secrets, Mongo URIs, encryption keys) are strictly
 * managed on the backend and never packaged into shared browser exports.
 */

export const ENV_DEFAULTS = {
  webPort: 3000,
  apiPort: 5001,
  defaultApiBaseUrl: 'http://localhost:5001/api/v1',
  defaultFrontendUrl: 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
} as const;

export const SAFE_CLIENT_ENV_VARS = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_APP_ENV',
  'NEXT_PUBLIC_ENABLE_ANALYTICS',
] as const;
