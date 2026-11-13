import { Request, Response } from 'express';
import { doctorService } from '../services/doctor.service';
import { sendSuccess } from '../../../utils/api-response';
import { asyncHandler } from '../../../utils/async-handler';
import { HttpStatus } from '../../../shared/constants/http-status';
import type { DoctorFilterQueryInput } from '@healthbridge/validation';

export class DoctorController {
  getDoctors = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as DoctorFilterQueryInput;
    const result = await doctorService.getDoctors(query);

    sendSuccess(
      res,
      result.items,
      'Doctors retrieved successfully',
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

  getDoctorById = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = String(req.params.doctorId);
    const doctor = await doctorService.getDoctorById(doctorId);
    sendSuccess(res, doctor, 'Doctor profile retrieved successfully');
  });

  getAvailability = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = String(req.params.doctorId);
    const dateStr = String(req.query.date || new Date().toISOString().split('T')[0]);
    const schedule = await doctorService.getDoctorAvailability(doctorId, dateStr);
    sendSuccess(res, schedule, 'Doctor availability slots retrieved successfully');
  });
}

export const doctorController = new DoctorController();
export default doctorController;

