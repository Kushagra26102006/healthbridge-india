import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeAuditMetadata,
  securityAuditMonitor,
} from '../../src/security/security-audit.monitor';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';
import {
  buildRedactedAuditCsv,
  escapeAuditCsvCell,
  auditLogQueryService,
} from '../../src/modules/audit/services/audit.service';
import { securityMonitoringService } from '../../src/modules/security-monitoring/security-monitoring.service';
import { ROLE_PERMISSION_REGISTRY } from '../../src/security/permissions.registry';
import { authService } from '../../src/modules/auth/services/auth.service';

describe('Phase 18 — Advanced Security, Audit Logs & Compliance Hardening Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    securityMonitoringService.clearForTests();
  });

  describe('1. Recursive Audit Metadata Redaction & Append-Only Immutability', () => {
    it('recursively redacts credentials, tokens, Aadhaar/ABHA, OTP, and clinical PHI in nested metadata', () => {
      const sanitized = sanitizeAuditMetadata({
        safeKey: 'ok',
        password: 'plain-password',
        nested: {
          accessToken: 'jwt.secret.token',
          abhaNumber: '91-1234-5678-9012',
          clinicalNotes: 'Confidential diagnosis',
          safeNested: 'visible',
        },
        list: [{ otp: '123456', safeItem: 42 }],
      });

      expect(sanitized?.safeKey).toBe('ok');
      expect(sanitized?.password).toBe('[REDACTED]');
      expect((sanitized?.nested as any)?.accessToken).toBe('[REDACTED]');
      expect((sanitized?.nested as any)?.abhaNumber).toBe('[REDACTED]');
      expect((sanitized?.nested as any)?.clinicalNotes).toBe('[REDACTED]');
      expect((sanitized?.nested as any)?.safeNested).toBe('visible');
      expect((sanitized?.list as any)?.[0]?.otp).toBe('[REDACTED]');
      expect((sanitized?.list as any)?.[0]?.safeItem).toBe(42);
    });

    it('rejects unredacted nested credentials/PHI in AuditLogModel schema validation while permitting [REDACTED]', () => {
      const badDoc = new AuditLogModel({
        action: 'TEST_EVENT',
        resourceType: 'AUTH',
        requestId: 'req-1',
        outcome: 'SUCCESS',
        metadata: {
          nested: { password: 'leaked-plaintext-password' },
        },
      });
      const badErr = badDoc.validateSync();
      expect(badErr).toBeDefined();
      expect(badErr?.errors.metadata?.message).toContain('Security violation');

      const safeDoc = new AuditLogModel({
        action: 'TEST_EVENT',
        resourceType: 'AUTH',
        requestId: 'req-2',
        outcome: 'SUCCESS',
        metadata: {
          nested: { password: '[REDACTED]', safe: true },
        },
      });
      expect(safeDoc.validateSync()).toBeUndefined();
    });

    it('blocks updateOne, deleteOne, and findOneAndDelete on AuditLogModel to enforce append-only immutability', async () => {
      await expect(
        AuditLogModel.updateOne({ action: 'LOGIN_SUCCESS' }, { $set: { outcome: 'FAILURE' } })
      ).rejects.toThrow(/immutable/i);

      await expect(AuditLogModel.deleteOne({ action: 'LOGIN_SUCCESS' })).rejects.toThrow(
        /cannot be deleted/i
      );

      await expect(AuditLogModel.findOneAndDelete({ action: 'LOGIN_SUCCESS' })).rejects.toThrow(
        /cannot be deleted/i
      );
    });
  });

  describe('2. Redacted Audit CSV Export & Formula-Injection Protection', () => {
    it('neutralizes spreadsheet formula prefixes (=, +, -, @) and redacts sensitive metadata during CSV export', async () => {
      expect(escapeAuditCsvCell('=CMD()')).toBe('"\'=CMD()"');
      expect(escapeAuditCsvCell('+SUM(A1:A2)')).toBe('"\'+SUM(A1:A2)"');
      expect(escapeAuditCsvCell('-100')).toBe('"\'-100"');
      expect(escapeAuditCsvCell('@HYPERLINK("http://evil")')).toBe(
        '"\'@HYPERLINK(""http://evil"")"'
      );

      const csv = buildRedactedAuditCsv([
        {
          id: 'evt-1',
          actorId: 'u-1',
          actorRole: 'ADMIN',
          action: '=MALICIOUS_ACTION',
          resourceType: 'AUDIT_LOG',
          timestamp: '2026-11-18T10:00:00.000Z',
          requestId: 'req-csv-1',
          outcome: 'SUCCESS',
          metadata: { token: 'should-be-redacted', note: 'safe' },
        },
      ]);

      expect(csv).toContain('"\'=MALICIOUS_ACTION"');
      expect(csv).not.toContain('should-be-redacted');
      expect(csv).toContain('[REDACTED]');

      const auditSpy = vi.spyOn(securityAuditMonitor, 'record').mockResolvedValue(undefined);
      await auditLogQueryService.exportRedactedCsv(
        { page: 1, limit: 25, outcome: 'BLOCKED' },
        { actorId: 'admin-1', actorRole: 'ADMIN', requestId: 'req-exp-1' }
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'AUDIT_LOG_EXPORTED',
          resourceType: 'AUDIT_LOG',
          outcome: 'SUCCESS',
        })
      );
    });
  });

  describe('3. Security Monitoring Event Filters (Role, Outcome, Date Range)', () => {
    it('accurately filters SecurityMonitoringService events by actorRole, outcome, and ISO date range', async () => {
      await securityMonitoringService.ingestEvent({
        eventType: 'LOGIN_FAILURE',
        category: 'AUTHENTICATION',
        severity: 'MEDIUM',
        actorId: 'user-doc-1',
        actorRole: 'DOCTOR',
        sourceModule: 'auth',
        outcome: 'FAILURE',
      });
      await securityMonitoringService.ingestEvent({
        eventType: 'ACCESS_DENIED',
        category: 'AUTHORIZATION',
        severity: 'HIGH',
        actorId: 'user-pat-1',
        actorRole: 'PATIENT',
        sourceModule: 'records',
        outcome: 'BLOCKED',
      });

      const blockedOnly = securityMonitoringService.listEvents({
        page: 1,
        limit: 20,
        outcome: 'BLOCKED',
      });
      expect(blockedOnly.items).toHaveLength(1);
      expect(blockedOnly.items[0]?.eventType).toBe('ACCESS_DENIED');

      const doctorOnly = securityMonitoringService.listEvents({
        page: 1,
        limit: 20,
        actorRole: 'DOCTOR',
      });
      expect(doctorOnly.items).toHaveLength(1);
      expect(doctorOnly.items[0]?.actorId).toBe('user-doc-1');

      const futureWindow = securityMonitoringService.listEvents({
        page: 1,
        limit: 20,
        from: new Date(Date.now() + 60_000).toISOString(),
      });
      expect(futureWindow.items).toHaveLength(0);
    });
  });

  describe('4. RBAC Least-Privilege Boundaries & Fail-Closed Admin Registration', () => {
    it('guarantees zero roles hold unrestrictedClinicalAccess and strict permission boundaries across all 5 roles', () => {
      for (const policy of Object.values(ROLE_PERMISSION_REGISTRY)) {
        expect(policy.unrestrictedClinicalAccess).toBe(false);
      }
      expect(ROLE_PERMISSION_REGISTRY.PATIENT.permissions).not.toContain('admin:audit:read');
      expect(ROLE_PERMISSION_REGISTRY.PHARMACY.permissions).not.toContain(
        'doctor:records:read:consented'
      );
      expect(ROLE_PERMISSION_REGISTRY.LABORATORY.permissions).not.toContain(
        'pharmacy:dispensing:execute:scoped'
      );
      expect(ROLE_PERMISSION_REGISTRY.ADMIN.permissions).toContain('admin:audit:read');
      expect(ROLE_PERMISSION_REGISTRY.ADMIN.permissions).not.toContain(
        'doctor:records:read:consented'
      );
    });

    it('fails closed on public ADMIN registration when adminRegistrationKey is missing or invalid', async () => {
      await expect(
        authService.register({
          name: 'Unauthorized Admin Attempt',
          email: 'attacker@example.com',
          phone: '9876543210',
          password: 'StrongPassword@123',
          role: 'ADMIN',
          adminRegistrationKey: 'wrong-key',
        } as any)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
