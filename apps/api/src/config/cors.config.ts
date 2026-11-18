import type { CorsOptions } from 'cors';
import { env } from './env';

/**
 * Standard allowed origins across development and production
 */
export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [
  'https://healthbridgeindia-kushagra.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Parses comma-separated origin strings, trimming whitespace and trailing slashes, stripping wildcards
 */
export const parseCorsOrigins = (rawOrigin?: string): string[] => {
  if (!rawOrigin) return [];
  return rawOrigin
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0 && origin !== '*');
};

/**
 * Returns the consolidated list of all unique allowed origins
 */
export const getAllowedOrigins = (): string[] => {
  const originSet = new Set<string>(DEFAULT_ALLOWED_ORIGINS);

  if (env.CORS_ORIGIN) {
    for (const origin of parseCorsOrigins(env.CORS_ORIGIN)) {
      originSet.add(origin);
    }
  }

  if (env.FRONTEND_URL) {
    for (const origin of parseCorsOrigins(env.FRONTEND_URL)) {
      originSet.add(origin);
    }
  }

  return Array.from(originSet);
};

/**
 * Evaluates whether a requested origin is allowed
 */
export const isOriginAllowed = (
  origin: string,
  allowedOrigins: string[] = getAllowedOrigins()
): boolean => {
  const normalized = origin.trim().replace(/\/+$/, '');

  // 1. Direct match in allowed list
  if (allowedOrigins.includes(normalized)) {
    return true;
  }

  // 2. Official HealthBridge India Vercel preview and branch deployments
  if (/^https:\/\/healthbridgeindia(-[a-z0-9-]+)?\.vercel\.app$/i.test(normalized)) {
    return true;
  }

  return false;
};

/**
 * Enterprise Production CORS configuration for HealthBridge India
 */
export const getCorsOptions = (): CorsOptions => {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (such as mobile apps, server-to-server, curl, Postman)
      if (!origin || isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
      'X-ABDM-Auth',
      'Last-Event-ID',
      'X-Video-Room-Token',
    ],

    exposedHeaders: [
      'X-Request-Id',
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
      'Retry-After',
    ],

    credentials: true,
    optionsSuccessStatus: 204,
  };
};
