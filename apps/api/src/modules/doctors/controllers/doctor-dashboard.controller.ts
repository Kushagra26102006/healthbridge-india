import { Request, Response, NextFunction } from 'express';
import { doctorDashboardService } from '../services/doctor-dashboard.service';
import { sendSuccess } from '../../../utils/api-response';

export class DoctorDashboardController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await doctorDashboardService.getDoctorProfile(userId);
      sendSuccess(res, profile, 'Doctor professional profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await doctorDashboardService.updateDoctorProfile(userId, req.body, req.requestId);
      sendSuccess(res, updated, 'Doctor professional profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await doctorDashboardService.getDashboardSummary(userId);
      sendSuccess(res, summary, 'Doctor clinical dashboard summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTodayAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const filter = req.query.filter as string | undefined;
      const appointments = await doctorDashboardService.getTodayAppointments(userId, filter);
      sendSuccess(res, appointments, "Today's clinical appointments retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = Number(req.query.limit) || 20;
      const appointments = await doctorDashboardService.getUpcomingAppointments(userId, limit);
      sendSuccess(res, appointments, 'Upcoming clinical appointments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAssignedPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const search = req.query.search as string | undefined;
      const patients = await doctorDashboardService.getAssignedPatients(userId, search);
      sendSuccess(res, patients, 'Assigned patient roster retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const schedule = await doctorDashboardService.getDoctorSchedule(userId);
      sendSuccess(res, schedule, 'Doctor clinical schedule retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPracticeSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const settings = await doctorDashboardService.getPracticeSettings(userId);
      sendSuccess(res, settings, 'Practice settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePracticeSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await doctorDashboardService.updatePracticeSettings(userId, req.body, req.requestId);
      sendSuccess(res, updated, 'Practice settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const prefs = await doctorDashboardService.getNotificationPreferences(userId);
      sendSuccess(res, prefs, 'Doctor notification preferences retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await doctorDashboardService.updateNotificationPreferences(userId, req.body, req.requestId);
      sendSuccess(res, updated, 'Doctor notification preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const docs = await doctorDashboardService.getDocuments(userId);
      sendSuccess(res, docs, 'Doctor credential documents retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const doc = await doctorDashboardService.uploadDocument(userId, req.body, req.requestId);
      sendSuccess(res, doc, 'Credential document uploaded for verification', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const docId = req.params.docId as string;
      const result = await doctorDashboardService.deleteDocument(userId, docId, req.requestId);
      sendSuccess(res, result, 'Credential document removed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tokenHash = (req as any).tokenHash || req.cookies?.hb_refresh_hash;
      const sessions = await doctorDashboardService.getSessions(userId, tokenHash);
      sendSuccess(res, sessions, 'Active doctor sessions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const sessionId = req.params.sessionId as string;
      const result = await doctorDashboardService.revokeSession(userId, sessionId, req.requestId);
      sendSuccess(res, result, 'Session terminated successfully');
    } catch (error) {
      next(error);
    }
  }

  async revokeOtherSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tokenHash = (req as any).tokenHash || req.cookies?.hb_refresh_hash;
      const result = await doctorDashboardService.revokeOtherSessions(userId, tokenHash, req.requestId);
      sendSuccess(res, result, 'All other sessions revoked successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await doctorDashboardService.changePassword(userId, req.body, req.requestId);
      sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const doctorDashboardController = new DoctorDashboardController();
export default doctorDashboardController;

