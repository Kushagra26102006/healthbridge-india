import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRateLimiter } from '../../src/middleware/rate-limit';
import { errorHandler } from '../../src/middleware/error-handler';
import { requestIdMiddleware } from '../../src/middleware/request-id';
import { ErrorCode } from '../../src/shared/errors/error-codes';

describe('Rate Limiter Integration Tests', () => {
  const app = express();
  app.use(requestIdMiddleware);

  const testLimiter = createRateLimiter({
    windowMs: 5000,
    max: 3,
    message: 'Test rate limit reached',
  });

  app.get('/test-limit', testLimiter, (_req, res) => {
    res.json({ success: true, message: 'ok' });
  });

  app.use(errorHandler);

  it('should allow requests within limit and populate RateLimit headers', async () => {
    const res1 = await request(app).get('/test-limit');
    expect(res1.status).toBe(200);
    expect(res1.headers['ratelimit-limit']).toBe('3');
    expect(res1.headers['ratelimit-remaining']).toBe('2');

    const res2 = await request(app).get('/test-limit');
    expect(res2.status).toBe(200);
    expect(res2.headers['ratelimit-remaining']).toBe('1');

    const res3 = await request(app).get('/test-limit');
    expect(res3.status).toBe(200);
    expect(res3.headers['ratelimit-remaining']).toBe('0');
  });

  it('should reject request exceeding threshold with 429 and RATE_LIMIT_EXCEEDED code', async () => {
    const res4 = await request(app).get('/test-limit');
    expect(res4.status).toBe(429);
    expect(res4.headers['retry-after']).toBeDefined();
    expect(res4.body.success).toBe(false);
    expect(res4.body.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
    expect(res4.body.message).toContain('Test rate limit reached');
    expect(res4.body.requestId).toBeDefined();
  });
});
