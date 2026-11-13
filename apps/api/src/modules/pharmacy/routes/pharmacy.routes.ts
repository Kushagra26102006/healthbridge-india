import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const pharmacyRoutes = Router();

pharmacyRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    { module: 'Pharmacy', status: 'scaffolded', milestone: 'Day 2' },
    'Pharmacy module ready'
  );
});
