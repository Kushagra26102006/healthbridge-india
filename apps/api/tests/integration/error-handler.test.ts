import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { ErrorCode } from '../../src/shared/errors/error-codes';

describe('Error Handler Middleware Integration Tests', () => {
  const app = createApp();

  it('should intercept malformed JSON syntax and return 400 with MALFORMED_JSON code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "test@healthbridge.in", "password": }'); // Malformed JSON

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ErrorCode.MALFORMED_JSON);
    expect(res.body.message).toContain('Malformed JSON syntax');
    expect(res.body.requestId).toBeDefined();
  });

  it('should return 422 with VALIDATION_ERROR code on invalid input payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        phone: '123',
        password: 'weak',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.requestId).toBeDefined();
  });
});

