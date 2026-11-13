import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const appointmentRoutes = Router();

appointmentRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { module: 'Appointments', status: 'scaffolded', milestone: 'Day 2' }, 'Appointments module ready');
});
