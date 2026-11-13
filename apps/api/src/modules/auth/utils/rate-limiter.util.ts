import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import { HttpStatus } from '../../../shared/constants/http-status';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * High-performance In-Memory Sliding Window Rate Limiter Middleware
 */
export const createRateLimiter = (options: RateLimiterOptions) => {
  const hits = new Map<string, RateLimitRecord>();
  const { windowMs, max, message = 'Too many requests, please try again later' } = options;

  // Cleanup expired entries periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 60000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Bypass rate limiting in test environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : req.ip || req.socket.remoteAddress || 'unknown-client';

    const now = Date.now();
    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return next(new AppError(message, HttpStatus.TOO_MANY_REQUESTS));
    }

    next();
  };
};

/**
 * Standard Authentication Rate Limiters
 */
export const authGeneralLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts allowed in window
  message: 'Too many login attempts. Account temporarily locked for 15 minutes to prevent brute-force attacks.',
  keyGenerator: (req: Request) => {
    const identifier = req.body?.identifier || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${ip}:${identifier.toLowerCase()}`;
  },
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests. Please wait an hour before requesting another reset email.',
});

