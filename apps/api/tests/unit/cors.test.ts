import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { isOriginAllowed, getAllowedOrigins, parseCorsOrigins } from '../../src/config/cors.config';

describe('CORS Configuration & Preflight Interceptor Suite', () => {
  const app = createApp();

  describe('Origin Resolution Helpers', () => {
    it('parses comma-separated origins and strips wildcards and trailing slashes', () => {
      const parsed = parseCorsOrigins('https://example.com/, *, http://localhost:3000///');
      expect(parsed).toEqual(['https://example.com', 'http://localhost:3000']);
    });

    it('always includes production Vercel frontend in allowed origins', () => {
      const origins = getAllowedOrigins();
      expect(origins).toContain('https://healthbridgeindia-kushagra.vercel.app');
      expect(origins).toContain('http://localhost:3000');
    });

    it('identifies valid origins including Vercel branch previews', () => {
      expect(isOriginAllowed('https://healthbridgeindia-kushagra.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://healthbridgeindia.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://healthbridgeindia-preview-1.vercel.app')).toBe(true);
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
      expect(isOriginAllowed('http://localhost:5173')).toBe(true);

      // Disallowed origins
      expect(isOriginAllowed('https://evil-attacker.com')).toBe(false);
      expect(isOriginAllowed('https://healthbridgeindia.vercel.app.malicious.com')).toBe(false);
      expect(isOriginAllowed('http://malicious-localhost.com:3000')).toBe(false);
    });
  });

  describe('HTTP Preflight & Headers Verification', () => {
    it('returns HTTP 204 with affirmative CORS headers for production Vercel origin', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'https://healthbridgeindia-kushagra.vercel.app')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,x-request-id');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(
        'https://healthbridgeindia-kushagra.vercel.app'
      );
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-methods']).toContain('OPTIONS');
      expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(res.headers['access-control-allow-headers']).toContain('X-Request-Id');
    });

    it('returns HTTP 204 with affirmative CORS headers for localhost development origin', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,x-request-id');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('denies affirmative CORS headers for unauthorized origins', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'https://unauthorized-origin.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,x-request-id');

      // The response must NOT set Access-Control-Allow-Origin for the unauthorized origin
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
      expect(res.status).toBe(403);
    });

    it('exposes critical tracking and rate-limit headers in CORS responses', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'https://healthbridgeindia-kushagra.vercel.app')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-expose-headers']).toContain('X-Request-Id');
      expect(res.headers['access-control-expose-headers']).toContain('RateLimit-Remaining');
    });
  });
});
