import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const patientRoutes = Router();

patientRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    { module: 'Patients', status: 'scaffolded', milestone: 'Day 2' },
    'Patients module ready'
  );
});
