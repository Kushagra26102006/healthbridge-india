import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Request Correlation & Tracing ID Middleware
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const existingId = req.headers['x-request-id'] as string | undefined;
  const correlationId = existingId && existingId.length > 0 ? existingId : `req-${crypto.randomUUID()}`;

  req.requestId = correlationId;
  res.setHeader('X-Request-Id', correlationId);

  next();
};
