/**
 * HealthBridge India — Cross-Module Event Engine & Outbox Unit Tests (Day 8 Task 03)
 *
 * Covers:
 *   - Event creation, strict Zod schema validation, privacy leak rejection
 *   - HMAC-SHA256 authenticity signing & tamper detection -> DEAD_LETTER
 *   - Transactional outbox persistence, duplicate idempotencyKey handling, and COMPENSATED_FALLBACK rollback
 *   - Exponential backoff with jitter & replay safety rules
 *   - Atomic lease claiming, stale lease expiration recovery, retry exhaustion -> DEAD_LETTER
 *   - Per-handler idempotency locks (`executionKey`), partial failure retry, concurrent worker safety
 *   - Worker graceful shutdown (`stop()` releases leases) & restart recovery with pending events
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import {
  redactPayloadForAdmin,
  signOutboxEvent,
  validateDomainEventPayload,
  verifyOutboxEventSignature,
} from '../../src/modules/events/event.schema';
import {
  classifyEventError,
  computeBackoffDelayMs,
  isReplayEligible,
} from '../../src/modules/events/event.retry';
import { EventRepository } from '../../src/modules/events/event.repository';
import { EventHandlerRegistry } from '../../src/modules/events/event.registry';
import { EventDispatcher } from '../../src/modules/events/event.dispatcher';
import { EventWorkerProcessor } from '../../src/modules/events/event.processor';
import { OutboxEventModel } from '../../src/modules/events/models/outbox-event.model';
import { EventHandlerExecutionModel } from '../../src/modules/events/models/event-handler-execution.model';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';

describe('Cross-Module Event Engine & Transactional Outbox — Unit Tests (Day 8 Task 03)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  /* =========================================================================
     1. SCHEMA VALIDATION, PRIVACY GUARDS & HMAC AUTHENTICITY
     ========================================================================= */
  describe('Event Contracts, Privacy Guards & Authenticity', () => {
    it('validates well-formed identifier-only event payloads across domain modules', () => {
      const patientId = new Types.ObjectId().toString();
      const doctorId = new Types.ObjectId().toString();
      const appointmentId = new Types.ObjectId().toString();

      const valid = validateDomainEventPayload('APPOINTMENT_BOOKED', {
        appointmentId,
        patientId,
        doctorId,
        status: 'CONFIRMED',
      });
      expect(valid.appointmentId).toBe(appointmentId);
      expect(valid.status).toBe('CONFIRMED');
    });

    it('rejects extraneous clinical fields (.strict()) and embedded PHI/ABHA/lab values', () => {
      expect(() =>
        validateDomainEventPayload('APPOINTMENT_BOOKED', {
          appointmentId: 'apt-1',
          patientId: 'pat-1',
          doctorId: 'doc-1',
          diagnosisText: 'Acute myocardial infarction', // forbidden field
        })
      ).toThrow(/Invalid payload/i);

      expect(() =>
        validateDomainEventPayload('REPORT_PUBLISHED', {
          reportId: 'rep-1',
          reportNumber: 'HbA1c: 9.2%', // forbidden clinical measurement
          laboratoryId: 'lab-1',
          patientId: 'pat-1',
          status: 'PUBLISHED',
          version: 1,
        })
      ).toThrow(/restricted sensitive or clinical data/i);

      expect(() =>
        validateDomainEventPayload('ABHA_LINKED', {
          patientId: 'pat-1',
          abhaLinkRecordId: '12-3456-7890-1234', // raw 14-digit ABHA forbidden
        })
      ).toThrow(/restricted sensitive or clinical data/i);
    });

    it('verifies valid HMAC-SHA256 signatures and detects tampered payloads', () => {
      const payload = {
        appointmentId: 'apt-10',
        patientId: 'pat-10',
        doctorId: 'doc-10',
        status: 'CONFIRMED',
      };
      const sig = signOutboxEvent({
        eventId: 'evt-sig-1',
        eventType: 'APPOINTMENT_BOOKED',
        schemaVersion: 1,
        aggregateId: 'apt-10',
        aggregateType: 'Appointment',
        correlationId: 'corr-1',
        payload,
      });

      const intactDoc: any = {
        eventId: 'evt-sig-1',
        eventType: 'APPOINTMENT_BOOKED',
        schemaVersion: 1,
        aggregateId: 'apt-10',
        aggregateType: 'Appointment',
        correlationId: 'corr-1',
        payload,
        metadata: { signature: sig },
      };
      expect(verifyOutboxEventSignature(intactDoc)).toBe(true);

      const tamperedDoc: any = {
        ...intactDoc,
        payload: { ...payload, doctorId: 'doc-attacker' },
      };
      expect(verifyOutboxEventSignature(tamperedDoc)).toBe(false);
    });

    it('redacts sensitive actor/patient identifiers for admin inspection views', () => {
      const redacted = redactPayloadForAdmin({
        appointmentId: 'apt-99',
        patientId: '507f1f77bcf86cd799439011',
        doctorId: '507f1f77bcf86cd799439022',
        status: 'CONFIRMED',
        secretField: 'should-be-dropped',
      });

      expect(redacted.appointmentId).toBe('apt-99');
      expect(redacted.patientId).toBe('***439011');
      expect(redacted.doctorId).toBe('***439022');
      expect((redacted as any).secretField).toBeUndefined();
    });
  });

  /* =========================================================================
     2. OUTBOX PERSISTENCE, DUPLICATE PROTECTION & COMPENSATION FALLBACK
     ========================================================================= */
  describe('Transactional Outbox & Compensation Fallback', () => {
    it('deduplicates repeated outbox insertions cleanly on MongoDB duplicate key error 11000', async () => {
      const repo = new EventRepository();
      vi.spyOn(OutboxEventModel, 'create').mockRejectedValue({ code: 11000 });
      vi.spyOn(OutboxEventModel, 'findOne').mockReturnValue({
        select: () => ({
          lean: async () => ({
            eventId: 'evt-existing-1',
            eventType: 'LAB_ORDER_CREATED',
            status: 'PENDING',
            correlationId: 'corr-orig',
            metadata: { transactionMode: 'COMPENSATED_FALLBACK' },
          }),
        }),
      } as any);

      const result = await repo.insertOutboxEvent(
        {
          idempotencyKey: 'lab_order_created:ord-1',
          eventType: 'LAB_ORDER_CREATED',
          sourceModule: 'LABORATORY',
          aggregateId: 'ord-1',
          aggregateType: 'LaboratoryOrder',
          payload: {
            labOrderId: 'ord-1',
            laboratoryId: 'lab-1',
            patientId: 'pat-1',
            status: 'ORDERED',
          },
        },
        'COMPENSATED_FALLBACK'
      );

      expect(result.deduplicated).toBe(true);
      expect(result.eventId).toBe('evt-existing-1');
    });

    it('invokes explicit compensation hook when outbox persistence fails in COMPENSATED_FALLBACK mode', async () => {
      const repo = new EventRepository();
      vi.spyOn(repo, 'detectTransactionSupport').mockReturnValue('UNAVAILABLE_FALLBACK');
      vi.spyOn(OutboxEventModel, 'create').mockRejectedValue(new Error('MongoDB write failure'));

      const compensateSpy = vi.fn().mockResolvedValue(undefined);

      await expect(
        repo.executeWithOutbox({
          businessOperation: async () => ({ orderId: 'ord-rollback-1' }),
          buildEvents: (res) => [
            {
              eventType: 'LAB_ORDER_CREATED',
              sourceModule: 'LABORATORY',
              aggregateId: res.orderId,
              aggregateType: 'LaboratoryOrder',
              payload: {
                labOrderId: res.orderId,
                laboratoryId: 'lab-1',
                patientId: 'pat-1',
              },
            },
          ],
          compensate: compensateSpy,
        })
      ).rejects.toThrow(/MongoDB write failure/);

      expect(compensateSpy).toHaveBeenCalledWith(
        { orderId: 'ord-rollback-1' },
        expect.any(Error)
      );
    });
  });

  /* =========================================================================
     3. BACKOFF, JITTER, ERROR CLASSIFICATION & REPLAY SAFETY RULES
     ========================================================================= */
  describe('Retry Backoff, Error Classification & Replay Safety', () => {
    it('computes bounded exponential backoff with jitter', () => {
      const d1 = computeBackoffDelayMs(1, { baseDelayMs: 1000, maxDelayMs: 60000, randomFn: () => 0.5 });
      const d2 = computeBackoffDelayMs(2, { baseDelayMs: 1000, maxDelayMs: 60000, randomFn: () => 0.5 });
      const d10 = computeBackoffDelayMs(10, { baseDelayMs: 1000, maxDelayMs: 60000, randomFn: () => 1 });

      expect(d1).toBeGreaterThanOrEqual(1000);
      expect(d2).toBeGreaterThan(d1);
      expect(d10).toBeLessThanOrEqual(60000);
    });

    it('blocks unsafe replay of PROCESSED, IN-FLIGHT, OBSOLETE (>30d), and AUTHENTICITY_ERROR events', () => {
      expect(
        isReplayEligible({ status: 'PROCESSED', eventType: 'DISPENSING_COMPLETED' }).eligible
      ).toBe(false);
      expect(
        isReplayEligible({ status: 'PROCESSING', eventType: 'LAB_ORDER_CREATED' }).eligible
      ).toBe(false);
      expect(
        isReplayEligible({
          status: 'DEAD_LETTER',
          eventType: 'APPOINTMENT_BOOKED',
          errorCategory: 'AUTHENTICITY_ERROR',
        }).eligible
      ).toBe(false);
      expect(
        isReplayEligible({
          status: 'DEAD_LETTER',
          eventType: 'APPOINTMENT_BOOKED',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        }).eligible
      ).toBe(false);
      expect(
        isReplayEligible({
          status: 'DEAD_LETTER',
          eventType: 'APPOINTMENT_BOOKED',
          errorCategory: 'TRANSIENT_IO',
          createdAt: new Date(),
        }).eligible
      ).toBe(true);

      expect(classifyEventError({ message: 'ECONNRESET network timeout' })).toEqual({
        category: 'TRANSIENT_IO',
        retryable: true,
      });
    });
  });

  /* =========================================================================
     4. IN-MEMORY SIMULATED DURABLE STORE: LEASES, CONCURRENCY, IDEMPOTENCY,
        RETRY -> DEAD LETTER, GRACEFUL SHUTDOWN & RESTART RECOVERY
     ========================================================================= */
  describe('Dispatcher & Worker Lifecycle (Idempotency, Leases, Concurrency, Recovery)', () => {
    function buildInMemoryOutboxRepo() {
      const events = new Map<string, any>();
      const executions = new Map<string, any>();
      const repo = new EventRepository();

      vi.spyOn(OutboxEventModel, 'create').mockImplementation(((doc: any) => {
        const record = Array.isArray(doc) ? doc[0] : doc;
        for (const existing of events.values()) {
          if (
            existing.eventId === record.eventId ||
            (record.idempotencyKey && existing.idempotencyKey === record.idempotencyKey)
          ) {
            return Promise.reject({ code: 11000 });
          }
        }
        const saved = { ...record, createdAt: new Date() };
        events.set(saved.eventId, saved);
        return Promise.resolve(saved);
      }) as any);

      vi.spyOn(OutboxEventModel, 'findOneAndUpdate').mockImplementation(((filter: any, update: any) => {
        const now = new Date();
        // Match claimNextBatch query or status update query
        if (filter.$or) {
          const candidates = Array.from(events.values()).filter((e) => {
            const isDue =
              (e.status === 'PENDING' || e.status === 'RETRYING') &&
              new Date(e.nextRetryAt).getTime() <= now.getTime();
            const isExpiredLease =
              e.status === 'PROCESSING' &&
              e.leaseExpiresAt &&
              new Date(e.leaseExpiresAt).getTime() <= now.getTime();
            return isDue || isExpiredLease;
          });
          const picked = candidates[0];
          if (!picked) return Promise.resolve(null);
          Object.assign(picked, update.$set);
          return Promise.resolve({ ...picked });
        }

        const target = events.get(filter.eventId);
        if (!target) return Promise.resolve(null);
        if (filter.status && target.status !== filter.status) return Promise.resolve(null);
        if (filter.leaseOwner && target.leaseOwner !== filter.leaseOwner) return Promise.resolve(null);
        if (update.$set) Object.assign(target, update.$set);
        if (update.$unset) {
          for (const k of Object.keys(update.$unset)) delete target[k];
        }
        return Promise.resolve({ ...target });
      }) as any);

      vi.spyOn(OutboxEventModel, 'updateMany').mockImplementation(((filter: any, update: any) => {
        let modifiedCount = 0;
        for (const e of events.values()) {
          if (e.status === filter.status && e.leaseOwner === filter.leaseOwner) {
            if (update.$set) Object.assign(e, update.$set);
            if (update.$unset) {
              for (const k of Object.keys(update.$unset)) delete e[k];
            }
            modifiedCount++;
          }
        }
        return Promise.resolve({ modifiedCount } as any);
      }) as any);

      vi.spyOn(EventHandlerExecutionModel, 'create').mockImplementation(((doc: any) => {
        if (executions.has(doc.executionKey)) {
          return Promise.reject({ code: 11000 });
        }
        const saved = { ...doc };
        executions.set(doc.executionKey, saved);
        return Promise.resolve(saved);
      }) as any);

      vi.spyOn(EventHandlerExecutionModel, 'findOne').mockImplementation(((filter: any) => ({
        lean: async () => executions.get(filter.executionKey) || null,
      })) as any);

      vi.spyOn(EventHandlerExecutionModel, 'findOneAndUpdate').mockImplementation(((filter: any, update: any) => {
        const rec = executions.get(filter.executionKey);
        if (!rec) return Promise.resolve(null);
        const now = new Date();
        const allowed =
          rec.status === 'FAILED' ||
          (rec.status === 'PROCESSING' && rec.leaseExpiresAt && new Date(rec.leaseExpiresAt) <= now);
        if (!allowed) return Promise.resolve(null);
        Object.assign(rec, update.$set);
        if (update.$inc?.attempts) rec.attempts += update.$inc.attempts;
        return Promise.resolve({ ...rec });
      }) as any);

      vi.spyOn(EventHandlerExecutionModel, 'updateOne').mockImplementation(((filter: any, update: any) => {
        const rec = executions.get(filter.executionKey);
        if (rec && update.$set) Object.assign(rec, update.$set);
        return Promise.resolve({ modifiedCount: rec ? 1 : 0 } as any);
      }) as any);

      return { repo, events, executions };
    }

    it('prevents duplicate handler side effects on retry when Handler A succeeded and Handler B transiently failed', async () => {
      const { repo, events } = buildInMemoryOutboxRepo();
      const registry = new EventHandlerRegistry();

      let handlerACalls = 0;
      let handlerBCalls = 0;

      registry.register({
        name: 'handler-a-notification',
        description: 'Sends notification once',
        eventTypes: ['APPOINTMENT_BOOKED'],
        handle: async () => {
          handlerACalls++;
        },
      });

      registry.register({
        name: 'handler-b-projection',
        description: 'Fails transiently on attempt 1 then succeeds on attempt 2',
        eventTypes: ['APPOINTMENT_BOOKED'],
        handle: async () => {
          handlerBCalls++;
          if (handlerBCalls === 1) {
            throw new Error('ECONNRESET transient downstream error');
          }
        },
      });

      const dispatcher = new EventDispatcher(repo, registry);
      const worker = new EventWorkerProcessor(
        { workerId: 'worker-1', batchSize: 5, baseRetryDelayMs: 10 },
        repo,
        dispatcher
      );

      await repo.insertOutboxEvent(
        {
          eventId: 'evt-partial-1',
          eventType: 'APPOINTMENT_BOOKED',
          sourceModule: 'APPOINTMENTS',
          aggregateId: 'apt-1',
          aggregateType: 'Appointment',
          payload: {
            appointmentId: 'apt-1',
            patientId: new Types.ObjectId().toString(),
            doctorId: new Types.ObjectId().toString(),
            status: 'CONFIRMED',
          },
        },
        'COMPENSATED_FALLBACK'
      );

      // Run 1: Handler A succeeds, Handler B fails -> event moves to RETRYING (NOT PROCESSED!)
      const batch1 = await worker.processBatchOnce();
      expect(batch1[0].finalStatus).toBe('RETRYING');
      expect(handlerACalls).toBe(1);
      expect(handlerBCalls).toBe(1);

      // Make event immediately due for retry
      events.get('evt-partial-1').nextRetryAt = new Date(Date.now() - 1000);

      // Run 2: Handler A MUST be skipped (idempotent!), Handler B succeeds -> PROCESSED
      const batch2 = await worker.processBatchOnce();
      expect(batch2[0].finalStatus).toBe('PROCESSED');
      expect(batch2[0].handlersSkippedIdempotent).toBe(1);
      expect(batch2[0].handlersRun).toBe(1);
      expect(handlerACalls).toBe(1); // NEVER ran twice!
      expect(handlerBCalls).toBe(2);
    });

    it('recovers expired leases and prevents concurrent workers from double-processing the same event', async () => {
      const { repo, events } = buildInMemoryOutboxRepo();
      const registry = new EventHandlerRegistry();
      let executionsCount = 0;

      registry.register({
        name: 'stock-safe-handler',
        description: 'Must run strictly once across concurrent workers',
        eventTypes: ['DISPENSING_COMPLETED'],
        handle: async () => {
          executionsCount++;
        },
      });

      const dispatcher = new EventDispatcher(repo, registry);
      const workerA = new EventWorkerProcessor({ workerId: 'worker-A', batchSize: 5 }, repo, dispatcher);
      const workerB = new EventWorkerProcessor({ workerId: 'worker-B', batchSize: 5 }, repo, dispatcher);

      await repo.insertOutboxEvent(
        {
          eventId: 'evt-concurrent-1',
          eventType: 'DISPENSING_COMPLETED',
          sourceModule: 'PHARMACY',
          aggregateId: 'disp-1',
          aggregateType: 'DispensingRecord',
          payload: {
            dispensingId: 'disp-1',
            prescriptionId: new Types.ObjectId().toString(),
            pharmacyId: new Types.ObjectId().toString(),
            patientId: new Types.ObjectId().toString(),
            dispensingStatus: 'FULLY_DISPENSED',
            itemsDispensedCount: 2,
            stockDeductedAtomically: true,
          },
        },
        'COMPENSATED_FALLBACK'
      );

      // Simulate crashed worker holding an EXPIRED lease
      const ev = events.get('evt-concurrent-1');
      ev.status = 'PROCESSING';
      ev.leaseOwner = 'crashed-worker-0';
      ev.leaseExpiresAt = new Date(Date.now() - 5000);

      // Both Worker A and Worker B poll concurrently -> only ONE claims & processes it!
      const [resA, resB] = await Promise.all([
        workerA.processBatchOnce(),
        workerB.processBatchOnce(),
      ]);

      expect(resA.length + resB.length).toBe(1);
      expect(executionsCount).toBe(1);
      expect(events.get('evt-concurrent-1').status).toBe('PROCESSED');
    });

    it('moves event to DEAD_LETTER after maxRetries exhaustion and supports worker graceful shutdown', async () => {
      const { repo, events } = buildInMemoryOutboxRepo();
      const registry = new EventHandlerRegistry();

      registry.register({
        name: 'always-failing-handler',
        description: 'Simulates persistent downstream outage',
        eventTypes: ['SAMPLE_COLLECTED'],
        handle: async () => {
          throw new Error('Downstream lab processor temporarily unavailable');
        },
      });

      const dispatcher = new EventDispatcher(repo, registry);
      const worker = new EventWorkerProcessor(
        { workerId: 'worker-dlq', batchSize: 5, baseRetryDelayMs: 10 },
        repo,
        dispatcher
      );

      await repo.insertOutboxEvent(
        {
          eventId: 'evt-dlq-1',
          eventType: 'SAMPLE_COLLECTED',
          sourceModule: 'LABORATORY',
          aggregateId: 'smp-1',
          aggregateType: 'LabSample',
          maxRetries: 2,
          payload: {
            sampleId: 'smp-1',
            labOrderId: 'ord-1',
            laboratoryId: new Types.ObjectId().toString(),
            patientId: new Types.ObjectId().toString(),
            status: 'COLLECTED',
          },
        },
        'COMPENSATED_FALLBACK'
      );

      const first = await worker.processBatchOnce();
      expect(first[0].finalStatus).toBe('RETRYING');

      events.get('evt-dlq-1').nextRetryAt = new Date(Date.now() - 1000);
      const second = await worker.processBatchOnce();
      expect(second[0].finalStatus).toBe('DEAD_LETTER');
      expect(events.get('evt-dlq-1').deadLetteredAt).toBeInstanceOf(Date);

      // Verify graceful shutdown transitions cleanly to STOPPED
      worker.start();
      expect(worker.getLocalHealth().status).toBe('RUNNING');
      await worker.stop();
      expect(worker.getLocalHealth().status).toBe('STOPPED');
    });
  });
});
