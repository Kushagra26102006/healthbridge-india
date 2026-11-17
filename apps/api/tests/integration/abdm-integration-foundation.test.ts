/**
 * HealthBridge India — Day 7 Task 01
 * Integration Tests for ABDM Admin Status Endpoint, FHIR Validation Endpoint,
 * and Inbound Webhook Callback Security (HMAC Auth, Replay Window, Idempotency).
 *
 * NOTE: Runs against Express app + Supertest with mocked DB & local env overrides.
 * Does NOT contact external ABDM sandbox servers.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel, AbdmWebhookEventModel, AuditLogModel } from '../../src/database/models';
import { abdmWebhookService } from '../../src/modules/abdm/webhooks/abdm-webhook.service';

describe('ABDM Integration Foundation — API & Webhook Integration Tests (Day 7 Task 01)', () => {
  const app = createApp();

  const adminId = new Types.ObjectId().toString();
  const patientId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const labId = new Types.ObjectId().toString();

  const adminToken = tokenService.generateAccessToken({
    _id: adminId,
    role: 'ADMIN',
    email: 'admin.abdm@example.test',
  } as any);
  const patientToken = tokenService.generateAccessToken({
    _id: patientId,
    role: 'PATIENT',
    email: 'patient.abdm@example.test',
  } as any);
  const doctorToken = tokenService.generateAccessToken({
    _id: doctorId,
    role: 'DOCTOR',
    email: 'doctor.abdm@example.test',
  } as any);
  const labToken = tokenService.generateAccessToken({
    _id: labId,
    role: 'LABORATORY',
    email: 'lab.abdm@example.test',
  } as any);

  const webhookSecret = 'test_abdm_webhook_secret_32_bytes_key';
  const originalWebhookSecret = process.env.ABDM_WEBHOOK_SECRET;
  const originalClientSecret = process.env.ABDM_CLIENT_SECRET;

  const webhookStore: any[] = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    webhookStore.length = 0;
    abdmWebhookService.clearInMemoryCache();
    process.env.ABDM_WEBHOOK_SECRET = webhookSecret;
    process.env.ABDM_CLIENT_SECRET = 'hidden_backend_client_secret_never_expose';

    const users: Record<string, any> = {
      [adminId]: { _id: new Types.ObjectId(adminId), role: 'ADMIN', accountStatus: 'ACTIVE', name: 'Platform Admin' },
      [patientId]: { _id: new Types.ObjectId(patientId), role: 'PATIENT', accountStatus: 'ACTIVE', name: 'Patient' },
      [doctorId]: { _id: new Types.ObjectId(doctorId), role: 'DOCTOR', accountStatus: 'ACTIVE', name: 'Doctor' },
      [labId]: { _id: new Types.ObjectId(labId), role: 'LABORATORY', accountStatus: 'ACTIVE', name: 'Lab' },
    };

    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) =>
      Promise.resolve(users[id?.toString()] || null) as any
    );

    vi.spyOn(AbdmWebhookEventModel, 'findOne').mockImplementation((q: any) => {
      const found =
        webhookStore.find(
          (e) => e.requestId === q.requestId && e.eventType === q.eventType
        ) || null;
      return Promise.resolve(found) as any;
    });

    vi.spyOn(AbdmWebhookEventModel, 'create').mockImplementation(async (doc: any) => {
      const saved = { ...doc, _id: new Types.ObjectId() };
      webhookStore.push(saved);
      return saved;
    });

    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({ _id: new Types.ObjectId() } as any);
  });

  afterAll(() => {
    process.env.ABDM_WEBHOOK_SECRET = originalWebhookSecret;
    process.env.ABDM_CLIENT_SECRET = originalClientSecret;
  });

  // ===========================================================================
  // 1. ADMIN INTEGRATION STATUS ENDPOINT & SECRET ISOLATION
  // ===========================================================================
  describe('1. Admin Integration Status & RBAC', () => {
    it('blocks unauthenticated (401) and non-ADMIN roles (403) from /api/v1/abdm/status', async () => {
      const unauth = await request(app).get('/api/v1/abdm/status');
      expect(unauth.status).toBe(401);

      for (const token of [patientToken, doctorToken, labToken]) {
        const res = await request(app)
          .get('/api/v1/abdm/status')
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
      }
    });

    it('returns redacted integration readiness dashboard for ADMIN with zero secrets leaked', async () => {
      const res = await request(app)
        .get('/api/v1/abdm/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fhirMappingReadiness).toBe('CONFIGURED');
      expect(res.body.data.consentAdapterReadiness).toBe('CONFIGURED');
      expect(res.body.data.hipReadiness).toBe('PENDING_ONBOARDING');
      expect(res.body.data.hiuReadiness).toBe('PENDING_ONBOARDING');
      expect(res.body.data.sandboxConnectivityStatus).not.toBe('CONNECTIVITY_VERIFIED');
      expect(res.body.data.sandboxConnectivityStatus).not.toBe('SANDBOX_TESTED');

      const rawText = JSON.stringify(res.body);
      expect(rawText).not.toContain('hidden_backend_client_secret_never_expose');
      expect(rawText).not.toContain(webhookSecret);
    });
  });

  // ===========================================================================
  // 2. FHIR R4 VALIDATION ENDPOINT
  // ===========================================================================
  describe('2. FHIR R4 Validation Endpoint', () => {
    it('validates a conformant Patient resource and flags invalid Document Bundles', async () => {
      const okRes = await request(app)
        .post('/api/v1/abdm/fhir/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resource: {
            resourceType: 'Patient',
            id: 'pat-101',
            meta: { profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient'] },
            name: [{ text: 'Synthetic Patient' }],
            gender: 'male',
            birthDate: '1990-01-15',
          },
        });
      expect(okRes.status).toBe(200);
      expect(okRes.body.data.valid).toBe(true);

      const badRes = await request(app)
        .post('/api/v1/abdm/fhir/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resource: {
            resourceType: 'Bundle',
            id: 'bundle-bad',
            type: 'document',
            timestamp: '2026-11-17T10:00:00.000Z',
            entry: [
              {
                fullUrl: 'urn:uuid:11111111-1111-4111-8111-111111111111',
                resource: { resourceType: 'Patient', id: 'p1', name: [{ text: 'No Composition' }] },
              },
            ],
          },
        });
      expect(badRes.status).toBe(200);
      expect(badRes.body.data.valid).toBe(false);
      expect(
        badRes.body.data.errors.some((e: any) => e.code === 'DOCUMENT_BUNDLE_COMPOSITION_FIRST')
      ).toBe(true);
    });
  });

  // ===========================================================================
  // 3. WEBHOOK CALLBACK SECURITY, REPLAY PROTECTION & IDEMPOTENCY
  // ===========================================================================
  describe('3. Inbound Webhook Callback Architecture', () => {
    it('rejects invalid callback payload with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/abdm/webhooks/callback')
        .set('x-abdm-webhook-secret', webhookSecret)
        .send({ invalidField: true });

      expect(res.status).toBe(422);
    });

    it('rejects unauthorized callback with missing or wrong signature/secret (401)', async () => {
      const payload = {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        eventType: 'on-discover',
        payload: { synthetic: true },
      };

      const res = await request(app)
        .post('/api/v1/abdm/webhooks/callback')
        .set('x-abdm-webhook-secret', 'wrong-secret')
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('ABDM_WEBHOOK_UNAUTHORIZED');
    });

    it('rejects stale callback timestamps outside ±5 minute replay window (401)', async () => {
      const staleTimestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const payload = {
        requestId: crypto.randomUUID(),
        timestamp: staleTimestamp,
        eventType: 'on-consent',
      };

      const res = await request(app)
        .post('/api/v1/abdm/webhooks/callback')
        .set('x-abdm-webhook-secret', webhookSecret)
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('ABDM_REPLAY_DETECTED');
    });

    it('accepts valid HMAC-SHA256 signed callback (202) and handles duplicate event idempotently', async () => {
      const reqId = crypto.randomUUID();
      const payload = {
        requestId: reqId,
        timestamp: new Date().toISOString(),
        eventType: 'on-fetch',
        resp: { requestId: crypto.randomUUID() },
        payload: { status: 'ACKNOWLEDGED' },
      };
      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const first = await request(app)
        .post('/api/v1/abdm/webhooks/callback')
        .set('x-abdm-signature', `sha256=${signature}`)
        .send(payload);

      expect(first.status).toBe(202);
      expect(first.body.data.acknowledged).toBe(true);
      expect(first.body.data.duplicate).toBe(false);
      expect(first.body.data.status).toBe('PROCESSED');

      // Replay exact same (requestId, eventType) -> idempotent duplicate acknowledgement
      const second = await request(app)
        .post('/api/v1/abdm/webhooks/callback')
        .set('x-abdm-signature', `sha256=${signature}`)
        .send(payload);

      expect(second.status).toBe(202);
      expect(second.body.data.acknowledged).toBe(true);
      expect(second.body.data.duplicate).toBe(true);
      expect(second.body.data.status).toBe('DUPLICATE_IGNORED');
      expect(webhookStore).toHaveLength(1);
    });
  });
});
