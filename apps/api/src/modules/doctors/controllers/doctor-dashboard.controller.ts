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
}

export const doctorDashboardController = new DoctorDashboardController();
export default doctorDashboardController;

