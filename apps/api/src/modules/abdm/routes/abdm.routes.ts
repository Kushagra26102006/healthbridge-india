import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const abdmRoutes = Router();

abdmRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { module: 'ABDM', status: 'scaffolded', milestone: 'Day 2' }, 'ABDM module ready');
});
