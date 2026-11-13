import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const prescriptionRoutes = Router();

prescriptionRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { module: 'Prescriptions', status: 'scaffolded', milestone: 'Day 2' }, 'Prescriptions module ready');
});

