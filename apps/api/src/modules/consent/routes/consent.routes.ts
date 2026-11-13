import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';

export const consentRoutes = Router();

consentRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    { module: 'Consent', status: 'scaffolded', milestone: 'Day 2' },
    'Consent module ready'
  );
});
