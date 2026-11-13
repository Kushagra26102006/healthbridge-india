import { Request, Response } from 'express';
import { appointmentService } from '../services/appointment.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import { asyncHandler } from '../../../utils/async-handler';
import { AppError } from '../../../shared/errors/app-error';
import type {
  CreateAppointmentInput,
  CancelAppointmentInput,
  RescheduleAppointmentInput,
  AppointmentFilterQueryInput,
} from '@healthbridge/validation';

export class AppointmentController {
  /**
   * GET /api/v1/appointments
   * Retrieves paginated appointments for authenticated patient
   */
  getAppointments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access appointments');
    }

    const query = req.query as unknown as AppointmentFilterQueryInput;
    const result = await appointmentService.getPatientAppointments(
      req.user.userId,
      query
    );

    sendSuccess(
      res,
      result.items,
      'Appointments retrieved successfully',
      HttpStatus.OK,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      }
    );
  });

  /**
   * GET /api/v1/appointments/:appointmentId
   * Retrieves single appointment details with strict patient ownership check
   */
  getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access appointment details');
    }

    const appointmentId = String(req.params.appointmentId);
    const appointment = await appointmentService.getPatientAppointmentById(
      req.user.userId,
      appointmentId
    );

    sendSuccess(res, appointment, 'Appointment details retrieved successfully');
  });

  /**
   * POST /api/v1/appointments
   * Atomically books an appointment with slot concurrency check
   */
  bookAppointment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to book an appointment');
    }

    const body = req.body as CreateAppointmentInput;
    const appointment = await appointmentService.bookAppointment(
      req.user.userId,
      body
    );

    sendSuccess(
      res,
      appointment,
      'Appointment successfully booked and confirmed',
      HttpStatus.CREATED
    );
  });

  /**
   * PATCH /api/v1/appointments/:appointmentId/cancel
   * Cancels an appointment according to healthcare policy
   */
  cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to cancel an appointment');
    }

    const appointmentId = String(req.params.appointmentId);
    const body = req.body as CancelAppointmentInput;
    const updated = await appointmentService.cancelAppointment(
      req.user.userId,
      appointmentId,
      body
    );

    sendSuccess(res, updated, 'Appointment cancelled successfully');
  });

  /**
   * PATCH /api/v1/appointments/:appointmentId/reschedule
   * Reschedules an appointment to a new slot
   */
  rescheduleAppointment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to reschedule an appointment');
    }

    const appointmentId = String(req.params.appointmentId);
    const body = req.body as RescheduleAppointmentInput;
    const updated = await appointmentService.rescheduleAppointment(
      req.user.userId,
      appointmentId,
      body
    );

    sendSuccess(res, updated, 'Appointment rescheduled successfully');
  });
}

export const appointmentController = new AppointmentController();
export default appointmentController;

