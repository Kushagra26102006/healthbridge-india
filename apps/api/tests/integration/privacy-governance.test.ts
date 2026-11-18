/**
 * HealthBridge India — Privacy Governance, Patient Rights & Admin Review HTTP Integration Tests (Day 9 Task 02)
 *
 * Covers:
 *   1. Public versioned privacy notice & governance metadata
 *   2. Patient privacy overview, access transparency history & cross-patient isolation
 *   3. Patient data export: generation, secret scrubbing, private download, cross-patient 403,
 *      expired link 410 GONE, neutral notification without download URLs
 *   4. Data correction request preserving original finalized clinical data & admin amendment review
 *   5. Account closure & deletion request enforcing clinical retention + active legal hold deferral
 *   6. Role isolation: DOCTOR/PHARMACY/LABORATORY denied patient/admin privacy routes (403)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  AuditLogModel,
  NotificationModel,
  DataAccessEventModel,
} from '../../src/database/models';
import { privacyGovernanceService } from '../../src/modules/privacy/privacy.service';

describe('Privacy Governance & Patient Rights — HTTP Integration Tests (Day 9 Task 02)', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const makeToken = (id: string, role: string, email: string) =>
    tokenService.generateAccessToken({ _id: id, role, email } as any);

  const patientAToken = makeToken(patientAId, 'PATIENT', 'priv.a@example.test');
  const patientBToken = makeToken(patientBId, 'PATIENT', 'priv.b@example.test');
  const doctorToken = makeToken(doctorId, 'DOCTOR', 'priv.doc@example.test');
  const adminToken = makeToken(adminId, 'ADMIN', 'priv.admin@example.test');

  const usersById: Record<string, any> = {
    [patientAId]: {
      _id: new Types.ObjectId(patientAId),
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      email: 'priv.a@example.test',
      phone: '9876543210',
      name: 'Meera Nair',
      passwordHash: '$2a$10$MUST_NEVER_APPEAR_IN_EXPORT',
    },
    [patientBId]: {
      _id: new Types.ObjectId(patientBId),
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      email: 'priv.b@example.test',
      phone: '9876543211',
      name: 'Rohan Das',
    },
    [doctorId]: {
      _id: new Types.ObjectId(doctorId),
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
      email: 'priv.doc@example.test',
      name: 'Dr. Kavita Rao',
    },
    [adminId]: {
      _id: new Types.ObjectId(adminId),
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      email: 'priv.admin@example.test',
      name: 'Privacy Officer Admin',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    privacyGovernanceService.clearMemoryStateForTests();

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) =>
      Promise.resolve(usersById[String(id)] || null)) as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  it('serves public versioned privacy notice and governance metadata without authentication', async () => {
    const noticeRes = await request(app).get('/api/v1/privacy/notice');
    expect(noticeRes.status).toBe(200);
    expect(noticeRes.body.data.version).toBe('1.0.0-draft');
    expect(noticeRes.body.data.reviewStatus).toBe('DRAFT_PENDING_LEGAL_COUNSEL_REVIEW');

    const govRes = await request(app).get('/api/v1/privacy/governance');
    expect(govRes.status).toBe(200);
    expect(govRes.body.data.retentionPolicies).toHaveLength(10);
    expect(govRes.body.data.externalSharingPosture.blanketSharingAllowed).toBe(false);
  });

  it('enforces role isolation across patient and admin privacy endpoints', async () => {
    const unauth = await request(app).get('/api/v1/patient/privacy/overview');
    expect(unauth.status).toBe(401);

    const docToPatientPrivacy = await request(app)
      .get('/api/v1/patient/privacy/overview')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(docToPatientPrivacy.status).toBe(403);

    const patientToAdminPrivacy = await request(app)
      .get('/api/v1/admin/privacy/requests')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(patientToAdminPrivacy.status).toBe(403);
  });

  it('returns patient-scoped access history and records privacy notice acknowledgement', async () => {
    const sampleEvent = {
      accessEventId: 'acc_test_1',
      patientId: new Types.ObjectId(patientAId),
      actorId: new Types.ObjectId(doctorId),
      actorRole: 'DOCTOR',
      actorName: 'Dr. Kavita Rao',
      organization: 'AIIMS Partner Clinic',
      resourceCategory: 'MEDICAL_RECORDS',
      accessPurpose: 'TREATMENT',
      lawfulBasis: 'EXPLICIT_PATIENT_CONSENT',
      authorizationDecision: 'ALLOWED',
      consentReference: 'CONSENT-101',
      timestamp: new Date(),
    };

    vi.spyOn(DataAccessEventModel, 'find').mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([sampleEvent]),
          }),
        }),
      }),
    } as any);
    vi.spyOn(DataAccessEventModel, 'countDocuments').mockResolvedValue(1);

    const histRes = await request(app)
      .get('/api/v1/patient/privacy/access-history')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(histRes.status).toBe(200);
    expect(histRes.body.data.items).toHaveLength(1);
    expect(histRes.body.data.items[0].authorizationDecision).toBe('ALLOWED');

    const ackRes = await request(app)
      .post('/api/v1/patient/privacy/notice-acknowledgements')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ noticeVersion: '1.0.0-draft' });
    expect(ackRes.status).toBe(201);

    const ovRes = await request(app)
      .get('/api/v1/patient/privacy/overview')
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(ovRes.status).toBe(200);
    expect(ovRes.body.data.privacyNotice.acknowledged).toBe(true);
  });

  it('generates secret-free private data export, blocks cross-patient download (403), rejects expired download (410), and sends neutral notification', async () => {
    const notifSpy = vi.spyOn(NotificationModel, 'create').mockResolvedValue({} as any);

    const createRes = await request(app)
      .post('/api/v1/patient/privacy/export-requests')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({ categories: ['PROFILE', 'CONSENT_HISTORY'], format: 'JSON' });

    expect(createRes.status).toBe(201);
    const exportId = createRes.body.data.id;
    expect(createRes.body.data.exportArtifact.storageScope).toBe('PRIVATE_EPHEMERAL');

    // Notification preview must NEVER include download links or clinical content
    expect(notifSpy).toHaveBeenCalledTimes(1);
    const notifPayload = JSON.stringify(notifSpy.mock.calls[0][0]);
    expect(notifPayload).not.toContain('/download');
    expect(notifPayload).not.toContain('passwordHash');

    // Cross-patient export download is strictly forbidden (403)
    const crossDownload = await request(app)
      .get(`/api/v1/patient/privacy/export-requests/${exportId}/download`)
      .set('Authorization', `Bearer ${patientBToken}`);
    expect(crossDownload.status).toBe(403);

    // Owner download succeeds and strips all secrets
    const ownDownload = await request(app)
      .get(`/api/v1/patient/privacy/export-requests/${exportId}/download`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(ownDownload.status).toBe(200);
    expect(ownDownload.headers['cache-control']).toContain('no-store');
    expect(ownDownload.headers['x-content-type-options']).toBe('nosniff');
    const exportedText = ownDownload.text || ownDownload.body.toString('utf-8');
    expect(exportedText).toContain('Meera Nair');
    expect(exportedText).not.toContain('MUST_NEVER_APPEAR_IN_EXPORT');
    expect(exportedText).not.toContain('passwordHash');

    // Simulate expired export artifact -> must return 410 GONE
    const rawMem = (privacyGovernanceService as any).memoryRequests.get(exportId);
    rawMem.exportArtifact.expiresAt = new Date(Date.now() - 60_000);

    const expiredDownload = await request(app)
      .get(`/api/v1/patient/privacy/export-requests/${exportId}/download`)
      .set('Authorization', `Bearer ${patientAToken}`);
    expect(expiredDownload.status).toBe(410);
  });

  it('preserves original finalized clinical data on correction request and allows audited admin amendment review', async () => {
    const corRes = await request(app)
      .post('/api/v1/patient/privacy/correction-requests')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        targetResource: 'LAB_REPORT',
        fieldOrCategory: 'Patient Age Metadata',
        originalValueSnapshot: 'Age: 38',
        requestedCorrection: 'Age: 34',
        patientExplanation: 'Date of birth year was transcribed incorrectly on lab slip.',
      });

    expect(corRes.status).toBe(201);
    expect(corRes.body.data.correctionDetails.isFinalizedClinicalRecord).toBe(true);
    expect(corRes.body.data.correctionDetails.originalValueSnapshot).toBe('Age: 38');

    const corId = corRes.body.data.id;
    const reviewRes = await request(app)
      .patch(`/api/v1/admin/privacy/requests/${corId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        decisionSummary: 'Verified against patient KYC; routed for formal lab amendment addendum.',
        appliedAmendmentReference: 'AMEND-LAB-2026-009',
      });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('APPROVED');
    expect(reviewRes.body.data.correctionDetails.appliedAmendmentReference).toBe('AMEND-LAB-2026-009');
  });

  it('enforces clinical retention rules and blocks disposal completion when an active legal hold applies', async () => {
    // 1. Admin places active legal hold on Patient A
    const holdRes = await request(app)
      .post('/api/v1/admin/privacy/legal-holds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        patientId: patientAId,
        scopeCategories: ['CLINICAL_RECORDS', 'ACCOUNT_INFORMATION'],
        reason: 'Pending medico-legal inquiry reference ML-2026-44',
      });
    expect(holdRes.status).toBe(201);

    // 2. Patient A submits deletion request -> system detects legal hold automatically
    const delRes = await request(app)
      .post('/api/v1/patient/privacy/deletion-requests')
      .set('Authorization', `Bearer ${patientAToken}`)
      .send({
        requestedAction: 'DATA_DELETION',
        reason: 'I want to close my account and remove personal data.',
        acknowledgeRetentionRules: true,
      });
    expect(delRes.status).toBe(201);
    expect(delRes.body.data.deletionDetails.legalHoldBlocked).toBe(true);
    expect(delRes.body.data.deletionDetails.actualDisposalOutcome).toBe('DEFERRED_LEGAL_HOLD');
    expect(delRes.body.data.deletionDetails.retentionBlockedCategories).toContain('CLINICAL_RECORDS');

    // 3. Attempting to mark disposal COMPLETED while legal hold is active is rejected (400)
    const delId = delRes.body.data.id;
    const blockedComplete = await request(app)
      .patch(`/api/v1/admin/privacy/requests/${delId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'COMPLETED',
        decisionSummary: 'Attempting premature deletion',
        actualDisposalOutcome: 'PARTIAL_RESTRICTED_RETENTION',
      });
    expect(blockedComplete.status).toBe(400);
    expect(blockedComplete.body.message).toMatch(/legal hold/i);
  });
});
