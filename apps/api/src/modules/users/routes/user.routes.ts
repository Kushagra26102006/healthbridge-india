import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';
import { authenticate } from '../../../middleware/authenticate';
import { requirePermission } from '../../../security/authorization.policy';

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.use(requirePermission('admin:users:manage'));

userRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    { module: 'Users', status: 'active', accessPolicy: 'ADMIN_ONLY' },
    'Users administration endpoint authorized'
  );
});
