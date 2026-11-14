import { Request, Response } from 'express';
import { doctorScheduleService } from '../services/doctor-schedule.service';
import { sendSuccess } from '../../../utils/api-response';
import { asyncHandler } from '../../../utils/async-handler';
import { HttpStatus } from '../../../shared/constants/http-status';
import type {
  UpdateDoctorWeeklyScheduleInput,
  BlockDateRequestInput,
  ScheduleOverrideInput,
  ScheduleCalendarQueryInput,
  ScheduleAvailabilityQueryInput,
} from '@healthbridge/validation';

export class DoctorScheduleController {
  /**
   * GET /api/v1/doctors/schedule
   * Get full doctor schedule configuration
   */
  getSchedule = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const schedule = await doctorScheduleService.getSchedule(userId);
    sendSuccess(res, schedule, 'Doctor schedule retrieved successfully');
  });

  /**
   * PUT /api/v1/doctors/schedule
   * Update doctor weekly schedule, working windows, breaks, and consultation settings
   */
  updateSchedule = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const body = req.body as UpdateDoctorWeeklyScheduleInput;
    const updated = await doctorScheduleService.updateWeeklySchedule(userId, body);
    sendSuccess(res, updated, 'Doctor schedule updated successfully');
  });

  /**
   * GET /api/v1/doctors/schedule/overview
   * Get schedule summary metrics for today and the upcoming week
   */
  getOverview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const overview = await doctorScheduleService.getScheduleOverview(userId);
    sendSuccess(res, overview, 'Doctor schedule overview retrieved successfully');
  });

  /**
   * GET /api/v1/doctors/schedule/availability
   * Query doctor consultation slot availability for a target date
   */
  getAvailability = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const query = req.query as unknown as ScheduleAvailabilityQueryInput;
    const availability = await doctorScheduleService.getDoctorAvailabilitySlots(
      userId,
      query.date,
      query.consultationType,
      query.facilityId
    );
    sendSuccess(res, availability, 'Doctor availability slots retrieved successfully');
  });

  /**
   * GET /api/v1/doctors/schedule/calendar
   * Query aggregated calendar view (day, week, month)
   */
  getCalendar = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const query = req.query as unknown as ScheduleCalendarQueryInput;
    const calendar = await doctorScheduleService.getCalendarView(userId, query);
    sendSuccess(res, calendar, 'Doctor schedule calendar retrieved successfully');
  });

  /**
   * GET /api/v1/doctors/schedule/blocked-dates
   * Get all blocked dates and leave periods
   */
  getBlockedDates = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const blockedDates = await doctorScheduleService.getBlockedDates(userId);
    sendSuccess(res, blockedDates, 'Blocked dates retrieved successfully');
  });

  /**
   * POST /api/v1/doctors/schedule/blocked-dates
   * Block a full day, partial day, or date range with conflict detection
   */
  createBlockedDate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const body = req.body as BlockDateRequestInput;
    const result = await doctorScheduleService.createBlockedDate(userId, body);

    const statusCode = result.hasConflicts && !result.success ? HttpStatus.CONFLICT : HttpStatus.CREATED;
    sendSuccess(res, result, result.message, statusCode);
  });

  /**
   * DELETE /api/v1/doctors/schedule/blocked-dates/:blockId
   * Delete a blocked date / leave entry
   */
  deleteBlockedDate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const blockId = String(req.params.blockId);
    await doctorScheduleService.deleteBlockedDate(userId, blockId);
    sendSuccess(res, { success: true }, 'Blocked date removed successfully');
  });

  /**
   * GET /api/v1/doctors/schedule/overrides
   * Get all special working day overrides
   */
  getOverrides = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const overrides = await doctorScheduleService.getScheduleOverrides(userId);
    sendSuccess(res, overrides, 'Schedule overrides retrieved successfully');
  });

  /**
   * POST /api/v1/doctors/schedule/overrides
   * Create or update a special working day override
   */
  createOverride = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const body = req.body as ScheduleOverrideInput;
    const override = await doctorScheduleService.createScheduleOverride(userId, body);
    sendSuccess(res, override, 'Schedule override saved successfully', HttpStatus.CREATED);
  });

  /**
   * DELETE /api/v1/doctors/schedule/overrides/:overrideId
   * Delete a special working day override
   */
  deleteOverride = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const overrideId = String(req.params.overrideId);
    await doctorScheduleService.deleteScheduleOverride(userId, overrideId);
    sendSuccess(res, { success: true }, 'Schedule override removed successfully');
  });

  /**
   * GET /api/v1/doctors/schedule/facilities
   * Retrieve facilities associated with doctor
   */
  getFacilities = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const facilities = await doctorScheduleService.getDoctorFacilities(userId);
    sendSuccess(res, facilities, 'Doctor facilities retrieved successfully');
  });
}

export const doctorScheduleController = new DoctorScheduleController();
export default doctorScheduleController;
