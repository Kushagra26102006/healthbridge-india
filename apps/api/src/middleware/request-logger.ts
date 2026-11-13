import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';

const getErrorCategory = (statusCode: number): string | undefined => {
  if (statusCode < 400) return undefined;
  if (statusCode === 401) return 'AuthenticationError';
  if (statusCode === 403) return 'AuthorizationError';
  if (statusCode === 404) return 'NotFoundError';
  if (statusCode === 409) return 'ConflictError';
  if (statusCode === 422) return 'ValidationError';
  if (statusCode === 429) return 'RateLimitError';
  if (statusCode >= 400 && statusCode < 500) return 'ClientError';
  if (statusCode >= 500) return 'ServerError';
  return 'UnknownError';
};

/**
 * Structured HTTP Request Logger Middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();

  // Log on response completion
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number((endTime - startTime) / 1_000_000n);
    const statusCode = res.statusCode;
    const errorCategory = getErrorCategory(statusCode);

    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      errorCategory,
      environment: env.NODE_ENV,
    };

    const message = `${req.method} ${req.originalUrl || req.url} ${statusCode} - ${logData.durationMs}ms`;

    if (statusCode >= 500) {
      logger.error(message, undefined, logData);
    } else if (statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }
  });

  next();
};
