/**
 * HealthBridge India — Centralized Authorization Policy & Resource Ownership Checker (Day 9 Task 01)
 *
 * Separates authentication (who the actor is) from authorization (what the actor may access/perform).
 * Combines:
 *   1. Role permission verification (ROLE_PERMISSION_REGISTRY)
 *   2. Resource ownership verification (strict patient/user isolation)
 *   3. Organization / Facility scope verification (pharmacyId, laboratoryId)
 *   4. Automatic audit logging on permission denials
 */

import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedUser, UserRole } from '@healthbridge/shared-types';
import { AppError } from '../shared/errors/app-error';
import { hasRolePermission, type SecurityPermission } from './permissions.registry';
import { securityAuditMonitor } from './security-audit.monitor';

export interface OwnershipCheckInput {
  actor: Pick<AuthenticatedUser, 'userId' | 'role'>;
  ownerId: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
}

export interface FacilityScopeCheckInput {
  actor: Pick<AuthenticatedUser, 'userId' | 'role'>;
  actorFacilityId: string;
  resourceFacilityId: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
}

/**
 * Express middleware enforcing a fine-grained named SecurityPermission from ROLE_PERMISSION_REGISTRY.
 * Logs every permission denial via securityAuditMonitor.
 */
export const requirePermission = (permission: SecurityPermission) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!hasRolePermission(req.user.role, permission)) {
      void securityAuditMonitor.record({
        actorId: req.user.userId,
        actorRole: req.user.role,
        action: 'PERMISSION_DENIED',
        resourceType: permission.split(':')[0]?.toUpperCase() || 'API',
        resourceId: req.originalUrl,
        requestId: req.requestId,
        outcome: 'BLOCKED',
        metadata: { requiredPermission: permission, method: req.method },
      });

      return next(
        AppError.forbidden(
          `Access forbidden: Role '${req.user.role}' lacks permission '${permission}'`
        )
      );
    }

    next();
  };
};

/**
 * Strictly enforces that the authenticated actor owns the requested resource.
 * Never grants implicit bypass to non-owners (including ADMIN for personal clinical resources).
 */
export function assertResourceOwnership(input: OwnershipCheckInput): void {
  const { actor, ownerId, resourceType, resourceId, requestId } = input;

  if (!actor?.userId || !ownerId || String(actor.userId) !== String(ownerId)) {
    void securityAuditMonitor.record({
      actorId: actor?.userId,
      actorRole: actor?.role,
      action: 'OWNERSHIP_VIOLATION',
      resourceType,
      resourceId,
      requestId,
      outcome: 'BLOCKED',
      metadata: { reason: 'Cross-user resource ownership mismatch' },
    });

    throw AppError.forbidden(
      `Access denied: You do not own this ${resourceType.toLowerCase()} resource.`
    );
  }
}

/**
 * Strictly enforces organization / facility tenant isolation (e.g., Pharmacy A vs Pharmacy B,
 * Laboratory A vs Laboratory B).
 */
export function assertFacilityScope(input: FacilityScopeCheckInput): void {
  const { actor, actorFacilityId, resourceFacilityId, resourceType, resourceId, requestId } = input;

  if (!actorFacilityId || !resourceFacilityId || String(actorFacilityId) !== String(resourceFacilityId)) {
    void securityAuditMonitor.record({
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'OWNERSHIP_VIOLATION',
      resourceType,
      resourceId,
      requestId,
      outcome: 'BLOCKED',
      metadata: { reason: 'Cross-facility scope violation' },
    });

    throw AppError.forbidden(
      `Access denied: Resource does not belong to your authorized ${actor.role.toLowerCase()} facility.`
    );
  }
}

/**
 * Helper verifying whether an actor role is allowed to access clinical data without consent.
 * Always returns false for ADMIN (administrators have operational governance permissions,
 * never unrestricted access to private patient clinical records).
 */
export function hasUnrestrictedClinicalAccess(_role: UserRole): boolean {
  return false;
}
