import { Request, Response, NextFunction } from 'express';
import { patientProfileService } from '../services/patient-profile.service';
import { sendSuccess } from '../../../utils/api-response';
import { hashToken } from '../../auth/utils/crypto.util';
import { AUTH_CONFIG } from '@healthbridge/config';

export class PatientProfileController {
  private getCurrentTokenHash(req: Request): string | undefined {
    const rawRefreshToken =
      req.cookies?.[AUTH_CONFIG.refreshTokenCookieName] || req.body?.refreshToken;
    return rawRefreshToken ? hashToken(rawRefreshToken) : undefined;
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await patientProfileService.getProfile(userId);
      sendSuccess(res, profile, 'Patient profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await patientProfileService.updateProfile(userId, req.body, req.requestId);
      sendSuccess(res, updated, 'Patient profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await patientProfileService.changePassword(userId, req.body, req.requestId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tokenHash = this.getCurrentTokenHash(req);
      const sessions = await patientProfileService.getSessions(userId, tokenHash);
      sendSuccess(res, sessions, 'Active sessions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const sessionId = req.params.sessionId as string;
      const result = await patientProfileService.revokeSession(userId, sessionId, req.requestId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async revokeOtherSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tokenHash = this.getCurrentTokenHash(req);
      const result = await patientProfileService.revokeOtherSessions(userId, tokenHash, req.requestId);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const prefs = await patientProfileService.getNotificationPreferences(userId);
      sendSuccess(res, prefs, 'Notification preferences retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await patientProfileService.updateNotificationPreferences(
        userId,
        req.body,
        req.requestId
      );
      sendSuccess(res, updated, 'Notification preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const patientProfileController = new PatientProfileController();
export default patientProfileController;
