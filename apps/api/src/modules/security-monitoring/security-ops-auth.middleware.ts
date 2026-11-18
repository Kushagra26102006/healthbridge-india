/**
 * HealthBridge India — Security Operations Permission Middleware (Day 9 Task 04)
 *
 * Enforces least-privilege separation of duties:
 *   - Ordinary ADMIN users do NOT automatically receive SecOps permissions.
 *   - Checks AdminProfileModel.permissions explicitly for the required SecurityOpsPermission.
 *   - Separates read/manage permissions from active incident response (SECURITY_INCIDENTS_RESPOND).
 */

import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../shared/errors/app-error';
import { AdminProfileModel } from '../users/models/admin-profile.model';
import { securityAuditMonitor } from '../../security/security-audit.monitor';
import type { SecurityOpsPermission } from './security-event.types';

export async function resolveAdminSecOpsPermissions(userId: string): Promise<Set<string>> {
  const queryId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
  const profile = await AdminProfileModel.findOne({ userId: queryId }).catch(() => null);
  if (!profile || !Array.isArray(profile.permissions)) {
    return new Set();
  }
  return new Set(profile.permissions);
}

export const requireSecurityOpsPermission = (required: SecurityOpsPermission) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required.'));
      }

      if (req.user.role !== 'ADMIN') {
        void securityAuditMonitor.record({
          actorId: req.user.userId,
          actorRole: req.user.role,
          action: 'PERMISSION_DENIED',
          resourceType: 'SECURITY_OPERATIONS',
          resourceId: req.originalUrl,
          requestId: req.requestId,
          outcome: 'BLOCKED',
          metadata: { requiredPermission: required, reason: 'Non-admin role blocked' },
        });
        return next(AppError.forbidden('Access denied: Security Operations requires authorized admin permissions.'));
      }

      const granted = await resolveAdminSecOpsPermissions(req.user.userId);
      if (!granted.has(required)) {
        void securityAuditMonitor.record({
          actorId: req.user.userId,
          actorRole: 'ADMIN',
          action: 'PERMISSION_DENIED',
          resourceType: 'SECURITY_OPERATIONS',
          resourceId: req.originalUrl,
          requestId: req.requestId,
          outcome: 'BLOCKED',
          metadata: {
            requiredPermission: required,
            reason: 'Admin lacks explicit SecOps permission grant',
          },
        });
        return next(
          AppError.forbidden(
            `Access denied: Your admin profile does not hold required security permission '${required}'.`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
