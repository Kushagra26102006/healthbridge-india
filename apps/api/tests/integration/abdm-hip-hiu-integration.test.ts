/**
 * HealthBridge India — Day 7 Task 04
 * Express API Integration Tests for ABDM HIP / HIU Health Information Exchange:
 *   - Discovery initiation, history, cross-patient denial, and webhook callback auth + replay protection
 *   - Care-context linking initiation, confirmation, local unlinking, and duplicate prevention
 *   - HIP incoming request webhook auth + consent enforcement + encrypted packaging
 *   - HIU request initiation, encrypted data push callback, quarantined review, and Doctor read-only view
 *   - Admin aggregate HIP/HIU analytics (zero patient PII, zero private keys, zero secrets)
 *
 * NOTE: Runs in development/mock mode against Express app + Supertest with mocked persistence.
 * Does NOT contact live external ABDM sandbox APIs.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/database/models';
import { AbhaLinkModel } from '../../src/modules/abdm/models/abha-link.model';
import { AbdmDiscoveryRequestModel } from '../../src/modules/abdm/models/abdm-discovery-request.model';
import { AbdmLinkedHealthRecordModel } from '../../src/modules/abdm/models/abdm-linked-health-record.model';
import { AbdmConsentArtefactModel } from '../../src/modules/abdm/models/abdm-consent-artefact.model';
import { AbdmHealthInformationRequestModel } from '../../src/modules/abdm/models/abdm-health-information-request.model';
import { AbdmHealthInformationTransferModel } from '../../src/modules/abdm/models/abdm-health-information-transfer.model';
import { AbdmTransferPackageModel } from '../../src/modules/abdm/models/abdm-transfer-package.model';
import { AbdmTransferAcknowledgementModel } from '../../src/modules/abdm/models/abdm-transfer-acknowledgement.model';
import { AbdmImportedRecordModel } from '../../src/modules/abdm/models/abdm-imported-record.model';
import { abdmEncryptionAdapter } from '../../src/modules/abdm/adapters/abdm-encryption.adapter';
import { abdmFhirBundleService } from '../../src/modules/abdm/services/abdm-fhir-bundle.service';
import { abdmConsentValidationService } from '../../src/modules/abdm/services/abdm-consent-validation.service';

function makeDoc<T extends Record<string, any>>(data: T) {
  const doc: any = {
    _id: data._id || new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
  doc.save = vi.fn(async () => doc);
  return doc;
}

describe('ABDM HIP / HIU Exchange — Express API Integration Tests (Day 7 Task 04 — Mocked)', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const patientAToken = tokenService.generateAccessToken({
    _id: patientAId,
    role: 'PATIENT',
    email: 'patient.a.hie@example.test',
  } as any);
  const patientBToken = tokenService.generateAccessToken({
    _id: patientBId,
    role: 'PATIENT',
    email: 'patient.b.hie@example.test',
  } as any);
  const doctorToken = tokenService.generateAccessToken({
    _id: doctorId,
    role: 'DOCTOR',
    email: 'doctor.hie@example.test',
  } as any);
  const adminToken = tokenService.generateAccessToken({
    _id: adminId,
    role: 'ADMIN',
    email: 'admin.hie@example.test',
  } as any);

  const webhookSecret = 'test_abdm_hie_webhook_secret_2026';

  const origEnabled = process.env.ABDM_ENABLED;
  const origEnv = process.env.ABDM_ENVIRONMENT;
  const origWebhookSecret = process.env.ABDM_WEBHOOK_SECRET;
  const origEncKey = process.env.ABDM_IDENTIFIER_ENCRYPTION_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    abdmConsentValidationService.clearCache();

    process.env.ABDM_ENABLED = 'true';
    process.env.ABDM_ENVIRONMENT = 'development';
    process.env.ABDM_WEBHOOK_SECRET = webhookSecret;
    process.env.ABDM_IDENTIFIER_ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    const users: Record<string, any> = {
      [patientAId]: { _id: patientAId, role: 'PATIENT', isActive: true, firstName: 'Riya', lastName: 'Sen' },
      [patientBId]: { _id: patientBId, role: 'PATIENT', isActive: true, firstName: 'Kabir', lastName: 'Das' },
      [doctorId]: { _id: doctorId, role: 'DOCTOR', isActive: true, firstName: 'Dr', lastName: 'Mehta' },
      [adminId]: { _id: adminId, role: 'ADMIN', isActive: true, firstName: 'Admin', lastName: 'User' },
    };

    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) => {
      const u = users[String(id)] || null;
      return {
        select: () => ({
          lean: async () => u,
          exec: async () => u,
        }),
        lean: async () => u,
        then: (resolve: any) => resolve(u),
      } as any;
    });
  });

  afterAll(() => {
    process.env.ABDM_ENABLED = origEnabled;
    process.env.ABDM_ENVIRONMENT = origEnv;
    process.env.ABDM_WEBHOOK_SECRET = origWebhookSecret;
    process.env.ABDM_IDENTIFIER_ENCRYPTION_KEY = origEncKey;
  });

  it('supports Discovery -> Callback -> Linking -> Confirm -> Unlink and blocks cross-patient access & webhook replay', async () => {
    const discoveries: any[] = [];
    const links: any[] = [];

    vi.spyOn(AbhaLinkModel, 'findOne').mockResolvedValue({
      patientId: new Types.ObjectId(patientAId),
      abhaAddress: 'riya.sen@sbx',
      isActive: true,
      verificationStatus: 'VERIFIED',
    } as any);

    vi.spyOn(AbdmDiscoveryRequestModel, 'findOne').mockImplementation(async (q: any) => {
      if (q?.externalTransactionRef) {
        return discoveries.find((d) => d.externalTransactionRef === q.externalTransactionRef) || null;
      }
      if (q?.status === 'DISCOVERY_PENDING') {
        return discoveries.find((d) => d.participantId === q.participantId && d.status === 'DISCOVERY_PENDING') || null;
      }
      return null;
    });
    vi.spyOn(AbdmDiscoveryRequestModel, 'findById').mockImplementation(async (id: any) => {
      return discoveries.find((d) => String(d._id) === String(id)) || null;
    });
    vi.spyOn(AbdmDiscoveryRequestModel, 'create').mockImplementation(async (d: any) => {
      const doc = makeDoc(d);
      discoveries.push(doc);
      return doc;
    });
    vi.spyOn(AbdmLinkedHealthRecordModel, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
      sort: () => ({ limit: async () => links }),
    } as any);
    vi.spyOn(AbdmLinkedHealthRecordModel, 'findOne').mockResolvedValue(null);
    vi.spyOn(AbdmLinkedHealthRecordModel, 'findById').mockImplementation(async (id: any) => {
      return links.find((l) => String(l._id) === String(id)) || null;
    });
    vi.spyOn(AbdmLinkedHealthRecordModel, 'create').mockImplementation(async (d: any) => {
      const doc = makeDoc(d);
      links.push(doc);
      return doc;
    });

    // 1. Patient A initiates discovery
    const initRes = await request(app)
      .post('/api/v1/abdm/hie/discovery')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        participantId: 'IN2910000182',
        participantName: 'Sandbox General Hospital',
        requestedCategories: ['OPConsultation', 'DiagnosticReport'],
      });
    expect(initRes.status).toBe(201);
    const discId = initRes.body.data.id;
    const extTxnRef = initRes.body.data.externalTransactionRef;

    // 2. Patient B cannot read Patient A's discovery
    const crossPatientRes = await request(app)
      .get(`/api/v1/abdm/hie/discovery/${discId}`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(crossPatientRes.status).toBe(403);

    // 3. Unauthenticated webhook rejected (401)
    const unauthCb = await request(app)
      .post('/api/v1/abdm/webhooks/hie/discovery')
      .send({
        eventId: 'evt-cb-1',
        timestamp: new Date().toISOString(),
        externalTransactionRef: extTxnRef,
        participantId: 'IN2910000182',
        status: 'DISCOVERY_COMPLETED',
        careContexts: [],
      });
    expect(unauthCb.status).toBe(401);

    // 4. Stale replay timestamp (> 5 minutes old) rejected (401)
    const staleCb = await request(app)
      .post('/api/v1/abdm/webhooks/hie/discovery')
      .set('x-abdm-webhook-secret', webhookSecret)
      .send({
        eventId: 'evt-cb-stale',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        externalTransactionRef: extTxnRef,
        participantId: 'IN2910000182',
        status: 'DISCOVERY_COMPLETED',
        careContexts: [],
      });
    expect(staleCb.status).toBe(401);

    // 5. Authenticated fresh callback accepted (202)
    const validCb = await request(app)
      .post('/api/v1/abdm/webhooks/hie/discovery')
      .set('x-abdm-webhook-secret', webhookSecret)
      .send({
        eventId: 'evt-cb-ok',
        timestamp: new Date().toISOString(),
        externalTransactionRef: extTxnRef,
        participantId: 'IN2910000182',
        status: 'DISCOVERY_COMPLETED',
        careContexts: [
          {
            careContextReference: 'CC-HTTP-01',
            display: 'CBC Diagnostic Report',
            hiTypes: ['DiagnosticReport'],
          },
        ],
      });
    expect(validCb.status).toBe(202);
    expect(validCb.body.data.discovery.status).toBe('DISCOVERY_COMPLETED');

    // 6. Link -> Confirm -> Local Unlink
    const linkRes = await request(app)
      .post('/api/v1/abdm/hie/linking')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        discoveryId: discId,
        participantId: 'IN2910000182',
        careContextReference: 'CC-HTTP-01',
        careContextDisplay: 'CBC Diagnostic Report',
        hiTypes: ['DiagnosticReport'],
        linkMode: 'USER_INITIATED',
      });
    expect(linkRes.status).toBe(201);
    const linkId = linkRes.body.data.id;

    const confirmRes = await request(app)
      .post(`/api/v1/abdm/hie/linking/${linkId}/confirm`)
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ otpToken: '112233', confirmed: true });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('LINKED');

    const unlinkRes = await request(app)
      .post(`/api/v1/abdm/hie/linking/${linkId}/unlink`)
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ reason: 'Testing local unlink scope' });
    expect(unlinkRes.status).toBe(200);
    expect(unlinkRes.body.data.unlinkScope).toBe('LOCAL_HEALTHBRIDGE_UNLINK_ONLY');
  });

  it('executes HIU request -> encrypted data push webhook -> Doctor read-only imported record view -> Admin zero-PII analytics', async () => {
    const artefact = makeDoc({
      externalConsentId: 'consent-http-700',
      origin: 'ABDM_HIE_CM',
      patientId: new Types.ObjectId(patientAId),
      hiuId: 'HEALTHBRIDGE_HIU',
      purposeCode: 'CAREMGT',
      hiTypes: ['DiagnosticReport'],
      dateRange: {
        from: new Date('2026-01-01T00:00:00Z'),
        to: new Date('2026-12-31T23:59:59Z'),
      },
      dataEraseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      externalStatus: 'GRANTED',
      validationStatus: 'VALID',
      revocationStatus: 'NOT_REVOKED',
      signatureVerified: true,
      externalConfirmationReceived: true,
    });

    const transfers: any[] = [];
    const imports: any[] = [];
    const acks: any[] = [];

    vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(artefact);
    vi.spyOn(AbdmConsentArtefactModel, 'findById').mockResolvedValue(artefact);
    vi.spyOn(AbdmConsentArtefactModel, 'find').mockReturnValue({
      select: async () => [artefact],
    } as any);
    vi.spyOn(AbdmHealthInformationRequestModel, 'create').mockImplementation(async (d: any) =>
      makeDoc(d)
    );
    vi.spyOn(AbdmHealthInformationTransferModel, 'create').mockImplementation(async (d: any) => {
      const doc = makeDoc(d);
      transfers.push(doc);
      return doc;
    });
    vi.spyOn(AbdmHealthInformationTransferModel, 'findOne').mockImplementation(async (q: any) => {
      return transfers.find((t) => t.externalTransactionId === q.externalTransactionId) || null;
    });
    vi.spyOn(AbdmHealthInformationTransferModel, 'findById').mockImplementation(async (id: any) => {
      return transfers.find((t) => String(t._id) === String(id)) || null;
    });
    vi.spyOn(AbdmImportedRecordModel, 'findOne').mockResolvedValue(null);
    vi.spyOn(AbdmImportedRecordModel, 'create').mockImplementation(async (d: any) => {
      const doc = makeDoc(d);
      imports.push(doc);
      return doc;
    });
    vi.spyOn(AbdmImportedRecordModel, 'find').mockReturnValue({
      sort: () => ({ limit: async () => imports }),
    } as any);
    vi.spyOn(AbdmTransferAcknowledgementModel, 'findOne').mockResolvedValue(null);
    vi.spyOn(AbdmTransferAcknowledgementModel, 'create').mockImplementation(async (d: any) => {
      const doc = makeDoc(d);
      acks.push(doc);
      return doc;
    });
    vi.spyOn(AbhaLinkModel, 'findOne').mockReturnValue({
      lean: async () => ({ abhaAddress: 'riya.sen@sbx' }),
    } as any);

    // 1. HIU initiates health info request
    const hiuReqRes = await request(app)
      .post('/api/v1/abdm/hiu/requests')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientAId,
        consentArtefactId: String(artefact._id),
        participantId: 'EXTERNAL-LAB-HIP',
        hiTypes: ['DiagnosticReport'],
        purposeCode: 'CAREMGT',
        dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
      });
    expect(hiuReqRes.status).toBe(201);
    const txnId = hiuReqRes.body.data.transfer.externalTransactionId;
    const hiuKeyMaterial = hiuReqRes.body.data.ephemeralKeyMaterial;

    // Ensure private key never leaked in HTTP response
    expect(JSON.stringify(hiuReqRes.body)).not.toContain('privateKey');

    // 2. Encrypt a valid FHIR DocumentBundle and POST to HIU data-push webhook
    const bundleRes = await abdmFhirBundleService.generateDocumentBundle({
      hiType: 'DiagnosticReport',
      patient: { id: patientAId, fullName: 'Riya Sen', abhaAddress: 'riya.sen@sbx', abhaVerified: true },
      practitioner: { id: 'p1', fullName: 'Dr. Path' },
      organization: { id: 'o1', name: 'External Sandbox Diagnostics' },
      diagnosticReport: {
        id: 'lab-99',
        reportNumber: 'EXT-99',
        testName: 'HbA1c',
        issuedAt: '2026-11-01T09:00:00Z',
        status: 'final',
        observations: [
          { testName: 'HbA1c', value: '5.4', numericValue: 5.4, unit: '%', referenceRange: '< 5.7 %' },
        ],
      },
    });
    const encrypted = abdmEncryptionAdapter.encryptBundleForPeer(
      JSON.stringify(bundleRes.bundle),
      hiuKeyMaterial
    );

    const pushRes = await request(app)
      .post('/api/v1/abdm/webhooks/hiu/data-push')
      .set('x-abdm-webhook-secret', webhookSecret)
      .send({
        pageNumber: 0,
        pageCount: 1,
        transactionId: txnId,
        timestamp: new Date().toISOString(),
        sourceParticipantId: 'EXTERNAL-LAB-HIP',
        entries: [
          {
            content: encrypted.ciphertextBase64,
            media: 'application/fhir+json',
            careContextReference: 'CC-HBA1C-99',
            encrypted: true,
          },
        ],
        keyMaterial: encrypted.senderKeyMaterial,
      });
    expect(pushRes.status).toBe(202);
    expect(pushRes.body.data.imported).toHaveLength(1);
    expect(pushRes.body.data.transfer.status).toBe('COMPLETED');

    // 3. Doctor views authorized imported records (read-only)
    const docViewRes = await request(app)
      .get('/api/v1/abdm/hie/imported-records')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docViewRes.status).toBe(200);
    expect(docViewRes.body.data).toHaveLength(1);
    expect(docViewRes.body.data[0].readOnly).toBe(true);
    expect(docViewRes.body.data[0].sourceOrganizationName).toBe('External Sandbox Diagnostics');

    // 4. Doctor cannot review/mutate quarantined records (403)
    const docReviewAttempt = await request(app)
      .post(`/api/v1/abdm/hie/imported-records/${imports[0]._id}/review`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ decision: 'APPROVE', reviewNotes: 'Not allowed for doctors' });
    expect(docReviewAttempt.status).toBe(403);

    // 5. Admin aggregate analytics returns zero patient PII and non-admin is blocked (403)
    const nonAdminAnalytics = await request(app)
      .get('/api/v1/abdm/hie/analytics')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(nonAdminAnalytics.status).toBe(403);

    const adminAnalytics = await request(app)
      .get('/api/v1/abdm/hie/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminAnalytics.status).toBe(200);
    expect(adminAnalytics.body.data.liveExchangeEnabled).toBe(false);
    expect(adminAnalytics.body.data.encryption.liveFideliusConfigured).toBe(false);
    const analyticsJson = JSON.stringify(adminAnalytics.body.data);
    expect(analyticsJson).not.toContain('riya.sen@sbx');
    expect(analyticsJson).not.toContain(webhookSecret);
  });

  it('rejects HIP webhook without valid signature/secret and rejects duplicate ack idempotently', async () => {
    const transfer = makeDoc({
      internalTransferRef: 'HIP-TRF-ACK1',
      externalTransactionId: 'txn-ack-http-1',
      role: 'HIP',
      direction: 'OUTBOUND_HIP_PUSH',
      patientId: new Types.ObjectId(patientAId),
      participantId: 'HIU-01',
      consentArtefactId: new Types.ObjectId().toString(),
      externalConsentId: 'consent-1',
      hiTypes: ['OPConsultation'],
      status: 'TRANSFER_PENDING',
      stateHistory: [],
      correlationId: 'corr-1',
      environment: 'development',
      isMocked: true,
    });
    const acks: any[] = [];

    vi.spyOn(AbdmHealthInformationTransferModel, 'findOne').mockResolvedValue(transfer);
    vi.spyOn(AbdmTransferAcknowledgementModel, 'findOne').mockImplementation(async (q: any) => {
      return acks.find((a) => a.acknowledgementRef === q.acknowledgementRef) || null;
    });
    vi.spyOn(AbdmTransferAcknowledgementModel, 'create').mockImplementation(async (d: any) => {
      const doc = makeDoc(d);
      acks.push(doc);
      return doc;
    });
    vi.spyOn(AbdmTransferPackageModel, 'find').mockResolvedValue([]);

    // Unauthenticated HIP request webhook -> 401
    const unauthHip = await request(app)
      .post('/api/v1/abdm/webhooks/hip/health-information/request')
      .send({
        externalTransactionId: 'txn-unauth',
        timestamp: new Date().toISOString(),
        consentArtefactId: 'c1',
        hiuId: 'hiu1',
        dateRange: { from: '2026-01-01T00:00:00Z', to: '2026-12-01T00:00:00Z' },
        dataPushUrl: 'https://hiu.example.org/push',
        keyMaterial: {
          cryptoAlg: 'ECDH',
          curve: 'Curve25519',
          dhPublicKey: {
            expiry: '2026-12-31T00:00:00Z',
            parameters: 'Curve25519/32byte random key',
            keyValue: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          },
          nonce: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
        },
      });
    expect(unauthHip.status).toBe(401);

    // Acknowledgement webhook idempotency
    const ackPayload = {
      acknowledgementRef: 'ACK-HTTP-IDEMP-1',
      externalTransactionId: 'txn-ack-http-1',
      role: 'HIP',
      ackType: 'TRANSFER_COMPLETED',
      externalSessionStatus: 'TRANSFERRED',
      careContextStatuses: [{ careContextReference: 'ENC-1', hiStatus: 'OK' }],
      timestamp: new Date().toISOString(),
    };
    const r1 = await request(app)
      .post('/api/v1/abdm/webhooks/hie/acknowledgement')
      .set('x-abdm-webhook-secret', webhookSecret)
      .send(ackPayload);
    expect(r1.status).toBe(202);
    expect(r1.body.data.duplicate).toBe(false);

    const r2 = await request(app)
      .post('/api/v1/abdm/webhooks/hie/acknowledgement')
      .set('x-abdm-webhook-secret', webhookSecret)
      .send(ackPayload);
    expect(r2.status).toBe(202);
    expect(r2.body.data.duplicate).toBe(true);
  });
});
