import { env } from '../../config/env';
import { getDatabaseStatus } from '../../config/database';
import { APP_CONFIG } from '@healthbridge/config';
import type { HealthCheckData } from '@healthbridge/shared-types';

export class HealthService {
  async getHealthStatus(): Promise<HealthCheckData> {
    const dbStatus = await getDatabaseStatus();

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' =
      dbStatus.status === 'connected'
        ? 'healthy'
        : dbStatus.status === 'connecting'
          ? 'degraded'
          : 'degraded';

    return {
      application: APP_CONFIG.name,
      environment: env.NODE_ENV,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: APP_CONFIG.version,
      services: {
        database: {
          status: dbStatus.status,
          latencyMs: dbStatus.latencyMs,
        },
      },
    };
  }
}

export const healthService = new HealthService();

