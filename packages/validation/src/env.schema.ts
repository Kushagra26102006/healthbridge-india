import { z } from 'zod';

/**
 * Backend Environment Variables Validation Schema
 */
export const backendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1000).max(65535))
    .default('5001'),
  MONGODB_URI: z
    .string()
    .url(
      'MONGODB_URI must be a valid MongoDB connection URI (e.g. mongodb://... or mongodb+srv://...)'
    )
    .default('mongodb://127.0.0.1:27017/healthbridge_dev'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:3000').optional(),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters')
    .default('dev_access_secret_hb_platform_key_32bytes'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters')
    .default('dev_refresh_secret_hb_platform_key_32bytes'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z
    .string()
    .min(16, 'COOKIE_SECRET must be at least 16 characters')
    .default('dev_cookie_secret_hb_platform_cookie_key'),
  ABDM_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  ABDM_ENVIRONMENT: z
    .enum(['disabled', 'development', 'sandbox', 'production'])
    .optional()
    .default('disabled'),
  ABDM_BASE_URL: z.string().optional(),
  ABDM_ABHA_BASE_URL: z.string().optional(),
  ABDM_X_CM_ID: z.string().optional(),
  ABDM_CLIENT_ID: z.string().optional(),
  ABDM_CLIENT_SECRET: z.string().optional(),
  ABDM_CALLBACK_URL: z.string().optional(),
  ABDM_WEBHOOK_SECRET: z.string().optional(),
  ABDM_REQUEST_TIMEOUT_MS: z
    .string()
    .optional()
    .default('15000')
    .transform((val) => {
      const n = parseInt(val, 10);
      return Number.isNaN(n) ? 15000 : Math.min(60000, Math.max(1000, n));
    }),
  ABDM_ALLOW_PRODUCTION: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  ADMIN_REGISTRATION_KEY: z
    .string()
    .optional()
    .default('hb_dev_admin_registration_secret_key_2026'),
});

export type BackendEnv = z.infer<typeof backendEnvSchema>;

/**
 * Frontend Environment Variables Validation Schema
 */
export const frontendEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('HealthBridge India'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:5001/api/v1'),
});

export type FrontendEnv = z.infer<typeof frontendEnvSchema>;
