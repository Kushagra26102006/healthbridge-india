import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend Express Request interface with requestId and id
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      id: string;
    }
  }
}

const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9_\-.]{8,64}$/;

/**
 * Request ID Middleware
 * Validates or generates cryptographically secure request correlation IDs
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = (req.headers['x-request-id'] || req.headers['x-correlation-id']) as
    string | undefined;

  let requestId: string;

  // Sanitize incoming request ID to avoid HTTP header injection or log poisoning
  if (
    incomingId &&
    typeof incomingId === 'string' &&
    SAFE_REQUEST_ID_REGEX.test(incomingId.trim())
  ) {
    requestId = incomingId.trim();
  } else {
    requestId = crypto.randomUUID();
  }

  // Attach to request context
  req.requestId = requestId;
  req.id = requestId;

  // Set response header
  res.setHeader('X-Request-Id', requestId);

  next();
};

export const correlationIdMiddleware = requestIdMiddleware;
