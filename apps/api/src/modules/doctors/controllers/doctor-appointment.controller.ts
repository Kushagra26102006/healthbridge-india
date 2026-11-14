import { Request, Response, NextFunction } from 'express';
import { doctorAppointmentService } from '../services/doctor-appointment.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import type { DoctorAppointmentFilterQueryDto } from '@healthbridge/shared-types';

export class DoctorAppointmentController {
  /**
   * GET /api/v1/doctors/appointments/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await doctorAppointmentService.getSummaryCounts(userId);
      sendSuccess(res, summary, 'Appointment summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/appointments
   */
  async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const filters = req.query as unknown as DoctorAppointmentFilterQueryDto;
      const result = await doctorAppointmentService.getAppointments(userId, filters);
      sendSuccess(res, result.items, 'Appointments retrieved successfully', HttpStatus.OK, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/appointments/:appointmentId
   */
  async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { appointmentId } = req.params;
      const appointment = await doctorAppointmentService.getAppointmentById(userId, appointmentId!);
      sendSuccess(res, appointment, 'Appointment details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/doctors/appointments/:appointmentId/confirm
   */
  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { appointmentId } = req.params;
      const updated = await doctorAppointmentService.confirmAppointment(userId, appointmentId!);
      sendSuccess(res, updated, 'Appointment confirmed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/doctors/appointments/:appointmentId/reject
   */
  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { appointmentId } = req.params;
      const { reason } = req.body;
      const updated = await doctorAppointmentService.rejectAppointment(userId, appointmentId!, reason);
      sendSuccess(res, updated, 'Appointment rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/doctors/appointments/:appointmentId/check-in
   */
  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { appointmentId } = req.params;
      const updated = await doctorAppointmentService.checkInPatient(userId, appointmentId!);
      sendSuccess(res, updated, 'Patient checked in successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/doctors/appointments/:appointmentId/start
   */
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { appointmentId } = req.params;
      const updated = await doctorAppointmentService.startConsultation(userId, appointmentId!);
      sendSuccess(res, updated, 'Consultation started successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/doctors/appointments/:appointmentId/complete
   */
  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { appointmentId } = req.params;
      const updated = await doctorAppointmentService.completeConsultation(userId, appointmentId!);
      sendSuccess(res, updated, 'Consultation completed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/doctors/appointments/:appointmentId/cancel
   */
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { appointmentId } = req.params;
      const { reason } = req.body;
      const updated = await doctorAppointmentService.cancelAppointment(userId, appointmentId!, reason);
      sendSuccess(res, updated, 'Appointment cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/doctors/queue
   */
  async getQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const filter = req.query.filter as string | undefined;
      const queue = await doctorAppointmentService.getDailyQueue(userId, filter);
      sendSuccess(res, queue, 'Daily patient queue retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/doctors/schedule
   */
  async updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await doctorAppointmentService.updateDoctorSchedule(userId, req.body);
      sendSuccess(res, updated, 'Schedule and availability updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const doctorAppointmentController = new DoctorAppointmentController();
