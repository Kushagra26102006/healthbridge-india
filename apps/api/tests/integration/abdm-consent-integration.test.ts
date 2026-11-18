/**
 * HealthBridge India — Day 7 Task 03
 * Express API Integration Tests for ABDM Consent Manager Routes:
 * - RBAC & Server-Side Actor Derivation
 * - HIU Consent Request Initiation
 * - Cross-Patient Access Denial (Requests, Artefacts, History, Revocation)
 * - Authenticated Inbound V3 Consent Callbacks (HMAC/Secret Auth, Replay Guard, Idempotency)
 * - Centralized Authorization Endpoint (including Patient Self-Access Preservation)
 * - FHIR R4 Consent Projection Endpoint
 * - Admin Aggregate Analytics (Zero Patient PII / Zero Secrets) & Sync Trigger
 *
 * NOTE: Runs in development/mock mode against Express app + Supertest with mocked persistence.
 * Does NOT contact live external ABDM HIE-CM sandbox APIs.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/database/models';
import { AbhaLinkModel } from '../../src/modules/abdm/models/abha-link.model';
import { AbdmConsentRequestModel } from '../../src/modules/abdm/models/abdm-consent-request.model';
import { AbdmConsentArtefactModel } from '../../src/modules/abdm/models/abdm-consent-artefact.model';
import { AbdmConsentEventModel } from '../../src/modules/abdm/models/abdm-consent-event.model';
import { AbdmConsentSyncLogModel } from '../../src/modules/abdm/models/abdm-consent-sync-log.model';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { abdmWebhookService } from '../../src/modules/abdm/webhooks/abdm-webhook.service';
import { abdmConsentValidationService } from '../../src/modules/abdm/services/abdm-consent-validation.service';
import { abdmConsentLifecycleService } from '../../src/modules/abdm/services/abdm-consent-lifecycle.service';

describe('ABDM Consent Manager — Express API Integration Tests (Day 7 Task 03 — Mocked)', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const patientAToken = tokenService.generateAccessToken({
    _id: patientAId,
    role: 'PATIENT',
    email: 'patient.a.consent@example.test',
  } as any);
  const patientBToken = tokenService.generateAccessToken({
    _id: patientBId,
    role: 'PATIENT',
    email: 'patient.b.consent@example.test',
  } as any);
  const doctorToken = tokenService.generateAccessToken({
    _id: doctorId,
    role: 'DOCTOR',
    email: 'doctor.consent@example.test',
  } as any);
  const adminToken = tokenService.generateAccessToken({
    _id: adminId,
    role: 'ADMIN',
    email: 'admin.consent@example.test',
  } as any);

  const webhookSecret = 'test_abdm_consent_webhook_secret_2026';

  const origEnabled = process.env.ABDM_ENABLED;
  const origEnv = process.env.ABDM_ENVIRONMENT;
  const origWebhookSecret = process.env.ABDM_WEBHOOK_SECRET;
  const origClientSecret = process.env.ABDM_CLIENT_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
    abdmWebhookService.clearInMemoryCache();
    abdmConsentValidationService.clearCache();

    process.env.ABDM_ENABLED = 'true';
    process.env.ABDM_ENVIRONMENT = 'development';
    process.env.ABDM_WEBHOOK_SECRET = webhookSecret;
    process.env.ABDM_CLIENT_SECRET = 'super_secret_client_key_must_never_leak';

    const users: Record<string, any> = {
      [patientAId]: { _id: new Types.ObjectId(patientAId), role: 'PATIENT', accountStatus: 'ACTIVE', name: 'Patient A' },
      [patientBId]: { _id: new Types.ObjectId(patientBId), role: 'PATIENT', accountStatus: 'ACTIVE', name: 'Patient B' },
      [doctorId]: { _id: new Types.ObjectId(doctorId), role: 'DOCTOR', accountStatus: 'ACTIVE', name: 'Dr. Verma' },
      [adminId]: { _id: new Types.ObjectId(adminId), role: 'ADMIN', accountStatus: 'ACTIVE', name: 'Admin' },
    };

    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) =>
      Promise.resolve(users[id?.toString()] || null) as any
    );
  });

  afterAll(() => {
    process.env.ABDM_ENABLED = origEnabled;
    process.env.ABDM_ENVIRONMENT = origEnv;
    process.env.ABDM_WEBHOOK_SECRET = origWebhookSecret;
    process.env.ABDM_CLIENT_SECRET = origClientSecret;
  });

  it('enforces RBAC across HIU consent initiation, patient consent routes, and admin analytics', async () => {
    // Unauthenticated blocked
    const unauth = await request(app).get('/api/v1/abdm/consent/requests');
    expect(unauth.status).toBe(401);

    // Patient cannot initiate HIU consent requests
    const patientInit = await request(app)
      .post('/api/v1/abdm/consent/requests')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        patientId: patientBId,
        purposeCode: 'CAREMGT',
        hiTypes: ['DiagnosticReport'],
        dateRange: {
          from: new Date(Date.now() - 86400_000 * 30).toISOString(),
          to: new Date().toISOString(),
        },
        dataEraseAt: new Date(Date.now() + 86400_000 * 30).toISOString(),
      });
    expect(patientInit.status).toBe(403);

    // Doctor cannot read admin consent analytics
    const docAnalytics = await request(app)
      .get('/api/v1/abdm/consent/analytics')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docAnalytics.status).toBe(403);

    // Patient cannot trigger admin sync sweep
    const patSync = await request(app)
      .post('/api/v1/abdm/consent/sync')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({});
    expect(patSync.status).toBe(403);
  });

  it('allows authorized doctor to initiate HIU consent request and enforces strict cross-patient ownership', async () => {
    const reqId = new Types.ObjectId();

    vi.spyOn(AbhaLinkModel, 'findOne').mockResolvedValue({
      patientId: new Types.ObjectId(patientAId),
      abhaAddress: 'patient.a@sbx',
      linkStatus: 'LINKED',
      verificationStatus: 'VERIFIED',
    } as any);

    const mockReqDoc: any = {
      _id: reqId,
      internalReference: 'HB-ABDM-CR-INT1',
      externalRequestId: 'sbx-cr-int-1',
      patientId: new Types.ObjectId(patientAId),
      patientAbhaAddress: 'patient.a@sbx',
      requestingUserId: new Types.ObjectId(doctorId),
      requestingUserRole: 'DOCTOR',
      requestingParticipantId: 'HB-HIU-DEV',
      requestingParticipantRole: 'HIU',
      requestingOrganizationName: 'HealthBridge Diagnostics',
      requesterName: 'Dr. Verma',
      purposeCode: 'CAREMGT',
      purposeText: 'Care Management',
      hiTypes: ['DiagnosticReport', 'Prescription'],
      accessMode: 'VIEW',
      dateRange: {
        from: new Date(Date.now() - 86400_000 * 30),
        to: new Date(),
      },
      dataEraseAt: new Date(Date.now() + 86400_000 * 30),
      frequency: { unit: 'DAY', value: 1, repeats: 1 },
      internalStatus: 'PENDING_SUBMISSION',
      externalStatus: 'UNKNOWN',
      correlationId: 'corr-int-1',
      artefactIds: [],
      environment: 'development',
      isMocked: true,
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(AbdmConsentRequestModel, 'create').mockResolvedValue(mockReqDoc);
    vi.spyOn(AbdmConsentRequestModel, 'findById').mockResolvedValue(mockReqDoc);
    vi.spyOn(AbdmConsentEventModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);

    const createRes = await request(app)
      .post('/api/v1/abdm/consent/requests')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientAId,
        purposeCode: 'CAREMGT',
        hiTypes: ['DiagnosticReport', 'Prescription'],
        accessMode: 'VIEW',
        dateRange: {
          from: new Date(Date.now() - 86400_000 * 30).toISOString(),
          to: new Date().toISOString(),
        },
        dataEraseAt: new Date(Date.now() + 86400_000 * 30).toISOString(),
        requestingOrganizationName: 'HealthBridge Diagnostics',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.internalStatus).toBe('AWAITING_PATIENT_ACTION');
    expect(createRes.body.data.externalStatus).toBe('REQUESTED');

    // Patient A can view own request
    const ownView = await request(app)
      .get(`/api/v1/abdm/consent/requests/${reqId.toString()}`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(ownView.status).toBe(200);
    expect(ownView.body.data.internalReference).toBe('HB-ABDM-CR-INT1');

    // Patient B is DENIED cross-patient access (403)
    const crossPatientView = await request(app)
      .get(`/api/v1/abdm/consent/requests/${reqId.toString()}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(crossPatientView.status).toBe(403);
  });

  it('authenticates ABDM consent callbacks, blocks unauthenticated/replayed callbacks, and deduplicates idempotently', async () => {
    const callbackBody = {
      requestId: `cb-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      payload: {
        notification: {
          consentRequestId: 'sbx-cr-int-1',
          status: 'GRANTED',
          consentArtefacts: [{ id: 'art-cb-1' }],
        },
      },
    };

    // Unauthenticated callback rejected with 401
    const noAuth = await request(app)
      .post('/api/v1/abdm/webhooks/consent/hiu-notify')
      .send(callbackBody);
    expect(noAuth.status).toBe(401);

    // Replayed timestamp (> 5 minutes old) rejected with 401
    const staleBody = {
      ...callbackBody,
      requestId: `cb-old-${crypto.randomUUID()}`,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };
    const staleRes = await request(app)
      .post('/api/v1/abdm/webhooks/consent/hiu-notify')
      .set('x-abdm-webhook-secret', webhookSecret)
      .send(staleBody);
    expect(staleRes.status).toBe(401);

    // Valid HMAC-SHA256 authenticated callback accepted (202) and dispatched
    const dispatchSpy = vi
      .spyOn(abdmConsentLifecycleService, 'processConsentCallback')
      .mockResolvedValue({
        processed: true,
        outcome: 'PROCESSED',
        reason: 'HIU consent notification processed',
      });

    const rawBody = JSON.stringify(callbackBody);
    const sig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    const okRes = await request(app)
      .post('/api/v1/abdm/webhooks/consent/hiu-notify')
      .set('x-abdm-signature', `sha256=${sig}`)
      .send(callbackBody);
    expect(okRes.status).toBe(202);
    expect(okRes.body.data.duplicate).toBe(false);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);

    // Duplicate replay with identical requestId -> 202 duplicate: true (not dispatched twice)
    const dupRes = await request(app)
      .post('/api/v1/abdm/webhooks/consent/hiu-notify')
      .set('x-abdm-signature', `sha256=${sig}`)
      .send(callbackBody);
    expect(dupRes.status).toBe(202);
    expect(dupRes.body.data.duplicate).toBe(true);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('serves FHIR R4 Consent projection, enforces patient revocation ownership, and preserves patient self-access', async () => {
    const artId = new Types.ObjectId();
    const artDoc: any = {
      _id: artId,
      internalReference: 'HB-ABDM-ART-55',
      externalConsentId: 'abdm-art-55',
      origin: 'ABDM_HIE_CM',
      patientId: new Types.ObjectId(patientAId),
      patientAbhaAddress: 'patient.a@sbx',
      hiuId: 'HB-HIU-01',
      hiuName: 'Partner Clinic',
      purposeCode: 'CAREMGT',
      purposeText: 'Care Management',
      hiTypes: ['DiagnosticReport'],
      accessMode: 'VIEW',
      dateRange: {
        from: new Date(Date.now() - 86400_000 * 30),
        to: new Date(Date.now() + 86400_000 * 10),
      },
      dataEraseAt: new Date(Date.now() + 86400_000 * 30),
      expiresAt: new Date(Date.now() + 86400_000 * 30),
      externalStatus: 'GRANTED',
      validationStatus: 'VALID',
      revocationStatus: 'NOT_REVOKED',
      signatureVerified: true,
      externalConfirmationReceived: true,
      originalExternalPayload: { consentId: 'abdm-art-55', status: 'GRANTED' },
      payloadSha256: 'b'.repeat(64),
      source: 'MOCK_HIE_CM_DEVELOPMENT',
      environment: 'development',
      isMocked: true,
      validationIssues: [],
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(AbdmConsentArtefactModel, 'findById').mockResolvedValue(artDoc);
    vi.spyOn(AbdmConsentEventModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);

    // Patient A gets FHIR R4 Consent projection
    const fhirRes = await request(app)
      .get(`/api/v1/abdm/consent/artefacts/${artId.toString()}/fhir`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(fhirRes.status).toBe(200);
    expect(fhirRes.body.data.targetResourceType).toBe('Consent');
    expect(fhirRes.body.data.officialIgConformanceClaimed).toBe(false);
    expect(fhirRes.body.data.unmappedFields.length).toBeGreaterThan(0);

    // Patient B cannot revoke Patient A's artefact
    const crossRevoke = await request(app)
      .post(`/api/v1/abdm/consent/artefacts/${artId.toString()}/revoke`)
      .set('Authorization', `Bearer ${patientBToken}`)
      .send({ reason: 'Unauthorized attempt' });
    expect(crossRevoke.status).toBe(403);

    // Patient A revokes own artefact -> honest PENDING_CONFIRMATION
    const ownRevoke = await request(app)
      .post(`/api/v1/abdm/consent/artefacts/${artId.toString()}/revoke`)
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ reason: 'Care episode completed' });
    expect(ownRevoke.status).toBe(200);
    expect(ownRevoke.body.data.revocationStatus).toBe('PENDING_CONFIRMATION');
    expect(ownRevoke.body.data.externalConfirmed).toBe(false);

    // Patient A self-access remains ALLOWED via centralized validation endpoint even with no active ABDM artefact
    const selfValidate = await request(app)
      .post('/api/v1/abdm/consent/validate-access')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        patientId: patientAId,
        requestedHiType: 'DiagnosticReport',
        requestedPurposeCode: 'PATRQT',
      });
    expect(selfValidate.status).toBe(200);
    expect(selfValidate.body.data.decision).toBe('ALLOWED');
    expect(selfValidate.body.data.reasonCode).toBe('PATIENT_SELF_ACCESS_ALLOWED');
  });

  it('returns aggregate-only admin consent analytics with zero patient PII and zero secrets', async () => {
    vi.spyOn(AbdmConsentRequestModel, 'countDocuments').mockResolvedValue(2 as any);
    vi.spyOn(AbdmConsentArtefactModel, 'countDocuments').mockResolvedValue(1 as any);
    vi.spyOn(AbdmConsentSyncLogModel, 'countDocuments').mockResolvedValue(0 as any);
    vi.spyOn(AbdmConsentEventModel, 'countDocuments').mockResolvedValue(0 as any);
    vi.spyOn(AbdmConsentSyncLogModel, 'findOne').mockReturnValue({
      sort: vi.fn().mockResolvedValue(null),
    } as any);

    const res = await request(app)
      .get('/api/v1/abdm/consent/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.consentReadiness).toBe('MOCKED');
    expect(res.body.data.metrics.pendingRequests).toBe(2);
    expect(res.body.data.environmentBreakdown).toHaveProperty('mockedDevelopment');
    expect(res.body.data.environmentBreakdown).toHaveProperty('sandbox');
    expect(res.body.data.environmentBreakdown).toHaveProperty('production');

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('super_secret_client_key_must_never_leak');
    expect(serialized).not.toContain(webhookSecret);
    expect(serialized).not.toContain('patient.a@sbx');
  });
});
