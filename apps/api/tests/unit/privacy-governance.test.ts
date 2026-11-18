/**
 * HealthBridge India — Privacy Governance, Purpose-Based Access & Retention Unit Tests (Day 9 Task 02)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import {
  DATA_CLASSIFICATION_REGISTRY,
  DATA_RETENTION_POLICIES,
  evaluateDeletionEligibility,
  getCurrentPrivacyNotice,
} from '../../src/modules/privacy/data-governance.registry';
import { purposeBasedAccessService } from '../../src/modules/privacy/purpose-access.policy';
import { DataAccessEventModel } from '../../src/modules/privacy/models/data-access-event.model';
import { ConsentArtifactModel } from '../../src/modules/consent/models/consent-artifact.model';
import { consentEnforcementService } from '../../src/modules/consent/services/consent-enforcement.service';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';

describe('Healthcare Data Privacy & Governance — Unit Tests (Day 9 Task 02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    consentEnforcementService.clearRevocationBarrier();
  });

  describe('1. Data Classification & Retention Governance', () => {
    it('classifies all 6 data tiers and excludes authentication/security secrets from export', () => {
      expect(Object.keys(DATA_CLASSIFICATION_REGISTRY).sort()).toEqual([
        'AUTHENTICATION_AND_SECURITY',
        'EXTERNAL_INTEGRATION',
        'INTERNAL',
        'PERSONAL',
        'PUBLIC',
        'SENSITIVE_HEALTH_INFORMATION',
      ]);

      expect(DATA_CLASSIFICATION_REGISTRY.AUTHENTICATION_AND_SECURITY.exportEligible).toBe(false);
      expect(DATA_CLASSIFICATION_REGISTRY.AUTHENTICATION_AND_SECURITY.deletionEligible).toBe(
        'NON_DELETABLE_AUDIT'
      );
      expect(DATA_CLASSIFICATION_REGISTRY.SENSITIVE_HEALTH_INFORMATION.deletionEligible).toBe(
        'RESTRICTED_RETENTION'
      );
    });

    it('separates all 10 retention categories and never auto-deletes finalized clinical records or active legal holds', () => {
      expect(DATA_RETENTION_POLICIES).toHaveLength(10);

      const noHold = evaluateDeletionEligibility([]);
      expect(noHold.legalHoldBlocked).toBe(false);
      expect(noHold.retentionBlockedCategories).toContain('CLINICAL_RECORDS');
      expect(noHold.retentionBlockedCategories).toContain('PRESCRIPTIONS');
      expect(noHold.retentionBlockedCategories).toContain('LABORATORY_REPORTS');
      expect(noHold.retentionBlockedCategories).toContain('AUDIT_LOGS');
      expect(noHold.eligibleCategories).toContain('ACCOUNT_INFORMATION');
      expect(noHold.backupCaveat).toMatch(/backups/i);
      expect(noHold.externalIntegrationCaveat).toMatch(/external hospitals/i);

      const withHold = evaluateDeletionEligibility(['HOLD-2026-ABC123']);
      expect(withHold.legalHoldBlocked).toBe(true);
      expect(withHold.eligibleCategories).toHaveLength(0);
      expect(withHold.activeLegalHoldIds).toEqual(['HOLD-2026-ABC123']);
    });

    it('publishes plain-language versioned privacy notice without fabricated legal contacts', () => {
      const notice = getCurrentPrivacyNotice();
      expect(notice.version).toBeTruthy();
      expect(notice.reviewStatus).toBe('DRAFT_PENDING_LEGAL_COUNSEL_REVIEW');
      expect(notice.sections.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('2. Purpose-Based Access Control & Transparency Ledger', () => {
    const patientAId = new Types.ObjectId().toString();
    const patientBId = new Types.ObjectId().toString();
    const doctorId = new Types.ObjectId().toString();
    const pharmacyId = new Types.ObjectId().toString();
    const labId = new Types.ObjectId().toString();
    const adminId = new Types.ObjectId().toString();

    it('allows PATIENT_SELF_ACCESS for own records and denies cross-patient self-access while logging both', async () => {
      const accessLogSpy = vi.spyOn(DataAccessEventModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      const own = await purposeBasedAccessService.evaluate({
        actorId: patientAId,
        actorRole: 'PATIENT',
        patientId: patientAId,
        resourceCategory: 'MEDICAL_RECORDS',
        purpose: 'PATIENT_SELF_ACCESS',
      });
      expect(own.allowed).toBe(true);
      expect(own.lawfulBasis).toBe('PATIENT_SELF_ACCESS');

      const other = await purposeBasedAccessService.evaluate({
        actorId: patientAId,
        actorRole: 'PATIENT',
        patientId: patientBId,
        resourceCategory: 'MEDICAL_RECORDS',
        purpose: 'PATIENT_SELF_ACCESS',
      });
      expect(other.allowed).toBe(false);
      expect(other.decision).toBe('DENIED');

      expect(accessLogSpy).toHaveBeenCalledTimes(2);
      expect(accessLogSpy.mock.calls[0][0]).toMatchObject({ authorizationDecision: 'ALLOWED' });
      expect(accessLogSpy.mock.calls[1][0]).toMatchObject({ authorizationDecision: 'DENIED' });
    });

    it('allows scoped PHARMACY_FULFILLMENT and LABORATORY_SERVICE orders without blanket consent, but fails closed without active order scope', async () => {
      vi.spyOn(DataAccessEventModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      const pharmScoped = await purposeBasedAccessService.evaluate({
        actorId: pharmacyId,
        actorRole: 'PHARMACY',
        patientId: patientAId,
        resourceCategory: 'PRESCRIPTIONS',
        purpose: 'PHARMACY_FULFILLMENT',
        hasActiveCareOrderScope: true,
      });
      expect(pharmScoped.allowed).toBe(true);
      expect(pharmScoped.lawfulBasis).toBe('ACTIVE_CARE_ORDER_FULFILLMENT');

      const pharmUnscoped = await purposeBasedAccessService.evaluate({
        actorId: pharmacyId,
        actorRole: 'PHARMACY',
        patientId: patientAId,
        resourceCategory: 'PRESCRIPTIONS',
        purpose: 'PHARMACY_FULFILLMENT',
        hasActiveCareOrderScope: false,
      });
      expect(pharmUnscoped.allowed).toBe(false);

      // Laboratory attempting TREATMENT purpose is denied by role-purpose matrix
      const labWrongPurpose = await purposeBasedAccessService.evaluate({
        actorId: labId,
        actorRole: 'LABORATORY',
        patientId: patientAId,
        resourceCategory: 'MEDICAL_RECORDS',
        purpose: 'TREATMENT',
        hasActiveCareOrderScope: true,
      });
      expect(labWrongPurpose.allowed).toBe(false);
    });

    it('enforces explicit consent and immediate synchronous revocation for DOCTOR TREATMENT / ABDM exchange', async () => {
      vi.spyOn(DataAccessEventModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      const consentId = new Types.ObjectId();
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue({
          _id: consentId,
          patientId: new Types.ObjectId(patientAId),
          requesterId: new Types.ObjectId(doctorId),
          consentStatus: 'ACTIVE',
          permittedDataTypes: ['MEDICAL_RECORDS'],
          validityPeriod: {
            from: new Date(Date.now() - 60_000),
            to: new Date(Date.now() + 3_600_000),
          },
        }),
      } as any);

      const granted = await purposeBasedAccessService.evaluate({
        actorId: doctorId,
        actorRole: 'DOCTOR',
        patientId: patientAId,
        resourceCategory: 'MEDICAL_RECORDS',
        purpose: 'ABDM_HEALTH_INFORMATION_EXCHANGE',
      });
      expect(granted.allowed).toBe(true);
      expect(granted.lawfulBasis).toBe('EXPLICIT_PATIENT_CONSENT');

      // Immediate synchronous revocation blocks next access immediately
      consentEnforcementService.invalidateConsentImmediately(patientAId, doctorId, consentId.toString());
      const afterRevoke = await purposeBasedAccessService.evaluate({
        actorId: doctorId,
        actorRole: 'DOCTOR',
        patientId: patientAId,
        resourceCategory: 'MEDICAL_RECORDS',
        purpose: 'ABDM_HEALTH_INFORMATION_EXCHANGE',
      });
      expect(afterRevoke.allowed).toBe(false);

      // Admin without compliance justification is denied
      const adminDenied = await purposeBasedAccessService.evaluate({
        actorId: adminId,
        actorRole: 'ADMIN',
        patientId: patientAId,
        resourceCategory: 'MEDICAL_RECORDS',
        purpose: 'ADMINISTRATIVE_OPERATIONS',
      });
      expect(adminDenied.allowed).toBe(false);
    });
  });
});
