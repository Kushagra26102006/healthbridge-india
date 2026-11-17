/**
 * HealthBridge India — Day 7 Task 02
 * Integration Tests for ABHA Identity HTTP Routes, RBAC, Patient Ownership,
 * Correlation ID Persistence, Privacy-Safe Notifications, Audit History, and Admin Analytics.
 *
 * NOTE: Runs against Express app + Supertest in development/mock mode with mocked persistence.
 * Does NOT contact live external ABDM/ABHA sandbox servers.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/database/models';
import { abhaIdentityService } from '../../src/modules/abdm/services/abha-identity.service';
import { abdmAuthenticationService } from '../../src/modules/abdm/services/abdm-authentication.service';
import { notificationService } from '../../src/modules/notifications/services/notification.service';

describe('ABHA Identity Integration — Express API Integration Tests (Day 7 Task 02)', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const labId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const patientAToken = tokenService.generateAccessToken({
    _id: patientAId,
    role: 'PATIENT',
    email: 'patient.a.abha@example.test',
  } as any);
  const patientBToken = tokenService.generateAccessToken({
    _id: patientBId,
    role: 'PATIENT',
    email: 'patient.b.abha@example.test',
  } as any);
  const doctorToken = tokenService.generateAccessToken({
    _id: doctorId,
    role: 'DOCTOR',
    email: 'doctor.abha@example.test',
  } as any);
  const labToken = tokenService.generateAccessToken({
    _id: labId,
    role: 'LABORATORY',
    email: 'lab.abha@example.test',
  } as any);
  const adminToken = tokenService.generateAccessToken({
    _id: adminId,
    role: 'ADMIN',
    email: 'admin.abha@example.test',
  } as any);

  const origEnabled = process.env.ABDM_ENABLED;
  const origEnv = process.env.ABDM_ENVIRONMENT;
  const origClientSecret = process.env.ABDM_CLIENT_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
    abhaIdentityService.resetTestState();
    abdmAuthenticationService.clearAllSessions();

    process.env.ABDM_ENABLED = 'true';
    process.env.ABDM_ENVIRONMENT = 'development';
    process.env.ABDM_CLIENT_SECRET = 'hidden_client_secret_never_return';

    const users: Record<string, any> = {
      [patientAId]: { _id: new Types.ObjectId(patientAId), role: 'PATIENT', accountStatus: 'ACTIVE', name: 'Patient A' },
      [patientBId]: { _id: new Types.ObjectId(patientBId), role: 'PATIENT', accountStatus: 'ACTIVE', name: 'Patient B' },
      [doctorId]: { _id: new Types.ObjectId(doctorId), role: 'DOCTOR', accountStatus: 'ACTIVE', name: 'Doctor' },
      [labId]: { _id: new Types.ObjectId(labId), role: 'LABORATORY', accountStatus: 'ACTIVE', name: 'Lab' },
      [adminId]: { _id: new Types.ObjectId(adminId), role: 'ADMIN', accountStatus: 'ACTIVE', name: 'Admin' },
    };

    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) =>
      Promise.resolve(users[id?.toString()] || null) as any
    );
  });

  afterAll(() => {
    process.env.ABDM_ENABLED = origEnabled;
    process.env.ABDM_ENVIRONMENT = origEnv;
    process.env.ABDM_CLIENT_SECRET = origClientSecret;
  });

  it('enforces strict authentication and RBAC across patient and admin ABHA endpoints', async () => {
    // Unauthenticated blocked
    const unauth = await request(app).get('/api/v1/abdm/abha/status');
    expect(unauth.status).toBe(401);

    // Doctor & Laboratory blocked from Patient ABHA routes
    const docRes = await request(app)
      .get('/api/v1/abdm/abha/status')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docRes.status).toBe(403);

    const labRes = await request(app)
      .get('/api/v1/abdm/abha/status')
      .set('Authorization', `Bearer ${labToken}`);
    expect(labRes.status).toBe(403);

    // Patient blocked from Admin analytics
    const patAdmin = await request(app)
      .get('/api/v1/abdm/abha/analytics')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(patAdmin.status).toBe(403);
  });

  it('executes complete patient ABHA verify -> profile -> link -> history -> unlink lifecycle with privacy-safe notifications and correlation IDs', async () => {
    const notifySpy = vi.spyOn(notificationService, 'publishEvent').mockResolvedValue(null);

    // 1. Initial status is NOT_LINKED
    const status0 = await request(app)
      .get('/api/v1/abdm/abha/status')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(status0.status).toBe(200);
    expect(status0.body.data.linkStatus).toBe('NOT_LINKED');
    expect(status0.body.data.patientId).toBe(patientAId);

    // 2. Initiate ABHA Number verification (even if client injects forged patientId in body, server ignores it)
    const initRes = await request(app)
      .post('/api/v1/abdm/abha/verify')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        patientId: patientBId, // Forged client ID — must be ignored
        abhaNumber: '91-0000-2222-3333',
        otpSystem: 'abdm',
        patientConsentConfirmed: true,
      });

    expect(initRes.status).toBe(202);
    const { internalTransactionId, correlationId } = initRes.body.data;
    expect(internalTransactionId).toBeTruthy();
    expect(correlationId).toBeTruthy();

    // 3. Cross-patient hijack attempt by Patient B is blocked (403)
    const hijackRes = await request(app)
      .post('/api/v1/abdm/abha/verify/confirm')
      .set('Authorization', `Bearer ${patientBToken}`)
      .send({
        internalTransactionId,
        otp: '123456',
      });
    expect(hijackRes.status).toBe(403);

    // 4. Patient A confirms OTP
    const verifyRes = await request(app)
      .post('/api/v1/abdm/abha/verify/confirm')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        internalTransactionId,
        otp: '123456',
      });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verificationStatus).toBe('VERIFIED');
    expect(verifyRes.body.data.maskedAbhaNumber).toBe('91-XXXX-XXXX-3333');
    expect(JSON.stringify(verifyRes.body)).not.toContain('91-0000-2222-3333'); // No full plaintext ABHA leaked

    // 5. Retrieve authorized ABHA profile using server-held ephemeral X-Token
    const profileRes = await request(app)
      .get('/api/v1/abdm/abha/profile')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.maskedAbhaNumber).toBeTruthy();
    expect(JSON.stringify(profileRes.body)).not.toContain('mock_xtoken_');

    // 6. Explicitly confirm & link ABHA identity
    const linkRes = await request(app)
      .post('/api/v1/abdm/abha/link')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        internalTransactionId,
        patientConsentConfirmed: true,
        purposeAcknowledged: true,
      });
    expect(linkRes.status).toBe(200);
    expect(linkRes.body.data.linkStatus).toBe('ACTIVE');
    expect(linkRes.body.data.consentScope).toBe('IDENTITY_LINKING_ONLY');

    // 7. History contains correlation IDs and zero raw secrets
    const historyRes = await request(app)
      .get('/api/v1/abdm/abha/history')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBeGreaterThanOrEqual(2);
    expect(historyRes.body.data.some((h: any) => h.workflowType === 'ABHA_LINK')).toBe(true);
    expect(JSON.stringify(historyRes.body)).not.toContain('91-0000-2222-3333');

    // 8. Verify privacy-safe notifications were dispatched without full ABHA number
    expect(notifySpy).toHaveBeenCalled();
    for (const call of notifySpy.mock.calls) {
      const payload = call[0];
      expect(payload.recipientId).toBe(patientAId);
      expect(payload.message).not.toContain('91-0000-2222-3333');
    }

    // 9. Local unlink preserves audit history and updates status
    const unlinkRes = await request(app)
      .post('/api/v1/abdm/abha/unlink')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        reason: 'Testing local unlink workflow',
        confirmUnlink: true,
      });
    expect(unlinkRes.status).toBe(200);
    expect(unlinkRes.body.data.linkStatus).toBe('UNLINKED');
    expect(unlinkRes.body.data.verificationStatus).toBe('REVOKED_OR_UNLINKED');
  });

  it('serves aggregate ABHA analytics to ADMIN with persisted counts and zero patient PII or secrets', async () => {
    // Generate one verified transaction and one failed attempt
    const init = await request(app)
      .post('/api/v1/abdm/abha/verify')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        abhaNumber: '91-0000-7777-8888',
        otpSystem: 'abdm',
        patientConsentConfirmed: true,
      });
    await request(app)
      .post('/api/v1/abdm/abha/verify/confirm')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        internalTransactionId: init.body.data.internalTransactionId,
        otp: '000000', // Triggers invalid OTP failure
      });

    const analyticsRes = await request(app)
      .get('/api/v1/abdm/abha/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(analyticsRes.status).toBe(200);
    const body = analyticsRes.body.data;
    expect(body.authReadiness).toBe('MOCKED');
    expect(body.supportedWorkflows.length).toBeGreaterThan(5);
    expect(body.metrics.failedVerifications).toBeGreaterThanOrEqual(1);
    expect(body.recentErrors.length).toBeGreaterThanOrEqual(1);

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('hidden_client_secret_never_return');
    expect(serialized).not.toContain('91-0000-7777-8888');
    expect(serialized).not.toContain(patientAId);
  });

  it('rejects requests cleanly when ABDM integration is disabled', async () => {
    process.env.ABDM_ENABLED = 'false';
    process.env.ABDM_ENVIRONMENT = 'disabled';

    const res = await request(app)
      .post('/api/v1/abdm/abha/address/check')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ abhaAddress: 'citizen@sbx' });

    expect(res.status).toBe(503);
    expect(res.body.error?.code || res.body.code).toBe('ABDM_DISABLED');
  });
});
