import { describe, it, expect, vi, beforeEach } from 'vitest';
import { backendEnvSchema } from '@healthbridge/validation';
import { parseCorsOrigins } from '../../src/app';
import { seedDatabase } from '../../src/database/seed';
import { healthController } from '../../src/modules/health/health.controller';
import { healthService } from '../../src/modules/health/health.service';

describe('Phase 20 Production Readiness & Hardening Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks production startup when dev defaults, localhost URLs, HTTP origins, or duplicate JWT secrets are supplied', () => {
    const unsafeProd = backendEnvSchema.safeParse({
      NODE_ENV: 'production',
      PORT: '5001',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/healthbridge_dev',
      CORS_ORIGIN: 'http://localhost:3000',
      FRONTEND_URL: 'http://localhost:3000',
    });

    expect(unsafeProd.success).toBe(false);
    if (!unsafeProd.success) {
      const fields = unsafeProd.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('JWT_ACCESS_SECRET');
      expect(fields).toContain('JWT_REFRESH_SECRET');
      expect(fields).toContain('COOKIE_SECRET');
      expect(fields).toContain('ADMIN_REGISTRATION_KEY');
      expect(fields).toContain('MONGODB_URI');
      expect(fields).toContain('CORS_ORIGIN');
    }
  });

  it('blocks ABDM production mode unless ABDM_ALLOW_PRODUCTION=true and real credentials are supplied', () => {
    const blockedAbdm = backendEnvSchema.safeParse({
      NODE_ENV: 'production',
      PORT: '5001',
      MONGODB_URI: 'mongodb://db.healthbridge-internal.test:27017/healthbridge_prod?tls=true',
      CORS_ORIGIN: 'https://app.healthbridge.in',
      FRONTEND_URL: 'https://app.healthbridge.in',
      JWT_ACCESS_SECRET: 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8',
      JWT_REFRESH_SECRET: 'Z9y8X7w6V5u4T3s2R1q0P9o8N7m6L5k4J3i2',
      COOKIE_SECRET: 'C1o2O3k4I5e6S7e8C9r0E1t2K3e4Y5m6N7p8',
      ADMIN_REGISTRATION_KEY: 'K9e8Y7a6D5m4I3n2R1e0G9i8S7t6R5a4T3i2',
      ABDM_ENABLED: 'true',
      ABDM_ENVIRONMENT: 'production',
      ABDM_ALLOW_PRODUCTION: 'false',
    });

    expect(blockedAbdm.success).toBe(false);
    if (!blockedAbdm.success) {
      expect(blockedAbdm.error.issues.some((i) => i.path[0] === 'ABDM_ALLOW_PRODUCTION')).toBe(true);
    }
  });

  it('accepts properly hardened production environment configuration', () => {
    const validProd = backendEnvSchema.safeParse({
      NODE_ENV: 'production',
      PORT: '5001',
      TRUST_PROXY_HOPS: '1',
      ENABLE_BACKGROUND_WORKER: 'false',
      DB_MAX_POOL_SIZE: '30',
      DB_MIN_POOL_SIZE: '5',
      MONGODB_URI: 'mongodb://db.healthbridge-internal.test:27017/healthbridge_prod?tls=true',
      CORS_ORIGIN: 'https://app.healthbridge.in,https://admin.healthbridge.in',
      FRONTEND_URL: 'https://app.healthbridge.in',
      JWT_ACCESS_SECRET: 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8',
      JWT_REFRESH_SECRET: 'Z9y8X7w6V5u4T3s2R1q0P9o8N7m6L5k4J3i2',
      COOKIE_SECRET: 'C1o2O3k4I5e6S7e8C9r0E1t2K3e4Y5m6N7p8',
      ADMIN_REGISTRATION_KEY: 'K9e8Y7a6D5m4I3n2R1e0G9i8S7t6R5a4T3i2',
      ABDM_ENABLED: 'false',
      ABDM_ENVIRONMENT: 'disabled',
      ABDM_ALLOW_PRODUCTION: 'false',
    });

    expect(validProd.success).toBe(true);
    if (validProd.success) {
      expect(validProd.data.ENABLE_BACKGROUND_WORKER).toBe(false);
      expect(validProd.data.TRUST_PROXY_HOPS).toBe(1);
      expect(validProd.data.DB_MAX_POOL_SIZE).toBe(30);
    }
  });

  it('parses comma-separated CORS allowlists and strips wildcards', () => {
    expect(parseCorsOrigins('https://app.healthbridge.in, *, https://portal.healthbridge.in')).toEqual([
      'https://app.healthbridge.in',
      'https://portal.healthbridge.in',
    ]);
  });

  it('blocks synthetic database seeding when NODE_ENV=production', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(seedDatabase()).rejects.toThrow('SECURITY_BLOCK');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('returns 200 on liveness probe and 503 on readiness probe when database is disconnected', async () => {
    const liveRes: any = {
      getHeader: vi.fn().mockReturnValue('req-live-1'),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    healthController.getLiveness({} as any, liveRes);
    expect(liveRes.status).toHaveBeenCalledWith(200);
    expect(liveRes.json.mock.calls[0][0].data.status).toBe('alive');

    vi.spyOn(healthService, 'getHealthStatus').mockResolvedValue({
      application: 'HealthBridge India',
      environment: 'production',
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: 42,
      version: '1.0.0',
      services: { database: { status: 'disconnected' } },
    });

    const readyRes: any = {
      getHeader: vi.fn().mockReturnValue('req-ready-1'),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    await healthController.getReadiness({} as any, readyRes, vi.fn());
    expect(readyRes.status).toHaveBeenCalledWith(503);
    expect(readyRes.json.mock.calls[0][0].data.ready).toBe(false);
  });
});
