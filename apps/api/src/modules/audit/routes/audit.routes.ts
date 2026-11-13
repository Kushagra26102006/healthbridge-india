import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const auditRoutes = Router();

auditRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, { module: 'Audit', status: 'scaffolded', milestone: 'Day 2' }, 'Audit module ready');
});

