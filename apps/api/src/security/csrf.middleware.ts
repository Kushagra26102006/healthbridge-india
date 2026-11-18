/**
 * HealthBridge India — CSRF Protection Middleware for Cookie-Authenticated Requests (Day 9 Task 01)
 *
 * Defends state-changing endpoints (POST, PUT, PATCH, DELETE) when session authentication
 * relies on HTTP-only cookies (hb_access_token / hb_refresh_token) without a Bearer header.
 *
 * Checks:
 *   1. Sec-Fetch-Site: strictly rejects 'cross-site' state-changing cookie requests.
 *   2. Origin / Referer: validates origin against configured CORS_ORIGIN allowlist.
 *   3. Exempts signed server-to-server ABDM webhook callbacks (/api/v1/abdm/webhooks/*).
 */

import { Request, Response, NextFunction } from 'express';
import { AUTH_CONFIG } from '@healthbridge/config';
import { env } from '../config/env';
import { AppError } from '../shared/errors/app-error';
import { securityAuditMonitor } from './security-audit.monitor';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const raw = [env.CORS_ORIGIN, env.FRONTEND_URL].filter(Boolean);
  for (const entry of raw) {
    for (const part of String(entry).split(',')) {
      const trimmed = part.trim().replace(/\/+$/, '');
      if (trimmed) origins.add(trimmed);
    }
  }
  return origins;
}

function extractOriginFromReferer(referer: string): string | null {
  try {
    const parsed = new URL(referer);
    return parsed.origin.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export const csrfProtectionMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!STATE_CHANGING_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  // Signed machine-to-machine ABDM webhooks authenticate via cryptographic webhook signatures, not browser cookies
  if (req.path.includes('/abdm/webhooks')) {
    return next();
  }

  // Only enforce CSRF when cookie-based auth is present and no explicit Bearer token is supplied
  const hasBearerHeader = Boolean(
    req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
  );
  const hasAuthCookie = Boolean(
    req.cookies &&
      (req.cookies[AUTH_CONFIG.accessTokenCookieName] ||
        req.cookies[AUTH_CONFIG.refreshTokenCookieName])
  );

  if (hasBearerHeader || !hasAuthCookie) {
    return next();
  }

  const allowedOrigins = getAllowedOrigins();
  const secFetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  const originHeader = req.headers.origin ? String(req.headers.origin).replace(/\/+$/, '') : null;
  const refererHeader = req.headers.referer ? String(req.headers.referer) : null;

  // 1. Reject explicit cross-site Fetch Metadata
  if (secFetchSite === 'cross-site') {
    void securityAuditMonitor.record({
      actorId: req.user?.userId,
      actorRole: req.user?.role || 'ANONYMOUS',
      action: 'CSRF_BLOCKED',
      resourceType: 'AUTH_SESSION',
      resourceId: req.path,
      requestId: req.requestId,
      outcome: 'BLOCKED',
      metadata: { reason: 'Sec-Fetch-Site cross-site blocked', method: req.method },
    });
    return next(AppError.forbidden('CSRF validation failed: cross-site request blocked.'));
  }

  // 2. Validate Origin header when present
  if (originHeader) {
    if (!allowedOrigins.has(originHeader)) {
      void securityAuditMonitor.record({
        actorId: req.user?.userId,
        actorRole: req.user?.role || 'ANONYMOUS',
        action: 'CSRF_BLOCKED',
        resourceType: 'AUTH_SESSION',
        resourceId: req.path,
        requestId: req.requestId,
        outcome: 'BLOCKED',
        metadata: { reason: 'Untrusted Origin header', method: req.method },
      });
      return next(AppError.forbidden('CSRF validation failed: untrusted request origin.'));
    }
    return next();
  }

  // 3. Fallback to Referer header when present
  if (refererHeader) {
    const refererOrigin = extractOriginFromReferer(refererHeader);
    if (!refererOrigin || !allowedOrigins.has(refererOrigin)) {
      void securityAuditMonitor.record({
        actorId: req.user?.userId,
        actorRole: req.user?.role || 'ANONYMOUS',
        action: 'CSRF_BLOCKED',
        resourceType: 'AUTH_SESSION',
        resourceId: req.path,
        requestId: req.requestId,
        outcome: 'BLOCKED',
        metadata: { reason: 'Untrusted Referer header', method: req.method },
      });
      return next(AppError.forbidden('CSRF validation failed: untrusted request referer.'));
    }
  }

  next();
};
