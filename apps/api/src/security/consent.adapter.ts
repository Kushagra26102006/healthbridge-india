/**
 * HealthBridge India — Consent Enforcement Security Adapter (Day 9 Task 01)
 *
 * Wraps the authoritative ConsentEnforcementService to enforce:
 *   - Fail-closed behavior when consent cannot be verified
 *   - Immediate synchronous revocation enforcement (zero reliance on async workers)
 *   - Explicit non-unrestricted ADMIN clinical access boundary (requires explicit
 *     compliance/break-glass purpose rather than silent unrestricted clinical reads)
 */

import type { UserRole } from '@healthbridge/shared-types';
import { AppError } from '../shared/errors/app-error';
import {
  consentEnforcementService,
  type ConsentValidationOptions,
  type ConsentValidationResult,
} from '../modules/consent/services/consent-enforcement.service';
import { securityAuditMonitor } from './security-audit.monitor';

export interface ClinicalConsentCheckInput extends ConsentValidationOptions {
  requesterRole: UserRole;
  adminBreakGlassReason?: string;
}

export class ConsentSecurityAdapter {
  /**
   * Evaluates consent-aware clinical data access and fails closed on any missing,
   * expired, revoked, or category-mismatched consent.
   */
  async evaluateClinicalAccess(
    input: ClinicalConsentCheckInput
  ): Promise<ConsentValidationResult> {
    const { requesterId, requesterRole, patientId, dataCategory, requestId, adminBreakGlassReason } =
      input;

    // 1. Patient self-access is always permitted
    if (String(requesterId) === String(patientId)) {
      return { authorized: true };
    }

    // 2. Administrators do NOT receive automatic unrestricted clinical access.
    // Any clinical inspection by ADMIN must supply an explicit compliance/break-glass reason
    // and is recorded as a high-visibility audit event.
    if (requesterRole === 'ADMIN') {
      if (!adminBreakGlassReason || adminBreakGlassReason.trim().length < 10) {
        await securityAuditMonitor.record({
          actorId: requesterId,
          actorRole: 'ADMIN',
          action: 'CONSENT_ACCESS_DENIED',
          resourceType: dataCategory,
          resourceId: patientId,
          requestId,
          outcome: 'BLOCKED',
          metadata: {
            reason: 'Admin unrestricted clinical access denied (missing audited compliance justification)',
          },
        });

        return {
          authorized: false,
          reason:
            'Access denied: Administrators do not have automatic unrestricted access to patient clinical records.',
        };
      }

      await securityAuditMonitor.record({
        actorId: requesterId,
        actorRole: 'ADMIN',
        action: 'SENSITIVE_RECORD_ACCESSED',
        resourceType: dataCategory,
        resourceId: patientId,
        requestId,
        outcome: 'SUCCESS',
        metadata: {
          mode: 'AUDITED_COMPLIANCE_INSPECTION',
          justificationLength: adminBreakGlassReason.trim().length,
        },
      });
      return { authorized: true };
    }

    // 3. Delegate to authoritative ConsentEnforcementService (checks synchronous revocation barrier,
    //    expiry, status, and resource category — failing closed if unverifiable).
    try {
      const result = await consentEnforcementService.validateAccess(input);
      if (!result.authorized) {
        await securityAuditMonitor.record({
          actorId: requesterId,
          actorRole: requesterRole,
          action: 'CONSENT_ACCESS_DENIED',
          resourceType: dataCategory,
          resourceId: patientId,
          requestId,
          outcome: 'BLOCKED',
          metadata: { reason: result.reason || 'Consent check failed' },
        });
      }
      return result;
    } catch {
      // Fail closed if consent backend errors or cannot be verified
      await securityAuditMonitor.record({
        actorId: requesterId,
        actorRole: requesterRole,
        action: 'CONSENT_ACCESS_DENIED',
        resourceType: dataCategory,
        resourceId: patientId,
        requestId,
        outcome: 'BLOCKED',
        metadata: { reason: 'Fail-closed: Consent state could not be verified' },
      });

      return {
        authorized: false,
        reason: 'Access denied: Consent authorization could not be verified (fail-closed).',
      };
    }
  }

  /**
   * Throws 403 FORBIDDEN immediately if evaluateClinicalAccess returns unauthorized.
   */
  async enforceOrThrow(input: ClinicalConsentCheckInput): Promise<ConsentValidationResult> {
    const verdict = await this.evaluateClinicalAccess(input);
    if (!verdict.authorized) {
      throw AppError.forbidden(
        verdict.reason || 'Access denied: Valid patient consent is required.'
      );
    }
    return verdict;
  }

  /**
   * Synchronously invalidates a revoked consent ID so subsequent access checks fail
   * immediately without waiting for asynchronous outbox/event workers.
   */
  invalidateImmediately(patientId: string, requesterId?: string, consentId?: string): void {
    consentEnforcementService.invalidateConsentImmediately(patientId, requesterId, consentId);
  }
}

export const consentSecurityAdapter = new ConsentSecurityAdapter();
export default consentSecurityAdapter;
