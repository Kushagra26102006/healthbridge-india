import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { ErrorCode } from '../../src/shared/errors/error-codes';

describe('Not Found Route Integration Tests (404 Catch-All)', () => {
  const app = createApp();

  it('should return standard 404 error payload for non-existent routes', async () => {
    const res = await request(app).get('/api/v1/non-existent-healthcare-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ErrorCode.NOT_FOUND);
    expect(res.body.message).toContain('Route not found');
    expect(res.body.requestId).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

