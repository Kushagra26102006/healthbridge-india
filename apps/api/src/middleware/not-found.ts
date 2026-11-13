import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';

/**
 * 404 Route Not Found Handler
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(
    AppError.notFound(
      `Cannot ${req.method} ${req.originalUrl} - Route not found on HealthBridge API`
    )
  );
};
