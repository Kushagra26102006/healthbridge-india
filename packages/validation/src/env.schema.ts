import { z } from 'zod';

const DEV_OR_PLACEHOLDER_PATTERN =
  /(dev_|hb_dev_|your_|placeholder|changeme|example|<username>|<password>)/i;
const LOCALHOST_PATTERN = /(localhost|127\.0\.0\.1|0\.0\.0\.0)/i;

/**
 * Backend Environment Variables Validation Schema
 * Enforces strict fail-closed production invariants when NODE_ENV === 'production'.
 */
export const backendEnvSchema = z
  .object({
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
    DB_MAX_POOL_SIZE: z
      .string()
      .optional()
      .default('20')
      .transform((val) => {
        const n = parseInt(val, 10);
        return Number.isNaN(n) ? 20 : Math.min(100, Math.max(5, n));
      }),
    DB_MIN_POOL_SIZE: z
      .string()
      .optional()
      .default('5')
      .transform((val) => {
        const n = parseInt(val, 10);
        return Number.isNaN(n) ? 5 : Math.min(20, Math.max(1, n));
      }),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    FRONTEND_URL: z.string().default('http://localhost:3000').optional(),
    TRUST_PROXY_HOPS: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined || val === '') return undefined;
        const n = parseInt(val, 10);
        return Number.isNaN(n) ? undefined : Math.min(5, Math.max(0, n));
      }),
    ENABLE_BACKGROUND_WORKER: z
      .enum(['true', 'false'])
      .optional()
      .default('true')
      .transform((v) => v === 'true'),
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
    ABDM_IDENTIFIER_ENCRYPTION_KEY: z.string().optional(),
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
    // --- Telemedicine / Video Consultation Configuration (Backend Only) ---
    VIDEO_PROVIDER: z
      .enum(['webrtc_direct', 'livekit'])
      .optional()
      .default('webrtc_direct'),
    VIDEO_LIVEKIT_URL: z.string().optional(),
    VIDEO_LIVEKIT_API_KEY: z.string().optional(),
    VIDEO_LIVEKIT_API_SECRET: z.string().optional(),
    VIDEO_TOKEN_TTL_SECONDS: z
      .string()
      .optional()
      .default('900')
      .transform((val) => {
        const n = parseInt(val, 10);
        return Number.isNaN(n) ? 900 : Math.min(3600, Math.max(120, n));
      }),
    VIDEO_RECORDING_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform((v) => v === 'true'),
    VIDEO_ICE_SERVERS_JSON: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') {
      return;
    }

    const secretFields = [
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'COOKIE_SECRET',
      'ADMIN_REGISTRATION_KEY',
    ] as const;

    for (const field of secretFields) {
      const value = data[field] || '';
      if (value.length < 32 || DEV_OR_PLACEHOLDER_PATTERN.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field} must be a unique >=32 character production secret (development defaults and placeholders are forbidden).`,
        });
      }
    }

    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET must be distinct from JWT_ACCESS_SECRET in production.',
      });
    }

    if (LOCALHOST_PATTERN.test(data.MONGODB_URI) || DEV_OR_PLACEHOLDER_PATTERN.test(data.MONGODB_URI)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGODB_URI'],
        message: 'Production MONGODB_URI must not point to localhost or contain placeholder credentials.',
      });
    }

    const origins = data.CORS_ORIGIN.split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    if (
      origins.length === 0 ||
      origins.some((o) => o === '*' || !o.startsWith('https://') || LOCALHOST_PATTERN.test(o))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'Production CORS_ORIGIN must contain only explicit HTTPS non-localhost origins.',
      });
    }

    if (
      data.FRONTEND_URL &&
      (!data.FRONTEND_URL.startsWith('https://') || LOCALHOST_PATTERN.test(data.FRONTEND_URL))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_URL'],
        message: 'Production FRONTEND_URL must be an explicit HTTPS non-localhost URL.',
      });
    }

    if (data.ABDM_ENVIRONMENT === 'production') {
      if (!data.ABDM_ALLOW_PRODUCTION) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ABDM_ALLOW_PRODUCTION'],
          message:
            'ABDM_ALLOW_PRODUCTION must be explicitly set to true after official NHA onboarding approval.',
        });
      }
      const abdmSecrets = [
        'ABDM_CLIENT_ID',
        'ABDM_CLIENT_SECRET',
        'ABDM_WEBHOOK_SECRET',
        'ABDM_IDENTIFIER_ENCRYPTION_KEY',
      ] as const;
      for (const field of abdmSecrets) {
        const val = data[field] || '';
        if (val.length < 16 || DEV_OR_PLACEHOLDER_PATTERN.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} must be provisioned with official NHA production credentials when ABDM_ENVIRONMENT=production.`,
          });
        }
      }
    }
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
