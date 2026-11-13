import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const laboratoryRoutes = Router();

laboratoryRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { module: 'Laboratory', status: 'scaffolded', milestone: 'Day 2' }, 'Laboratory module ready');
});
