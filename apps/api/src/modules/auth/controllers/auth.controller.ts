import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie.util';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import { AUTH_CONFIG } from '@healthbridge/config';
import type { DeviceInfo } from '@healthbridge/shared-types';

export class AuthController {
  private getDeviceInfo(req: Request): DeviceInfo {
    return {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo(req);
      const result = await authService.register(req.body, deviceInfo, req.requestId);

      if (result.tokens.accessToken) {
        setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
      }

      sendSuccess(res, result, result.message || 'User registered successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo(req);
      const result = await authService.login(req.body, deviceInfo, req.requestId);

      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        req.cookies[AUTH_CONFIG.refreshTokenCookieName] || req.body?.refreshToken;

      if (!refreshToken) {
        clearAuthCookies(res);
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Refresh token not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const deviceInfo = this.getDeviceInfo(req);
      const result = await authService.refresh(refreshToken, deviceInfo, req.requestId);

      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        req.cookies[AUTH_CONFIG.refreshTokenCookieName] || req.body?.refreshToken;
      const userId = req.user?.userId;

      await authService.logout(refreshToken, userId, req.requestId);
      clearAuthCookies(res);

      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await authService.logoutAll(req.user.userId, req.requestId);
      clearAuthCookies(res);

      sendSuccess(res, null, 'All sessions successfully revoked across all devices');
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await authService.getMe(req.user.userId);
      sendSuccess(res, result, 'User profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email, req.requestId);
      sendSuccess(
        res,
        null,
        'If an account with this email exists, password reset instructions have been sent.'
      );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password, req.requestId);
      sendSuccess(res, null, 'Password reset successful. You may now log in with your new password.');
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.verifyEmail(req.body.token, req.requestId);
      sendSuccess(res, null, 'Email address verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resendVerification(req.body.email);
      sendSuccess(res, null, 'Verification email sent if account is unverified');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

