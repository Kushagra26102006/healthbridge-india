import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const doctorRoutes = Router();

doctorRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { module: 'Doctors', status: 'scaffolded', milestone: 'Day 2' }, 'Doctors module ready');
});
