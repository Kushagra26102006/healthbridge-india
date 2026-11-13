import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

describe('Request ID Middleware Integration Tests', () => {
  const app = createApp();

  it('should generate a valid UUID when client does not supply X-Request-Id header', async () => {
    const res = await request(app).get('/');

    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('should preserve and echo safe client-supplied X-Request-Id header', async () => {
    const customId = 'client-trace-12345-healthcare';
    const res = await request(app).get('/').set('X-Request-Id', customId);

    expect(res.headers['x-request-id']).toBe(customId);
  });

  it('should replace unsafe/malformed client-supplied X-Request-Id header with secure UUID', async () => {
    const dangerousId = 'bad-id-with-forbidden-$%-chars';
    const res = await request(app).get('/').set('X-Request-Id', dangerousId);

    expect(res.headers['x-request-id']).not.toBe(dangerousId);
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});
