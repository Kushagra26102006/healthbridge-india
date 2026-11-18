/**
 * HealthBridge India — Security Architecture Unit Tests (Day 9 Task 01)
 *
 * Verifies:
 *   1. Permission registry & strict non-unrestricted ADMIN clinical boundary
 *   2. Resource ownership & facility scope isolation + audit logging
 *   3. ConsentSecurityAdapter (grant, expiry, immediate synchronous revocation, fail-closed)
 *   4. FileSecurityService (magic-byte verification, spoofed MIME/EXE/HTML blocking, size cap,
 *      path-traversal sanitization, random storage IDs, honest malware boundary)
 *   5. NoSQL operator & prototype pollution detection + pickAllowedFields mass-assignment guard
 *   6. Audit metadata redaction (zero credentials/PHI persisted)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import {
  ROLE_PERMISSION_REGISTRY,
  hasRolePermission,
  assertResourceOwnership,
  assertFacilityScope,
  hasUnrestrictedClinicalAccess,
  consentSecurityAdapter,
  fileSecurityService,
  detectUnsafeObjectKeys,
  pickAllowedFields,
  securityAuditMonitor,
} from '../../src/security';
import { consentEnforcementService } from '../../src/modules/consent/services/consent-enforcement.service';
import { ConsentArtifactModel } from '../../src/modules/consent/models/consent-artifact.model';
import { ConsentRequestModel } from '../../src/modules/consent/models/consent-request.model';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';

describe('HealthBridge Security Architecture — Unit Tests (Day 9 Task 01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    consentEnforcementService.clearRevocationBarrier();
  });

  describe('1. Permission Registry & Least-Privilege Boundaries', () => {
    it('defines explicit permissions for all 5 roles with zero unrestricted clinical access', () => {
      const roles = Object.keys(ROLE_PERMISSION_REGISTRY).sort();
      expect(roles).toEqual(['ADMIN', 'DOCTOR', 'LABORATORY', 'PATIENT', 'PHARMACY']);

      for (const role of roles as Array<keyof typeof ROLE_PERMISSION_REGISTRY>) {
        expect(ROLE_PERMISSION_REGISTRY[role].unrestrictedClinicalAccess).toBe(false);
        expect(hasUnrestrictedClinicalAccess(role)).toBe(false);
      }

      // ADMIN has operational governance permissions, NOT patient clinical write/read shortcuts
      expect(hasRolePermission('ADMIN', 'admin:audit:read')).toBe(true);
      expect(hasRolePermission('ADMIN', 'patient:records:read:own')).toBe(false);
      expect(hasRolePermission('ADMIN', 'doctor:prescriptions:issue')).toBe(false);
      expect(hasRolePermission('PATIENT', 'admin:users:manage')).toBe(false);
    });
  });

  describe('2. Resource Ownership & Facility Scope Isolation', () => {
    it('blocks cross-patient ownership violations and emits OWNERSHIP_VIOLATION audit event', () => {
      const auditSpy = vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      expect(() =>
        assertResourceOwnership({
          actor: { userId: 'patient-a', role: 'PATIENT' },
          ownerId: 'patient-a',
          resourceType: 'MEDICAL_RECORD',
          resourceId: 'rec-1',
        })
      ).not.toThrow();

      expect(() =>
        assertResourceOwnership({
          actor: { userId: 'patient-a', role: 'PATIENT' },
          ownerId: 'patient-b',
          resourceType: 'MEDICAL_RECORD',
          resourceId: 'rec-2',
        })
      ).toThrow(/do not own/i);

      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'OWNERSHIP_VIOLATION',
          outcome: 'BLOCKED',
          resourceType: 'MEDICAL_RECORD',
        })
      );
    });

    it('blocks cross-pharmacy and cross-laboratory facility scope violations', () => {
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      expect(() =>
        assertFacilityScope({
          actor: { userId: 'pharm-user-1', role: 'PHARMACY' },
          actorFacilityId: 'pharmacy-A',
          resourceFacilityId: 'pharmacy-A',
          resourceType: 'INVENTORY',
        })
      ).not.toThrow();

      expect(() =>
        assertFacilityScope({
          actor: { userId: 'pharm-user-1', role: 'PHARMACY' },
          actorFacilityId: 'pharmacy-A',
          resourceFacilityId: 'pharmacy-B',
          resourceType: 'INVENTORY',
        })
      ).toThrow(/authorized pharmacy facility/i);

      expect(() =>
        assertFacilityScope({
          actor: { userId: 'lab-user-1', role: 'LABORATORY' },
          actorFacilityId: 'lab-A',
          resourceFacilityId: 'lab-B',
          resourceType: 'LAB_ORDER',
        })
      ).toThrow(/authorized laboratory facility/i);
    });
  });

  describe('3. Consent-Aware Authorization & Synchronous Revocation', () => {
    const patientId = new Types.ObjectId().toString();
    const doctorId = new Types.ObjectId().toString();
    const adminId = new Types.ObjectId().toString();

    it('denies automatic unrestricted ADMIN clinical reads unless audited compliance justification is supplied', async () => {
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

      const denied = await consentSecurityAdapter.evaluateClinicalAccess({
        requesterId: adminId,
        requesterRole: 'ADMIN',
        patientId,
        dataCategory: 'MEDICAL_RECORDS',
      });
      expect(denied.authorized).toBe(false);
      expect(denied.reason).toMatch(/administrators do not have automatic unrestricted access/i);

      const allowed = await consentSecurityAdapter.evaluateClinicalAccess({
        requesterId: adminId,
        requesterRole: 'ADMIN',
        patientId,
        dataCategory: 'MEDICAL_RECORDS',
        adminBreakGlassReason: 'Regulatory audit ticket #INC-2026-991 verified by DPO',
      });
      expect(allowed.authorized).toBe(true);
    });

    it('enforces approved consent, rejects expired consent, and immediately blocks revoked consent synchronously', async () => {
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
      const consentId = new Types.ObjectId();

      // 1. Active approved consent succeeds
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue({
          _id: consentId,
          patientId: new Types.ObjectId(patientId),
          requesterId: new Types.ObjectId(doctorId),
          consentStatus: 'ACTIVE',
          permittedDataTypes: ['MEDICAL_RECORDS'],
          validityPeriod: {
            from: new Date(Date.now() - 60_000),
            to: new Date(Date.now() + 3_600_000),
          },
        }),
      } as any);

      const activeVerdict = await consentSecurityAdapter.evaluateClinicalAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId,
        dataCategory: 'MEDICAL_RECORDS',
      });
      expect(activeVerdict.authorized).toBe(true);

      // 2. Unrelated resource category remains inaccessible
      const wrongCategory = await consentSecurityAdapter.evaluateClinicalAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId,
        dataCategory: 'LAB_REPORTS',
      });
      expect(wrongCategory.authorized).toBe(false);

      // 3. Immediate synchronous revocation blocks access even if DB read is stale/replica-lagged
      consentSecurityAdapter.invalidateImmediately(patientId, doctorId, consentId.toString());
      const revokedVerdict = await consentSecurityAdapter.evaluateClinicalAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId,
        dataCategory: 'MEDICAL_RECORDS',
      });
      expect(revokedVerdict.authorized).toBe(false);
      expect(revokedVerdict.reason).toMatch(/revoked/i);

      // 4. Expired consent is rejected
      consentEnforcementService.clearRevocationBarrier();
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          patientId: new Types.ObjectId(patientId),
          requesterId: new Types.ObjectId(doctorId),
          consentStatus: 'ACTIVE',
          permittedDataTypes: ['MEDICAL_RECORDS'],
          validityPeriod: {
            from: new Date(Date.now() - 7_200_000),
            to: new Date(Date.now() - 60_000), // Expired
          },
        }),
      } as any);

      const expiredVerdict = await consentSecurityAdapter.evaluateClinicalAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId,
        dataCategory: 'MEDICAL_RECORDS',
      });
      expect(expiredVerdict.authorized).toBe(false);
    });

    it('fails closed when consent lookup throws an unexpected error', async () => {
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(ConsentArtifactModel, 'findOne').mockImplementation(() => {
        throw new Error('DB connection lost');
      });
      vi.spyOn(ConsentRequestModel, 'findOne').mockImplementation(() => {
        throw new Error('DB connection lost');
      });

      const verdict = await consentSecurityAdapter.evaluateClinicalAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId,
        dataCategory: 'MEDICAL_RECORDS',
      });
      expect(verdict.authorized).toBe(false);
    });
  });

  describe('4. Medical File & Document Security', () => {
    it('accepts genuine PDF and PNG magic-byte signatures, generates random storage IDs, and reports honest AV boundary', async () => {
      const validPdf = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj').toString('base64');
      const resPdf = await fileSecurityService.validateUpload({
        fileName: '../../secret/../../lab_report.pdf',
        mimeType: 'application/pdf',
        fileData: validPdf,
      });

      expect(resPdf.signatureVerified).toBe(true);
      expect(resPdf.safeFileName).toBe('lab_report.pdf');
      expect(resPdf.storageId).toMatch(/^doc_[0-9a-f-]+\.pdf$/);
      expect(resPdf.sha256Checksum).toHaveLength(64);
      expect(resPdf.malwareScan.status).toBe('SCAN_NOT_CONFIGURED');

      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]).toString('base64');
      const resPng = await fileSecurityService.validateUpload({
        fileName: 'xray.png',
        mimeType: 'image/png',
        fileData: validPng,
      });
      expect(resPng.signatureVerified).toBe(true);
    });

    it('rejects spoofed MIME types (HTML script or Windows EXE disguised as application/pdf) and extension mismatches', async () => {
      const htmlSpoof = Buffer.from('<script>alert(1)</script>').toString('base64');
      await expect(
        fileSecurityService.validateUpload({
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          fileData: htmlSpoof,
        })
      ).rejects.toThrow(/signature verification failed/i);

      const exeSpoof = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]).toString('base64');
      await expect(
        fileSecurityService.validateUpload({
          fileName: 'scan.pdf',
          mimeType: 'application/pdf',
          fileData: exeSpoof,
        })
      ).rejects.toThrow(/signature verification failed/i);

      await expect(
        fileSecurityService.validateUpload({
          fileName: 'payload.exe',
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow(/extension/i);
    });
  });

  describe('5. NoSQL Injection Detection, Mass Assignment & Audit Redaction', () => {
    it('detects MongoDB operator keys ($) and prototype pollution keys recursively', () => {
      expect(detectUnsafeObjectKeys({ email: { $ne: '' } })).toBe('email.$ne');
      expect(detectUnsafeObjectKeys({ filter: [{ $where: '1==1' }] })).toBe('filter[0].$where');
      expect(detectUnsafeObjectKeys(JSON.parse('{"__proto__":{"isAdmin":true}}'))).toBe('__proto__');
      expect(detectUnsafeObjectKeys({ name: 'Ananya', page: '1' })).toBeNull();
    });

    it('strips disallowed fields via pickAllowedFields to block mass assignment', () => {
      const untrusted = {
        name: 'Updated Name',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        passwordHash: 'hacked',
      };
      const safe = pickAllowedFields(untrusted, ['name']);
      expect(safe).toEqual({ name: 'Updated Name' });
      expect((safe as any).role).toBeUndefined();
      expect((safe as any).passwordHash).toBeUndefined();
    });

    it('redacts forbidden credential and PHI keys before persisting security audit metadata', async () => {
      const auditSpy = vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
      await securityAuditMonitor.record({
        actorId: new Types.ObjectId().toString(),
        actorRole: 'PATIENT',
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH',
        outcome: 'FAILURE',
        metadata: {
          password: 'SuperSecretPassword123',
          abhaNumber: '12-3456-7890-1234',
          reason: 'Invalid credentials',
        },
      });

      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            password: '[REDACTED]',
            abhaNumber: '[REDACTED]',
            reason: 'Invalid credentials',
          }),
        })
      );
    });
  });
});
