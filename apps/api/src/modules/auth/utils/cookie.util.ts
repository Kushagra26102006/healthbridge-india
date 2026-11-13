import { Response, CookieOptions } from 'express';
import { env } from '../../../config/env';
import { AUTH_CONFIG } from '@healthbridge/config';

const isProduction = env.NODE_ENV === 'production';

export const getBaseCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: maxAgeMs,
});

export const setAuthCookies = (res: Response, accessToken: string, refreshToken?: string): void => {
  // Access Token: 15 minutes (900,000 ms)
  const accessCookieOptions = getBaseCookieOptions(15 * 60 * 1000);
  res.cookie(AUTH_CONFIG.accessTokenCookieName, accessToken, accessCookieOptions);

  // Refresh Token: 7 days (7 * 24 * 60 * 60 * 1000 ms)
  if (refreshToken) {
    const refreshCookieOptions = getBaseCookieOptions(7 * 24 * 60 * 60 * 1000);
    res.cookie(AUTH_CONFIG.refreshTokenCookieName, refreshToken, refreshCookieOptions);
  }
};

export const clearAuthCookies = (res: Response): void => {
  const clearOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  };
  res.clearCookie(AUTH_CONFIG.accessTokenCookieName, clearOptions);
  res.clearCookie(AUTH_CONFIG.refreshTokenCookieName, clearOptions);
};
