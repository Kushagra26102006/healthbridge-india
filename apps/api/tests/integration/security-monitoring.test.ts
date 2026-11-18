/**
 * HealthBridge India — Security Operations Center API Integration Tests (Day 9 Task 04)
 *
 * Verifies:
 *   1. Unauthenticated requests rejected (401)
 *   2. Non-admin roles (PATIENT, DOCTOR) rejected (403)
 *   3. Ordinary ADMIN without explicit SecOps permissions in AdminProfile denied (403)
 *   4. SecOps Analyst (READ/MANAGE) can inspect overview/alerts/incidents/vulns, but CANNOT
 *      execute CONTAINMENT without SECURITY_INCIDENTS_RESPOND (403)
 *   5. SecOps Responder WITH SECURITY_INCIDENTS_RESPOND succeeds on containment
 *   6. Alert resolution requires resolutionNotes (422); Vulnerability ACCEPTED_RISK requires justification (422)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel, AdminProfileModel, AuditLogModel } from '../../src/database/models';
import { securityMonitoringService } from '../../src/modules/security-monitoring/security-monitoring.service';

describe('Security Operations Center (SecOps) API — HTTP Integration Tests (Day 9 Task 04)', () => {
  const app = createApp();

  const patientId = new Types.ObjectId().toString();
  const ordinaryAdminId = new Types.ObjectId().toString();
  const secAnalystId = new Types.ObjectId().toString();
  const secResponderId = new Types.ObjectId().toString();

  const makeToken = (id: string, role: string, email: string) =>
    tokenService.generateAccessToken({ _id: id, role, email } as any);

  const patientToken = makeToken(patientId, 'PATIENT', 'soc.patient@example.test');
  const ordinaryAdminToken = makeToken(ordinaryAdminId, 'ADMIN', 'soc.ordinary@example.test');
  const secAnalystToken = makeToken(secAnalystId, 'ADMIN', 'soc.analyst@example.test');
  const secResponderToken = makeToken(secResponderId, 'ADMIN', 'soc.responder@example.test');

  const usersById: Record<string, any> = {
    [patientId]: { _id: new Types.ObjectId(patientId), role: 'PATIENT', accountStatus: 'ACTIVE', email: 'soc.patient@example.test', name: 'Patient SOC' },
    [ordinaryAdminId]: { _id: new Types.ObjectId(ordinaryAdminId), role: 'ADMIN', accountStatus: 'ACTIVE', email: 'soc.ordinary@example.test', name: 'Hospital Admin' },
    [secAnalystId]: { _id: new Types.ObjectId(secAnalystId), role: 'ADMIN', accountStatus: 'ACTIVE', email: 'soc.analyst@example.test', name: 'SecOps Analyst' },
    [secResponderId]: { _id: new Types.ObjectId(secResponderId), role: 'ADMIN', accountStatus: 'ACTIVE', email: 'soc.responder@example.test', name: 'SecOps Responder' },
  };

  const adminProfilesByUserId: Record<string, any> = {
    // Ordinary admin has standard hospital/user permissions — ZERO SecOps permissions!
    [ordinaryAdminId]: {
      userId: new Types.ObjectId(ordinaryAdminId),
      administrativeLevel: 'HOSPITAL_ADMIN',
      permissions: ['VIEW_METRICS', 'MANAGE_USERS'],
    },
    // Analyst has read/manage SecOps permissions, but NOT SECURITY_INCIDENTS_RESPOND
    [secAnalystId]: {
      userId: new Types.ObjectId(secAnalystId),
      administrativeLevel: 'SUPER_ADMIN',
      permissions: [
        'SECURITY_EVENTS_READ',
        'SECURITY_ALERTS_READ',
        'SECURITY_ALERTS_MANAGE',
        'SECURITY_INCIDENTS_READ',
        'SECURITY_INCIDENTS_MANAGE',
        'SECURITY_VULNERABILITIES_READ',
        'SECURITY_VULNERABILITIES_MANAGE',
      ],
    },
    // Responder also holds SECURITY_INCIDENTS_RESPOND
    [secResponderId]: {
      userId: new Types.ObjectId(secResponderId),
      administrativeLevel: 'SUPER_ADMIN',
      permissions: [
        'SECURITY_EVENTS_READ',
        'SECURITY_ALERTS_READ',
        'SECURITY_ALERTS_MANAGE',
        'SECURITY_INCIDENTS_READ',
        'SECURITY_INCIDENTS_MANAGE',
        'SECURITY_INCIDENTS_RESPOND',
        'SECURITY_VULNERABILITIES_READ',
        'SECURITY_VULNERABILITIES_MANAGE',
      ],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    securityMonitoringService.clearForTests();

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) =>
      Promise.resolve(usersById[String(id)] || null)) as any);
    vi.spyOn(AdminProfileModel, 'findOne').mockImplementation(((filter: any) =>
      Promise.resolve(adminProfilesByUserId[String(filter?.userId)] || null)) as any);
    vi.spyOn(AdminProfileModel, 'find').mockReturnValue({
      limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
    } as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  it('blocks unauthenticated users (401), non-admins (403), and ordinary ADMINs lacking explicit SecOps permissions (403)', async () => {
    const unauth = await request(app).get('/api/v1/admin/security/overview');
    expect(unauth.status).toBe(401);

    const pat = await request(app)
      .get('/api/v1/admin/security/overview')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(pat.status).toBe(403);

    // Crucial least-privilege check: ordinary ADMIN does NOT automatically get SecOps access
    const ordinaryAdmin = await request(app)
      .get('/api/v1/admin/security/overview')
      .set('Authorization', `Bearer ${ordinaryAdminToken}`);
    expect(ordinaryAdmin.status).toBe(403);
    expect(ordinaryAdmin.body.message).toMatch(/SECURITY_EVENTS_READ/);
  });

  it('supports alert workflow with mandatory resolution notes and incident workflow with separated responder permissions', async () => {
    // Seed a real CRITICAL token-reuse alert
    const seeded = await securityMonitoringService.ingestEvent({
      eventType: 'TOKEN_REUSE_DETECTED',
      category: 'AUTHENTICATION',
      severity: 'CRITICAL',
      actorId: patientId,
      sourceModule: 'auth',
      outcome: 'BLOCKED',
    });
    const alertId = seeded.triggeredAlerts[0].alertId;

    // Overview returns real aggregated counts
    const ov = await request(app)
      .get('/api/v1/admin/security/overview')
      .set('Authorization', `Bearer ${secAnalystToken}`);
    expect(ov.status).toBe(200);
    expect(ov.body.data.totalSecurityEvents).toBe(1);
    expect(ov.body.data.openAlertCount).toBe(1);

    // Resolving an alert without resolutionNotes fails Zod validation (422)
    const missingNotes = await request(app)
      .patch(`/api/v1/admin/security/alerts/${alertId}`)
      .set('Authorization', `Bearer ${secAnalystToken}`)
      .send({ status: 'RESOLVED' });
    expect(missingNotes.status).toBe(422);

    // Resolving with valid notes succeeds
    const resolved = await request(app)
      .patch(`/api/v1/admin/security/alerts/${alertId}`)
      .set('Authorization', `Bearer ${secAnalystToken}`)
      .send({ status: 'RESOLVED', resolutionNotes: 'Verified session revocation and escalated.' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.status).toBe('RESOLVED');

    // Create incident as SecOps Analyst
    const createInc = await request(app)
      .post('/api/v1/admin/security/incidents')
      .set('Authorization', `Bearer ${secAnalystToken}`)
      .send({
        title: 'Suspected Session Hijacking Investigation',
        category: 'AUTHENTICATION',
        severity: 'CRITICAL',
        description: 'Investigating replay of revoked refresh token on synthetic test account.',
        relatedAlertIds: [alertId],
        affectedModules: ['auth'],
      });
    expect(createInc.status).toBe(201);
    const incId = createInc.body.data.incidentId;

    // Analyst CANNOT execute CONTAINMENT (lacks SECURITY_INCIDENTS_RESPOND) -> 403
    const analystContain = await request(app)
      .patch(`/api/v1/admin/security/incidents/${incId}`)
      .set('Authorization', `Bearer ${secAnalystToken}`)
      .send({ status: 'CONTAINMENT', containmentAction: 'Block source IP' });
    expect(analystContain.status).toBe(403);

    // Responder WITH SECURITY_INCIDENTS_RESPOND succeeds -> 200
    const responderContain = await request(app)
      .patch(`/api/v1/admin/security/incidents/${incId}`)
      .set('Authorization', `Bearer ${secResponderToken}`)
      .send({ status: 'CONTAINMENT', containmentAction: 'Revoked active tokens and isolated IP.' });
    expect(responderContain.status).toBe(200);
    expect(responderContain.body.data.status).toBe('CONTAINMENT');
    expect(responderContain.body.data.timeline.length).toBeGreaterThanOrEqual(2);
  });

  it('tracks vulnerability advisories and requires documented justification for ACCEPTED_RISK', async () => {
    const createVuln = await request(app)
      .post('/api/v1/admin/security/vulnerabilities')
      .set('Authorization', `Bearer ${secAnalystToken}`)
      .send({
        component: 'example-test-package',
        advisoryReference: 'INTERNAL-AUDIT-2026-001',
        severity: 'MEDIUM',
        affectedVersion: '1.0.0',
        fixedVersion: '1.0.2',
        remediation: 'Upgrade dependency after staging compatibility tests pass.',
        owner: 'Platform Security',
      });
    expect(createVuln.status).toBe(201);
    const vulnId = createVuln.body.data.vulnerabilityId;

    // ACCEPTED_RISK without documented justification rejected (422)
    const badAccept = await request(app)
      .patch(`/api/v1/admin/security/vulnerabilities/${vulnId}`)
      .set('Authorization', `Bearer ${secAnalystToken}`)
      .send({ status: 'ACCEPTED_RISK', acceptedRiskJustification: 'short' });
    expect(badAccept.status).toBe(422);

    // ACCEPTED_RISK with full justification succeeds (200)
    const goodAccept = await request(app)
      .patch(`/api/v1/admin/security/vulnerabilities/${vulnId}`)
      .set('Authorization', `Bearer ${secAnalystToken}`)
      .send({
        status: 'ACCEPTED_RISK',
        acceptedRiskJustification:
          'Mitigated by strict server-side input validation; scheduled for next major upgrade window.',
      });
    expect(goodAccept.status).toBe(200);
    expect(goodAccept.body.data.status).toBe('ACCEPTED_RISK');
  });
});
