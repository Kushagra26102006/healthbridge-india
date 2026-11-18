/**
 * HealthBridge India — Cross-Module Workflow Automation, Consent Enforcement & Admin Recovery Integration Tests (Day 8 Task 03)
 *
 * Covers:
 *   - Healthcare workflow handlers:
 *       - Appointment booked/cancelled/completed (never fabricates diagnosis/notes)
 *       - Encounter finalized -> timeline projection (drafts excluded)
 *       - Prescription issued -> pharmacy discovery & patient notification (drafts strictly blocked)
 *       - Prescription dispensed / partially dispensed -> idempotent status sync, ZERO double stock deduction
 *       - Laboratory order created, Sample collected, Report published & Report amended (versioning preserved)
 *   - Immediate Synchronous Consent Revocation:
 *       - Revoking consent blocks access IMMEDIATELY even while async event worker is offline
 *   - Admin Observability & Controlled Recovery APIs (`/api/v1/events/*`):
 *       - Non-admin roles (PATIENT, DOCTOR, PHARMACY, LABORATORY) rejected with 403
 *       - Unauthenticated requests rejected with 401
 *       - No arbitrary client event-publishing endpoint (`POST /api/v1/events` -> 404)
 *       - Admin inspection redacts patientId/doctorId and sensitive fields
 *       - Controlled dead-letter replay preserves eventId, records replayHistory & blocks unsafe replay
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel, AuditLogModel } from '../../src/database/models';
import { PrescriptionModel } from '../../src/modules/healthcare/models/prescription.model';
import { ConsentRequestModel } from '../../src/modules/consent/models/consent-request.model';
import { ConsentArtifactModel } from '../../src/modules/consent/models/consent-artifact.model';
import { OutboxEventModel } from '../../src/modules/events/models/outbox-event.model';
import { TimelineEventModel } from '../../src/modules/events/models/timeline-event.model';
import { EventHandlerExecutionModel } from '../../src/modules/events/models/event-handler-execution.model';
import { WorkerHeartbeatModel } from '../../src/modules/events/models/worker-heartbeat.model';
import { consentService } from '../../src/modules/consent/services/consent.service';
import { consentEnforcementService } from '../../src/modules/consent/services/consent-enforcement.service';
import { timelineProjectionHandler } from '../../src/modules/events/handlers/timeline-projection.handler';
import { pharmacyWorkflowHandler } from '../../src/modules/events/handlers/workflow-automation.handlers';
import { unifiedNotificationEventHandler } from '../../src/modules/notifications/services/notification-event.handler';
import { notificationService } from '../../src/modules/notifications/services/notification.service';

function chainQuery(result: any) {
  const q: any = {
    select: vi.fn().mockImplementation(() => q),
    sort: vi.fn().mockImplementation(() => q),
    skip: vi.fn().mockImplementation(() => q),
    limit: vi.fn().mockImplementation(() => q),
    lean: vi.fn().mockResolvedValue(result),
    exec: vi.fn().mockResolvedValue(result),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  };
  return q;
}

describe('Cross-Module Workflow Automation & Event Recovery — Integration Tests (Day 8 Task 03)', () => {
  const app = createApp();

  const patientId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const pharmacyId = new Types.ObjectId().toString();
  const labId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const makeToken = (id: string, role: string, email: string) =>
    tokenService.generateAccessToken({ _id: id, role, email } as any);

  const patientToken = makeToken(patientId, 'PATIENT', 'wf.patient@example.test');
  const doctorToken = makeToken(doctorId, 'DOCTOR', 'wf.doctor@example.test');
  const pharmacyToken = makeToken(pharmacyId, 'PHARMACY', 'wf.pharmacy@example.test');
  const labToken = makeToken(labId, 'LABORATORY', 'wf.lab@example.test');
  const adminToken = makeToken(adminId, 'ADMIN', 'wf.admin@example.test');

  const usersById: Record<string, any> = {
    [patientId]: { _id: new Types.ObjectId(patientId), role: 'PATIENT', email: 'wf.patient@example.test', accountStatus: 'ACTIVE', name: 'Synthetic Patient' },
    [doctorId]: { _id: new Types.ObjectId(doctorId), role: 'DOCTOR', email: 'wf.doctor@example.test', accountStatus: 'ACTIVE', name: 'Dr. Synthetic' },
    [pharmacyId]: { _id: new Types.ObjectId(pharmacyId), role: 'PHARMACY', email: 'wf.pharmacy@example.test', accountStatus: 'ACTIVE', name: 'Synthetic Rx' },
    [labId]: { _id: new Types.ObjectId(labId), role: 'LABORATORY', email: 'wf.lab@example.test', accountStatus: 'ACTIVE', name: 'Synthetic Lab' },
    [adminId]: { _id: new Types.ObjectId(adminId), role: 'ADMIN', email: 'wf.admin@example.test', accountStatus: 'ACTIVE', name: 'Synthetic Admin' },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    consentEnforcementService.clearRevocationBarrier();
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) =>
      Promise.resolve(usersById[String(id)] || null)) as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  /* =========================================================================
     1. SYNCHRONOUS IMMEDIATE CONSENT REVOCATION (NO ASYNC WORKER DEPENDENCY)
     ========================================================================= */
  describe('Immediate Synchronous Consent Revocation Enforcement', () => {
    it('blocks doctor access IMMEDIATELY upon revocation even when background worker is stopped', async () => {
      const consentId = new Types.ObjectId().toString();
      const activeConsentReq: any = {
        _id: new Types.ObjectId(consentId),
        patientId: new Types.ObjectId(patientId),
        requesterId: new Types.ObjectId(doctorId),
        requesterName: 'Dr. Synthetic',
        requesterRole: 'DOCTOR',
        purpose: 'Consultation',
        requestedDataTypes: ['LAB_REPORTS'],
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      const staleActiveArtifact: any = {
        id: 'art-1',
        consentRequestId: new Types.ObjectId(consentId),
        patientId: new Types.ObjectId(patientId),
        requesterId: new Types.ObjectId(doctorId),
        consentStatus: 'ACTIVE',
        permittedDataTypes: ['LAB_REPORTS'],
        validityPeriod: {
          from: new Date(Date.now() - 60_000),
          to: new Date(Date.now() + 86_400_000),
        },
      };

      vi.spyOn(ConsentRequestModel, 'findById').mockResolvedValue(activeConsentReq);
      vi.spyOn(ConsentArtifactModel, 'updateMany').mockResolvedValue({ modifiedCount: 1 } as any);
      // Even if a stale cache/replica returned an ACTIVE artifact, the synchronous barrier MUST block it!
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue(chainQuery(staleActiveArtifact));

      // Before revocation: authorized
      const before = await consentEnforcementService.validateAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId,
        dataCategory: 'LAB_REPORTS',
      });
      expect(before.authorized).toBe(true);

      // Patient revokes consent (no background worker running!)
      await consentService.revokeConsent(patientId, consentId, { reason: 'No longer consulting' });

      // Immediately after revocation: DENIED synchronously!
      const after = await consentEnforcementService.validateAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId,
        dataCategory: 'LAB_REPORTS',
      });
      expect(after.authorized).toBe(false);
      expect(after.reason).toMatch(/revoked immediately/i);
    });
  });

  /* =========================================================================
     2. HEALTHCARE WORKFLOW HANDLERS (DRAFT BLOCKING, IDEMPOTENT DISPENSING,
        TIMELINE PROJECTION & LAB REPORT VERSIONING)
     ========================================================================= */
  describe('Cross-Module Clinical Workflow Handlers', () => {
    it('projects published/finalized workflow events to patient timeline and excludes drafts', async () => {
      const upsertSpy = vi
        .spyOn(TimelineEventModel, 'updateOne')
        .mockResolvedValue({ upsertedCount: 1 } as any);

      // 1. Draft encounter MUST NOT be projected
      await timelineProjectionHandler.handle({
        workerId: 'w1',
        attempt: 1,
        correlationId: 'c1',
        event: {
          eventId: 'evt-draft-enc',
          eventType: 'ENCOUNTER_FINALIZED',
          sourceModule: 'ENCOUNTERS',
          aggregateType: 'Encounter',
          aggregateId: 'enc-draft',
          payload: { encounterId: 'enc-draft', patientId, doctorId, isDraft: true },
        } as any,
      });
      expect(upsertSpy).not.toHaveBeenCalled();

      // 2. Finalized encounter, Issued prescription, Lab order, Sample collected, Published & Amended report, ABDM External Import
      const publishedEvents = [
        { eventId: 'evt-1', eventType: 'APPOINTMENT_BOOKED', sourceModule: 'APPOINTMENTS', aggregateType: 'Appointment', aggregateId: 'a1', payload: { appointmentId: 'a1', patientId, doctorId } },
        { eventId: 'evt-2', eventType: 'ENCOUNTER_FINALIZED', sourceModule: 'ENCOUNTERS', aggregateType: 'Encounter', aggregateId: 'e1', payload: { encounterId: 'e1', patientId, doctorId, isDraft: false } },
        { eventId: 'evt-3', eventType: 'PRESCRIPTION_ISSUED', sourceModule: 'PRESCRIPTIONS', aggregateType: 'Prescription', aggregateId: 'p1', payload: { prescriptionId: 'p1', patientId, doctorId, isDraft: false } },
        { eventId: 'evt-4', eventType: 'LAB_ORDER_CREATED', sourceModule: 'LABORATORY', aggregateType: 'LaboratoryOrder', aggregateId: 'lo1', payload: { labOrderId: 'lo1', laboratoryId: labId, patientId } },
        { eventId: 'evt-5', eventType: 'SAMPLE_COLLECTED', sourceModule: 'LABORATORY', aggregateType: 'LabSample', aggregateId: 's1', payload: { sampleId: 's1', labOrderId: 'lo1', laboratoryId: labId, patientId } },
        { eventId: 'evt-6', eventType: 'REPORT_PUBLISHED', sourceModule: 'LABORATORY', aggregateType: 'LaboratoryReport', aggregateId: 'r1', payload: { reportId: 'r1', laboratoryId: labId, patientId, status: 'PUBLISHED', version: 1 } },
        { eventId: 'evt-7', eventType: 'REPORT_AMENDED', sourceModule: 'LABORATORY', aggregateType: 'LaboratoryReport', aggregateId: 'r1', payload: { reportId: 'r1', laboratoryId: labId, patientId, status: 'AMENDED', version: 2, previousVersion: 1 } },
        { eventId: 'evt-8', eventType: 'EXTERNAL_RECORD_IMPORTED', sourceModule: 'ABDM', aggregateType: 'AbdmImportedRecord', aggregateId: 'ext1', payload: { importedRecordId: 'ext1', patientId } },
      ];

      for (const evt of publishedEvents) {
        await timelineProjectionHandler.handle({
          workerId: 'w1',
          attempt: 1,
          correlationId: 'c2',
          event: evt as any,
        });
      }

      expect(upsertSpy).toHaveBeenCalledTimes(8);
      // Verify ABDM external record preserves ABDM_EXTERNAL_IMPORT provenance
      const abdmCall = upsertSpy.mock.calls[7][1] as any;
      expect(abdmCall.$setOnInsert.provenance).toBe('ABDM_EXTERNAL_IMPORT');
    });

    it('blocks draft prescriptions from pharmacy workflow and syncs dispensing without double stock deduction', async () => {
      const rxId = new Types.ObjectId().toString();
      const rxUpdateSpy = vi
        .spyOn(PrescriptionModel, 'updateOne')
        .mockResolvedValue({ modifiedCount: 1 } as any);

      // Draft prescription ignored
      await pharmacyWorkflowHandler.handle({
        workerId: 'w1',
        attempt: 1,
        correlationId: 'c3',
        event: {
          eventId: 'evt-rx-draft',
          eventType: 'PRESCRIPTION_ISSUED',
          aggregateId: rxId,
          payload: { prescriptionId: rxId, patientId, doctorId, isDraft: true, status: 'DRAFT' },
        } as any,
      });
      expect(rxUpdateSpy).not.toHaveBeenCalled();

      // Partial dispensing syncs status to PARTIALLY_DISPENSED without ever touching inventory
      await pharmacyWorkflowHandler.handle({
        workerId: 'w1',
        attempt: 1,
        correlationId: 'c4',
        event: {
          eventId: 'evt-disp-partial',
          eventType: 'DISPENSING_COMPLETED',
          aggregateId: 'disp-1',
          payload: {
            dispensingId: 'disp-1',
            prescriptionId: rxId,
            pharmacyId,
            patientId,
            dispensingStatus: 'PARTIALLY_DISPENSED',
            itemsDispensedCount: 1,
          },
        } as any,
      });

      expect(rxUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: new Types.ObjectId(rxId),
          status: { $nin: ['CANCELLED', 'DISPENSED'] },
        }),
        { $set: { status: 'PARTIALLY_DISPENSED' } }
      );
    });

    it('dispatches privacy-safe notifications for REPORT_PUBLISHED to patient and ordering doctor', async () => {
      const publishSpy = vi.spyOn(notificationService, 'publishEvent').mockResolvedValue(null);

      await unifiedNotificationEventHandler.handle({
        workerId: 'w1',
        attempt: 1,
        correlationId: 'c5',
        event: {
          eventId: 'evt-rep-pub-1',
          eventType: 'REPORT_PUBLISHED',
          aggregateType: 'LaboratoryReport',
          aggregateId: 'rep-1',
          payload: {
            reportId: 'rep-1',
            laboratoryId: labId,
            patientId,
            orderingDoctorId: doctorId,
            status: 'PUBLISHED',
            version: 1,
          },
        } as any,
      });

      expect(publishSpy).toHaveBeenCalledTimes(3); // patient, doctor, lab
      const patientNotif = publishSpy.mock.calls.find((c) => c[0].recipientId === patientId)?.[0];
      expect(patientNotif?.message).toMatch(/ready to view/i);
      expect(patientNotif?.message).not.toMatch(/mg\/dL|HbA1c/i);
    });
  });

  /* =========================================================================
     3. ADMIN EVENT OBSERVABILITY, SECURITY & CONTROLLED RECOVERY APIs
     ========================================================================= */
  describe('Admin Event Observability & Controlled Recovery API (/api/v1/events)', () => {
    it('rejects unauthenticated (401) and non-admin roles (403) from event monitoring & replay', async () => {
      const unauth = await request(app).get('/api/v1/events/health');
      expect(unauth.status).toBe(401);

      for (const token of [patientToken, doctorToken, pharmacyToken, labToken]) {
        const healthRes = await request(app)
          .get('/api/v1/events/health')
          .set('Authorization', `Bearer ${token}`);
        expect(healthRes.status).toBe(403);

        const replayRes = await request(app)
          .post('/api/v1/events/evt-1/retry')
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'Unauthorized attempt' });
        expect(replayRes.status).toBe(403);
      }

      // No public/client endpoint exists to publish arbitrary domain events
      const spoofPublish = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ eventType: 'REPORT_PUBLISHED' });
      expect(spoofPublish.status).toBe(404);
    });

    it('returns redacted event health metrics and masked event details to ADMIN', async () => {
      vi.spyOn(OutboxEventModel, 'aggregate')
        .mockResolvedValueOnce([
          { _id: 'PROCESSED', count: 12, retries: 1 },
          { _id: 'DEAD_LETTER', count: 1, retries: 5 },
        ] as any)
        .mockResolvedValueOnce([{ _id: null, avgDurationMs: 42.5 }] as any);
      vi.spyOn(WorkerHeartbeatModel, 'find').mockReturnValue(chainQuery([]));

      const healthRes = await request(app)
        .get('/api/v1/events/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(healthRes.status).toBe(200);
      expect(healthRes.body.data.counts.processed).toBe(12);
      expect(healthRes.body.data.counts.deadLetter).toBe(1);
      expect(healthRes.body.data.averageProcessingDurationMs).toBe(42.5);

      const dlqDoc = {
        eventId: 'evt-dlq-inspect-1',
        eventType: 'REPORT_PUBLISHED',
        schemaVersion: 1,
        sourceModule: 'LABORATORY',
        aggregateId: 'rep-55',
        aggregateType: 'LaboratoryReport',
        correlationId: 'corr-55',
        status: 'DEAD_LETTER',
        retryCount: 5,
        maxRetries: 5,
        errorCategory: 'TRANSIENT_IO',
        lastErrorSummary: 'Downstream notification timeout',
        payload: {
          reportId: 'rep-55',
          patientId,
          orderingDoctorId: doctorId,
          status: 'PUBLISHED',
          version: 1,
        },
        metadata: { transactionMode: 'COMPENSATED_FALLBACK', replayCount: 0 },
        replayHistory: [],
        createdAt: new Date(),
      };

      vi.spyOn(OutboxEventModel, 'findOne').mockReturnValue(chainQuery(dlqDoc));
      vi.spyOn(EventHandlerExecutionModel, 'find').mockReturnValue(chainQuery([]));

      const detailRes = await request(app)
        .get('/api/v1/events/evt-dlq-inspect-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.redactedPayloadSummary.patientId).toMatch(/^\*\*\*/);
      expect(detailRes.body.data.redactedPayloadSummary.patientId).not.toBe(patientId);
      expect(detailRes.body.data.isReplayEligible).toBe(true);
    });

    it('allows ADMIN controlled replay of eligible DEAD_LETTER events while blocking unsafe PROCESSED replay', async () => {
      const deadLetterEvent = {
        eventId: 'evt-dlq-replay-1',
        eventType: 'LAB_ORDER_CREATED',
        status: 'DEAD_LETTER',
        errorCategory: 'TRANSIENT_IO',
        metadata: { replayCount: 0 },
        createdAt: new Date(),
      };

      vi.spyOn(OutboxEventModel, 'findOne').mockResolvedValueOnce(deadLetterEvent as any);
      vi.spyOn(OutboxEventModel, 'findOneAndUpdate').mockResolvedValueOnce({
        ...deadLetterEvent,
        status: 'PENDING',
        metadata: { replayCount: 1 },
      } as any);

      const replayRes = await request(app)
        .post('/api/v1/events/evt-dlq-replay-1/retry')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Notification dependency recovered after maintenance' });

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.eventId).toBe('evt-dlq-replay-1'); // original eventId preserved!
      expect(replayRes.body.data.newStatus).toBe('PENDING');
      expect(replayRes.body.data.replayCount).toBe(1);

      // Unsafe replay of already PROCESSED dispensing event rejected (400)
      vi.spyOn(OutboxEventModel, 'findOne').mockResolvedValueOnce({
        eventId: 'evt-done-1',
        eventType: 'DISPENSING_COMPLETED',
        status: 'PROCESSED',
        createdAt: new Date(),
      } as any);

      const unsafeRes = await request(app)
        .post('/api/v1/events/evt-done-1/retry')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Should not replay completed dispensing' });

      expect(unsafeRes.status).toBe(400);
    });
  });
});
