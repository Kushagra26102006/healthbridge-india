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
}

export const healthController = new HealthController();
