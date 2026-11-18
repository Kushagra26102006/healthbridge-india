/**
 * HealthBridge India — Security Monitoring, Detection Engine, Alerts, Incidents & Vulnerabilities Unit Tests (Day 9 Task 04)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityMonitoringService } from '../../src/modules/security-monitoring/security-monitoring.service';
import { SecurityDetectionEngine } from '../../src/modules/security-monitoring/detection-engine';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';
import { NotificationModel } from '../../src/modules/notifications/models/notification.model';
import { AdminProfileModel } from '../../src/modules/users/models/admin-profile.model';

describe('Security Operations & Detection Engine — Unit Tests (Day 9 Task 04)', () => {
  let service: SecurityMonitoringService;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(AdminProfileModel, 'find').mockReturnValue({
      limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
    } as any);
    vi.spyOn(NotificationModel, 'create').mockResolvedValue({} as any);
    service = new SecurityMonitoringService(new SecurityDetectionEngine());
  });

  describe('1. Security Event Collection, Sensitive Payload Rejection & Deduplication', () => {
    it('accepts valid security events, rejects forbidden credential/clinical metadata, and deduplicates repeat eventIds', async () => {
      const ok = await service.ingestEvent({
        eventId: 'evt-valid-1',
        eventType: 'LOGIN_FAILURE',
        category: 'AUTHENTICATION',
        severity: 'LOW',
        actorId: 'u-1',
        sourceModule: 'auth',
        outcome: 'FAILURE',
        metadata: { reason: 'Bad password' },
      });
      expect(ok.deduplicated).toBe(false);
      // False-positive control: single failed login does NOT trigger an alert
      expect(ok.triggeredAlerts).toHaveLength(0);

      // Exact duplicate eventId is deduplicated
      const dup = await service.ingestEvent({
        eventId: 'evt-valid-1',
        eventType: 'LOGIN_FAILURE',
        category: 'AUTHENTICATION',
        severity: 'LOW',
        actorId: 'u-1',
        sourceModule: 'auth',
        outcome: 'FAILURE',
      });
      expect(dup.deduplicated).toBe(true);

      // Sensitive credential or clinical key in metadata is rejected by Zod
      await expect(
        service.ingestEvent({
          eventType: 'LOGIN_FAILURE',
          category: 'AUTHENTICATION',
          severity: 'HIGH',
          sourceModule: 'auth',
          outcome: 'FAILURE',
          metadata: { password: 'leaked-password' },
        })
      ).rejects.toThrow(/sensitive credential or clinical key/i);

      await expect(
        service.ingestEvent({
          eventType: 'SENSITIVE_DOCUMENT_ACCESS',
          category: 'DATA_PROTECTION',
          severity: 'MEDIUM',
          sourceModule: 'records',
          outcome: 'SUCCESS',
          metadata: { diagnosis: 'Plaintext PHI forbidden' },
        })
      ).rejects.toThrow(/sensitive credential or clinical key/i);
    });
  });

  describe('2. Evidence-Based Detection Rules & Deduplicated Alert Grouping', () => {
    it('triggers HIGH alert after 5 failed logins for same account and groups subsequent failures into the same alert (no duplicate alert storm)', async () => {
      for (let i = 1; i <= 4; i++) {
        const res = await service.ingestEvent({
          eventType: 'LOGIN_FAILURE',
          category: 'AUTHENTICATION',
          severity: 'LOW',
          actorId: 'victim-1',
          sourceModule: 'auth',
          outcome: 'FAILURE',
        });
        expect(res.triggeredAlerts).toHaveLength(0);
      }

      // 5th failure hits threshold -> creates 1 OPEN alert
      const fifth = await service.ingestEvent({
        eventType: 'LOGIN_FAILURE',
        category: 'AUTHENTICATION',
        severity: 'LOW',
        actorId: 'victim-1',
        sourceModule: 'auth',
        outcome: 'FAILURE',
      });
      expect(fifth.triggeredAlerts).toHaveLength(1);
      expect(fifth.triggeredAlerts[0].severity).toBe('HIGH');
      expect(fifth.triggeredAlerts[0].occurrenceCount).toBe(1);

      // 6th failure increments occurrenceCount on the SAME alert instead of duplicating
      const sixth = await service.ingestEvent({
        eventType: 'LOGIN_FAILURE',
        category: 'AUTHENTICATION',
        severity: 'LOW',
        actorId: 'victim-1',
        sourceModule: 'auth',
        outcome: 'FAILURE',
      });
      expect(sixth.triggeredAlerts[0].alertId).toBe(fifth.triggeredAlerts[0].alertId);
      expect(sixth.triggeredAlerts[0].occurrenceCount).toBe(2);
      expect(service.listAlerts({ page: 1, limit: 20 }).items).toHaveLength(1);
    });

    it('detects cross-patient access patterns, API abuse bursts, and document/decryption anomalies', async () => {
      // Cross-patient pattern (>= 3)
      for (let i = 0; i < 3; i++) {
        await service.ingestEvent({
          eventType: 'CROSS_PATIENT_ACCESS_ATTEMPT',
          category: 'AUTHORIZATION',
          severity: 'HIGH',
          actorId: 'rogue-user',
          sourceModule: 'records',
          outcome: 'BLOCKED',
        });
      }

      // API abuse pattern (>= 5)
      for (let i = 0; i < 5; i++) {
        await service.ingestEvent({
          eventType: 'RATE_LIMIT_EXCEEDED',
          category: 'API_SECURITY',
          severity: 'MEDIUM',
          sourceIp: '203.0.113.55',
          sourceModule: 'api',
          outcome: 'BLOCKED',
        });
      }

      // Document unauthorized download pattern (>= 3)
      for (let i = 0; i < 3; i++) {
        await service.ingestEvent({
          eventType: 'UNAUTHORIZED_DOCUMENT_DOWNLOAD',
          category: 'DATA_PROTECTION',
          severity: 'HIGH',
          actorId: 'doc-scraper',
          sourceModule: 'document-storage',
          outcome: 'BLOCKED',
        });
      }

      const alerts = service.listAlerts({ page: 1, limit: 20 }).items;
      const ruleIds = alerts.map((a) => a.detectionRuleId);
      expect(ruleIds).toContain('RULE_CROSS_PATIENT_ACCESS_PATTERN');
      expect(ruleIds).toContain('RULE_API_ABUSE_PATTERN');
      expect(ruleIds).toContain('RULE_UNAUTHORIZED_DOCUMENT_OR_DECRYPTION');
    });
  });

  describe('3. Incidents, Separation of Duties & Real Security Metrics', () => {
    it('enforces SECURITY_INCIDENTS_RESPOND for containment transitions, preserves immutable timeline, and computes MTTA/MTTR', async () => {
      const tokenAlert = await service.ingestEvent({
        eventType: 'TOKEN_REUSE_DETECTED',
        category: 'AUTHENTICATION',
        severity: 'CRITICAL',
        actorId: 'compromised-user',
        sourceModule: 'auth',
        outcome: 'BLOCKED',
      });
      const alertId = tokenAlert.triggeredAlerts[0].alertId;

      await service.updateAlert(alertId, 'analyst-1', { status: 'ACKNOWLEDGED' });
      await service.updateAlert(alertId, 'analyst-1', {
        status: 'RESOLVED',
        resolutionNotes: 'Escalated to formal incident and verified session revocation.',
      });

      const incident = await service.createIncident('analyst-1', {
        title: 'Refresh Token Replay Investigation',
        category: 'AUTHENTICATION',
        severity: 'CRITICAL',
        description: 'Detected replay of revoked refresh token requiring containment verification.',
        relatedAlertIds: [alertId],
        affectedModules: ['auth'],
        affectedSystems: ['apps/api'],
        evidenceReferences: [alertId],
      });

      // Analyst with MANAGE but WITHOUT RESPOND cannot execute CONTAINMENT
      await expect(
        service.updateIncident(
          incident.incidentId,
          'analyst-1',
          new Set(['SECURITY_INCIDENTS_MANAGE']),
          { status: 'CONTAINMENT', containmentAction: 'Revoked all active sessions' }
        )
      ).rejects.toThrow(/SECURITY_INCIDENTS_RESPOND/i);

      // Responder WITH SECURITY_INCIDENTS_RESPOND succeeds and appends immutable timeline
      const contained = await service.updateIncident(
        incident.incidentId,
        'responder-1',
        new Set(['SECURITY_INCIDENTS_MANAGE', 'SECURITY_INCIDENTS_RESPOND']),
        { status: 'CONTAINMENT', containmentAction: 'Confirmed global session revocation and IP block' }
      );
      expect(contained.status).toBe('CONTAINMENT');
      expect(contained.timeline).toHaveLength(2);
      expect(contained.containmentActions).toHaveLength(1);

      const overview = service.getSecurityOverview();
      expect(overview.totalSecurityEvents).toBe(1);
      expect(overview.activeIncidentCount).toBe(1);
      expect(overview.slaMetrics.acknowledgedSampleCount).toBe(1);
      expect(overview.slaMetrics.resolvedSampleCount).toBe(1);
    });
  });
});
