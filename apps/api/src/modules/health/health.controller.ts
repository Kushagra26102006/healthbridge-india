import { Request, Response, NextFunction } from 'express';
import { healthService } from './health.service';
import { sendSuccess } from '../../utils/api-response';
import { HttpStatus } from '../../shared/constants/http-status';

export class HealthController {
  async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const healthData = await healthService.getHealthStatus();
      const statusCode =
        healthData.status === 'unhealthy' ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;
      sendSuccess(res, healthData, 'HealthBridge India API is operational', statusCode);
    } catch (error) {
      next(error);
    }
  }

  getLiveness(_req: Request, res: Response): void {
    sendSuccess(
      res,
      {
        status: 'alive',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      'HealthBridge India API process is alive',
      HttpStatus.OK
    );
  }

  async getReadiness(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const healthData = await healthService.getHealthStatus();
      const isReady = healthData.services.database.status === 'connected';
      sendSuccess(
        res,
        {
          ready: isReady,
          status: healthData.status,
          database: healthData.services.database,
          timestamp: healthData.timestamp,
        },
        isReady
          ? 'HealthBridge India API is ready to serve traffic'
          : 'HealthBridge India API is not ready (database disconnected)',
        isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE
      );
    } catch (error) {
      next(error);
    }
  }
}

export const healthController = new HealthController();
