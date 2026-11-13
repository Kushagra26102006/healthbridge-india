import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const recordRoutes = Router();

recordRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { module: 'Records', status: 'scaffolded', milestone: 'Day 2' }, 'Records module ready');
});
