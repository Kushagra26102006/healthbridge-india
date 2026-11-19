import { Request, Response, CookieOptions } from 'express';
import { env } from '../../../config/env';
import { AUTH_CONFIG } from '@healthbridge/config';

/**
 * Determines whether cookies should be issued with Secure + SameSite=None + Partitioned flags.
 * Evaluates production environment, Render cloud hosting, TLS reverse proxies, and HTTPS origins.
 */
export const isSecureCookieContext = (req?: Request): boolean => {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  if (
    env.NODE_ENV === 'production' ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.RENDER_EXTERNAL_URL) ||
    process.env.COOKIE_SECURE === 'true'
  ) {
    return true;
  }
  if (req) {
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (req.secure || forwardedProto === 'https') {
      return true;
    }
    const origin = req.headers.origin || req.headers.referer;
    if (typeof origin === 'string' && origin.startsWith('https://')) {
      return true;
    }
  }
  return false;
};

export const getBaseCookieOptions = (maxAgeMs: number, req?: Request): CookieOptions => {
  const isSecure = isSecureCookieContext(req);
  const options: CookieOptions & { partitioned?: boolean } = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };

  // Support Chrome CHIPS (Cookies Having Independent Partitioned State) for cross-site contexts
  if (isSecure) {
    options.partitioned = true;
  }

  return options;
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken?: string,
  req?: Request
): void => {
  // Access Token: 15 minutes (900,000 ms)
  const accessCookieOptions = getBaseCookieOptions(15 * 60 * 1000, req);
  res.cookie(AUTH_CONFIG.accessTokenCookieName, accessToken, accessCookieOptions);

  // Refresh Token: 7 days (7 * 24 * 60 * 60 * 1000 ms)
  if (refreshToken) {
    const refreshCookieOptions = getBaseCookieOptions(7 * 24 * 60 * 60 * 1000, req);
    res.cookie(AUTH_CONFIG.refreshTokenCookieName, refreshToken, refreshCookieOptions);
  }
};

export const clearAuthCookies = (res: Response, req?: Request): void => {
  const isSecure = isSecureCookieContext(req);
  const clearOptions: CookieOptions & { partitioned?: boolean } = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
    path: '/',
  };

  if (isSecure) {
    clearOptions.partitioned = true;
  }

  res.clearCookie(AUTH_CONFIG.accessTokenCookieName, clearOptions);
  res.clearCookie(AUTH_CONFIG.refreshTokenCookieName, clearOptions);
};
