import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health Endpoint Integration Tests (GET /api/v1/health)', () => {
  const app = createApp();

  it('should return 200 or 503 with standardized HealthCheckResponse structure', async () => {
    const res = await request(app).get('/api/v1/health');

    // In isolated test environments with local DB offline, status will be 503; with DB connected, 200
    expect([200, 503]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.application).toBe('HealthBridge India');
    expect(res.body.data.status).toBeDefined();
    expect(['healthy', 'degraded', 'unhealthy']).toContain(res.body.data.status);
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data.services).toBeDefined();
    expect(res.body.data.services.database).toBeDefined();
    expect(res.body.requestId).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });
});
