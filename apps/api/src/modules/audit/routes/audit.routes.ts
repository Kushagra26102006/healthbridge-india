/**
 * HealthBridge India — Read-Only Centralized Audit Log Routes (Phase 18)
 *
 * Mounted at `/api/v1/audit`.
 * Strictly read-only: NO PUT, PATCH, or DELETE routes exist.
 * Enforces `authenticate` + `requirePermission('admin:audit:read')` + burst rate limit.
 */

import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';
import { asyncHandler } from '../../../utils/async-handler';
import { authenticate } from '../../../middleware/authenticate';
import { createRateLimiter } from '../../../middleware/rate-limit';
import { requirePermission } from '../../../security/authorization.policy';
import { auditLogQuerySchema, auditLogQueryService } from '../services/audit.service';

const auditReadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Audit query rate limit exceeded. Please retry shortly.',
});

export const auditRoutes = Router();

auditRoutes.use(authenticate);
auditRoutes.use(requirePermission('admin:audit:read'));
auditRoutes.use(auditReadLimiter);

// Module status metadata (backward-compatible)
auditRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      module: 'Audit',
      status: 'active',
      accessPolicy: 'ADMIN_AUDIT_READ_ONLY',
      immutabilityEnforced: true,
    },
    'Audit module authorized'
  );
});

// Summary aggregate counters
auditRoutes.get(
  '/summary',
  asyncHandler(async (_req: Request, res: Response) => {
    const summary = await auditLogQueryService.getSummary();
    sendSuccess(res, summary, 'Audit log summary retrieved');
  })
);

// Paginated, searchable, redacted immutable audit logs
auditRoutes.get(
  '/logs',
  asyncHandler(async (req: Request, res: Response) => {
    const query = auditLogQuerySchema.parse(req.query);
    const result = await auditLogQueryService.listLogs(query);
    sendSuccess(res, result, 'Audit logs retrieved');
  })
);

// Redacted CSV export (formula-injection protected, self-audited)
auditRoutes.get(
  '/export',
  asyncHandler(async (req: Request, res: Response) => {
    const query = auditLogQuerySchema.parse(req.query);
    const { csv } = await auditLogQueryService.exportRedactedCsv(query, {
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      requestId: req.requestId,
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="healthbridge_audit_logs_${dateStamp}.csv"`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.status(200).send(csv);
  })
);

// Single immutable audit log detail
auditRoutes.get(
  '/logs/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const item = await auditLogQueryService.getLogById(String(req.params.id));
    sendSuccess(res, item, 'Audit log record retrieved');
  })
);
