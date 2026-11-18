import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';

export const prescriptionRoutes = Router();

prescriptionRoutes.use(authenticate);
prescriptionRoutes.use(authorize(['PATIENT', 'DOCTOR', 'PHARMACY']));

prescriptionRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    { module: 'Prescriptions', status: 'active' },
    'Prescriptions endpoint authorized'
  );
});
