import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';
import { authenticate } from '../../../middleware/authenticate';
import { requirePermission } from '../../../security/authorization.policy';

export const auditRoutes = Router();

auditRoutes.use(authenticate);
auditRoutes.use(requirePermission('admin:audit:read'));

auditRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    { module: 'Audit', status: 'active', accessPolicy: 'ADMIN_AUDIT_ONLY' },
    'Audit module authorized'
  );
});
