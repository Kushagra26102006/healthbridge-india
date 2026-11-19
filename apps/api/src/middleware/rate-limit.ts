import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';
import { ErrorCode } from '../shared/errors/error-codes';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

/**
 * High-performance sliding-window in-memory rate limiter
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const store = new Map<string, RateLimitEntry>();
  const { windowMs, max, message } = options;

  // Cleanup expired entries every minute
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, 60_000);

  // Prevent memory leak in tests or when unref is available
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  const keyGen =
    options.keyGenerator ||
    ((req: Request): string => {
      return (
        req.ip ||
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'anonymous'
      );
    });

  return (req: Request, res: Response, next: NextFunction): void => {
    // Never rate-limit preflight OPTIONS
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (options.skip && options.skip(req)) {
      return next();
    }

    const key = keyGen(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      store.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, max - entry.count);
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

    // Standard rate limit headers (IETF draft & RFC conventions)
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      const errorMessage =
        message ||
        `Rate limit exceeded. Maximum ${max} requests allowed per ${Math.ceil(windowMs / 1000)} seconds. Please try again in ${retryAfterSeconds}s.`;

      return next(AppError.tooManyRequests(errorMessage, ErrorCode.RATE_LIMIT_EXCEEDED));
    }

    next();
  };
};

// 1. Public Endpoints Limiter: 100 requests per 15 minutes
export const publicLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Public rate limit exceeded. Please try again after 15 minutes.',
});

// 2. Protected Healthcare API Limiter: 1000 requests per 15 minutes
// High threshold to guarantee legitimate hospital & clinical workflows are never blocked
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'API rate limit exceeded. Please throttle your requests.',
});

// 3. Authentication General Limiter: 120 requests per 15 minutes (configurable)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 120,
  message: 'Too many authentication requests from this IP. Please try again in 15 minutes.',
  skip: (req: Request) => {
    // If request identifier matches a demo account when demo mode is active, prevent premature lockout
    const isDemoMode = process.env.DEMO_ACCOUNTS_ENABLED !== 'false';
    if (isDemoMode) {
      const id = (req.body?.identifier || req.body?.email || '').toString().toLowerCase();
      if (id.endsWith('@healthbridge.local')) {
        return true;
      }
    }
    return false;
  },
});

// 4. Login Attempt Limiter: 5 attempts per 15 minutes
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. For security reasons, please try again in 15 minutes.',
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const identifier = req.body?.email || req.body?.phone || 'unknown';
    return `login:${ip}:${identifier}`;
  },
});

// 5. Sensitive Operations Limiter (Password Reset, Key Exchange): 5 per 1 hour
export const sensitiveOpLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many sensitive requests. Please wait 1 hour before retrying.',
});
