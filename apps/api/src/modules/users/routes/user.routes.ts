import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const userRoutes = Router();

userRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { module: 'Users', status: 'scaffolded', milestone: 'Day 2' }, 'Users module ready');
});

