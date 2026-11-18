/**
 * HealthBridge India — Transactional Outbox & Lease Repository (Day 8 Task 03)
 *
 * Implements:
 *   1. Honest MongoDB topology detection for multi-document ACID transactions (ReplicaSet / Mongos).
 *   2. Transactional outbox execution (`executeWithOutbox`):
 *        - Uses `mongoose.startSession()` + `session.withTransaction(...)` when supported.
 *        - Uses explicit `COMPENSATED_FALLBACK` with rollback hook + structured warning when standalone.
 *   3. Atomic worker event claiming (`claimNextBatch`) with lease duration & stale-lease recovery.
 *   4. Atomic per-handler idempotency claiming (`claimHandlerExecution`) using `EventHandlerExecutionModel`.
 */

import crypto from 'crypto';
import mongoose, { ClientSession } from 'mongoose';
import type {
  DomainEventStatus,
  EventErrorCategory,
  OutboxTransactionMode,
} from '@healthbridge/shared-types';
import { logger } from '../../utils/logger';
import {
  OutboxEventModel,
  type IOutboxEventDocument,
} from './models/outbox-event.model';
import {
  EventHandlerExecutionModel,
  type IEventHandlerExecutionDocument,
} from './models/event-handler-execution.model';
import { WorkerHeartbeatModel } from './models/worker-heartbeat.model';
import {
  sanitizeOutboxErrorSummary,
  signOutboxEvent,
  validateDomainEventPayload,
} from './event.schema';
import { DEFAULT_MAX_RETRIES } from './event.retry';
import type {
  OutboxPublishInput,
  OutboxPublishResult,
  TransactionalOutboxExecutionResult,
} from './event.types';

let fallbackWarningLogged = false;

export class EventRepository {
  /**
   * Detects whether the active MongoDB connection supports multi-document ACID transactions.
   * Only ReplicaSet or Sharded (mongos) topologies support transactions in MongoDB.
   */
  detectTransactionSupport(): 'SUPPORTED' | 'UNAVAILABLE_FALLBACK' | 'UNKNOWN' {
    if (mongoose.connection.readyState !== 1) {
      return 'UNKNOWN';
    }
    try {
      const client = (mongoose.connection as any).getClient?.();
      const topologyType: string | undefined = client?.topology?.description?.type;
      if (
        topologyType === 'ReplicaSetWithPrimary' ||
        topologyType === 'ReplicaSetNoPrimary' ||
        topologyType === 'Sharded'
      ) {
        return 'SUPPORTED';
      }
      if (topologyType === 'Single' || topologyType === 'Standalone') {
        return 'UNAVAILABLE_FALLBACK';
      }
      return 'UNKNOWN';
    } catch {
      return 'UNKNOWN';
    }
  }

  /**
   * Builds a validated, signed outbox document ready for MongoDB persistence.
   */
  prepareOutboxDocument(
    input: OutboxPublishInput,
    transactionMode: OutboxTransactionMode
  ): Record<string, unknown> {
    const validatedPayload = validateDomainEventPayload(input.eventType, input.payload);
    const eventId = input.eventId || `evt-${crypto.randomUUID()}`;
    const correlationId = input.correlationId || `corr-${crypto.randomUUID()}`;
    const schemaVersion = input.schemaVersion ?? 1;

    const signature = signOutboxEvent({
      eventId,
      eventType: input.eventType,
      schemaVersion,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      correlationId,
      payload: validatedPayload,
    });

    return {
      eventId,
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      eventType: input.eventType,
      schemaVersion,
      sourceModule: input.sourceModule,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      correlationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      payload: validatedPayload,
      metadata: {
        transactionMode,
        signature,
        replayCount: 0,
        ...(input.safeTags ? { safeTags: input.safeTags } : {}),
      },
      status: 'PENDING' as DomainEventStatus,
      retryCount: 0,
      maxRetries: input.maxRetries ?? DEFAULT_MAX_RETRIES,
      nextRetryAt: new Date(),
      replayHistory: [],
    };
  }

  /**
   * Persists a single outbox event idempotently (handles duplicate `idempotencyKey` or `eventId`
   * MongoDB error 11000 cleanly without creating duplicate events).
   */
  async insertOutboxEvent(
    input: OutboxPublishInput,
    transactionMode: OutboxTransactionMode
  ): Promise<OutboxPublishResult> {
    const docData = this.prepareOutboxDocument(input, transactionMode);

    try {
      if (input.session) {
        await OutboxEventModel.create([docData], { session: input.session });
      } else {
        await OutboxEventModel.create(docData);
      }

      return {
        eventId: String(docData.eventId),
        eventType: input.eventType,
        status: 'PENDING',
        deduplicated: false,
        transactionMode,
        correlationId: String(docData.correlationId),
      };
    } catch (error: any) {
      // Duplicate key error (idempotent event insertion protection)
      if (error?.code === 11000 && (input.idempotencyKey || input.eventId)) {
        const existing = await OutboxEventModel.findOne(
          input.idempotencyKey
            ? { idempotencyKey: input.idempotencyKey }
            : { eventId: input.eventId }
        )
          .select('eventId eventType status correlationId metadata')
          .lean();

        return {
          eventId: existing?.eventId || String(docData.eventId),
          eventType: input.eventType,
          status: (existing?.status as DomainEventStatus) || 'PENDING',
          deduplicated: true,
          transactionMode:
            (existing?.metadata?.transactionMode as OutboxTransactionMode) || transactionMode,
          correlationId: existing?.correlationId || String(docData.correlationId),
        };
      }
      throw error;
    }
  }

  /**
   * Executes a business write + one or more outbox event writes atomically when MongoDB
   * multi-document transactions are supported.
   *
   * If MongoDB transactions are unavailable (standalone local dev / test mock), NEVER silently
   * pretends atomicity: tags events with `COMPENSATED_FALLBACK`, logs an explicit warning once,
   * and invokes the caller's optional `compensate` rollback handler if outbox persistence fails.
   */
  async executeWithOutbox<T>(params: {
    businessOperation: (session?: ClientSession) => Promise<T>;
    buildEvents: (businessResult: T) => OutboxPublishInput[];
    compensate?: (businessResult: T, error: unknown) => Promise<void>;
  }): Promise<TransactionalOutboxExecutionResult<T>> {
    const topologySupport = this.detectTransactionSupport();

    if (topologySupport === 'SUPPORTED') {
      const session = await mongoose.startSession();
      try {
        let businessResult!: T;
        let publishedEvents: OutboxPublishResult[] = [];

        await session.withTransaction(async () => {
          businessResult = await params.businessOperation(session);
          const eventsToWrite = params.buildEvents(businessResult);
          publishedEvents = [];
          for (const evt of eventsToWrite) {
            const res = await this.insertOutboxEvent(
              { ...evt, session },
              'MONGODB_TRANSACTION'
            );
            publishedEvents.push(res);
          }
        });

        return {
          result: businessResult,
          events: publishedEvents,
          transactionMode: 'MONGODB_TRANSACTION',
        };
      } finally {
        await session.endSession();
      }
    }

    // Explicit, honest fallback for standalone / non-replica deployments
    if (!fallbackWarningLogged) {
      fallbackWarningLogged = true;
      logger.warn(
        'MongoDB multi-document transactions unavailable on current topology; using COMPENSATED_FALLBACK outbox mode.',
        { topologySupport }
      );
    }

    const businessResult = await params.businessOperation(undefined);
    const eventsToWrite = params.buildEvents(businessResult);
    const publishedEvents: OutboxPublishResult[] = [];

    try {
      for (const evt of eventsToWrite) {
        const res = await this.insertOutboxEvent(evt, 'COMPENSATED_FALLBACK');
        publishedEvents.push(res);
      }
    } catch (outboxError) {
      if (params.compensate) {
        await params.compensate(businessResult, outboxError).catch((compErr) => {
          logger.error('Outbox compensation hook failed after outbox persistence failure', {
            error: sanitizeOutboxErrorSummary(String(compErr)),
          });
        });
      }
      throw outboxError;
    }

    return {
      result: businessResult,
      events: publishedEvents,
      transactionMode: 'COMPENSATED_FALLBACK',
    };
  }

  /**
   * Atomically claims up to `batchSize` eligible outbox events (either due PENDING/RETRYING
   * or expired-lease PROCESSING events) for `workerId`.
   *
   * Uses atomic `findOneAndUpdate` so concurrent workers NEVER claim the same event.
   */
  async claimNextBatch(
    workerId: string,
    batchSize: number,
    leaseDurationMs: number
  ): Promise<IOutboxEventDocument[]> {
    const claimed: IOutboxEventDocument[] = [];
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + leaseDurationMs);

    for (let i = 0; i < batchSize; i++) {
      const doc = await OutboxEventModel.findOneAndUpdate(
        {
          $or: [
            {
              status: { $in: ['PENDING', 'RETRYING'] },
              nextRetryAt: { $lte: now },
            },
            {
              status: 'PROCESSING',
              leaseExpiresAt: { $lte: now },
            },
          ],
        },
        {
          $set: {
            status: 'PROCESSING',
            leaseOwner: workerId,
            leaseExpiresAt,
            processingStartedAt: now,
          },
        },
        {
          sort: { nextRetryAt: 1, createdAt: 1 },
          new: true,
        }
      );

      if (!doc) {
        break;
      }
      claimed.push(doc);
    }

    return claimed;
  }

  /**
   * Atomically marks an event as PROCESSED only if still leased by `workerId`.
   */
  async markProcessed(
    eventId: string,
    workerId: string,
    durationMs: number
  ): Promise<IOutboxEventDocument | null> {
    return OutboxEventModel.findOneAndUpdate(
      { eventId, status: 'PROCESSING', leaseOwner: workerId },
      {
        $set: {
          status: 'PROCESSED',
          processedAt: new Date(),
          processingDurationMs: Math.max(0, Math.round(durationMs)),
        },
        $unset: {
          leaseOwner: 1,
          leaseExpiresAt: 1,
        },
      },
      { new: true }
    );
  }

  /**
   * Transitions a failed event to RETRYING (with exponential backoff) or DEAD_LETTER (if exhausted/permanent).
   */
  async markRetryOrDeadLetter(params: {
    eventId: string;
    workerId: string;
    nextStatus: 'RETRYING' | 'DEAD_LETTER' | 'FAILED';
    retryCount: number;
    nextRetryAt?: Date;
    durationMs: number;
    errorCategory: EventErrorCategory;
    errorSummary: string;
  }): Promise<IOutboxEventDocument | null> {
    const setFields: Record<string, unknown> = {
      status: params.nextStatus,
      retryCount: params.retryCount,
      processingDurationMs: Math.max(0, Math.round(params.durationMs)),
      errorCategory: params.errorCategory,
      lastErrorSummary: sanitizeOutboxErrorSummary(params.errorSummary),
    };

    if (params.nextRetryAt) {
      setFields.nextRetryAt = params.nextRetryAt;
    }
    if (params.nextStatus === 'DEAD_LETTER') {
      setFields.deadLetteredAt = new Date();
    }

    return OutboxEventModel.findOneAndUpdate(
      { eventId: params.eventId, status: 'PROCESSING', leaseOwner: params.workerId },
      {
        $set: setFields,
        $unset: {
          leaseOwner: 1,
          leaseExpiresAt: 1,
        },
      },
      { new: true }
    );
  }

  /**
   * Releases any active leases held by a shutting-down worker back to PENDING/RETRYING
   * so another worker can pick them up immediately without waiting for lease timeout.
   */
  async releaseWorkerLeases(workerId: string): Promise<number> {
    const res = await OutboxEventModel.updateMany(
      { status: 'PROCESSING', leaseOwner: workerId },
      {
        $set: {
          status: 'RETRYING',
          nextRetryAt: new Date(),
        },
        $unset: {
          leaseOwner: 1,
          leaseExpiresAt: 1,
        },
      }
    );
    return res.modifiedCount || 0;
  }

  /**
   * Atomic per-handler idempotency claim using unique index on `executionKey = "${eventId}:${handlerName}"`.
   *
   * Returns:
   *   - `'CLAIMED'` if this worker acquired execution ownership for this handler
   *   - `'ALREADY_COMPLETED'` if this handler already succeeded for this event (SKIP!)
   *   - `'IN_PROGRESS'` if another active worker currently holds a valid lease on this handler
   */
  async claimHandlerExecution(params: {
    eventId: string;
    handlerName: string;
    eventType: IOutboxEventDocument['eventType'];
    workerId: string;
    leaseDurationMs: number;
  }): Promise<'CLAIMED' | 'ALREADY_COMPLETED' | 'IN_PROGRESS'> {
    const executionKey = `${params.eventId}:${params.handlerName}`;
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + params.leaseDurationMs);

    try {
      await EventHandlerExecutionModel.create({
        executionKey,
        eventId: params.eventId,
        handlerName: params.handlerName,
        eventType: params.eventType,
        status: 'PROCESSING',
        attempts: 1,
        leaseOwner: params.workerId,
        leaseExpiresAt,
      });
      return 'CLAIMED';
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }

      // Already exists: check if completed or retryable/expired lease
      const existing = await EventHandlerExecutionModel.findOne({ executionKey }).lean();
      if (!existing) {
        return 'IN_PROGRESS';
      }
      if (existing.status === 'COMPLETED') {
        return 'ALREADY_COMPLETED';
      }

      // Attempt atomic takeover ONLY if FAILED or PROCESSING with expired lease
      const updated = await EventHandlerExecutionModel.findOneAndUpdate(
        {
          executionKey,
          $or: [
            { status: 'FAILED' },
            { status: 'PROCESSING', leaseExpiresAt: { $lte: now } },
          ],
        },
        {
          $set: {
            status: 'PROCESSING',
            leaseOwner: params.workerId,
            leaseExpiresAt,
          },
          $inc: { attempts: 1 },
        },
        { new: true }
      );

      return updated ? 'CLAIMED' : 'IN_PROGRESS';
    }
  }

  async markHandlerCompleted(
    eventId: string,
    handlerName: string,
    durationMs: number
  ): Promise<void> {
    const executionKey = `${eventId}:${handlerName}`;
    await EventHandlerExecutionModel.updateOne(
      { executionKey },
      {
        $set: {
          status: 'COMPLETED',
          completedAt: new Date(),
          durationMs: Math.max(0, Math.round(durationMs)),
        },
        $unset: { leaseOwner: 1, leaseExpiresAt: 1 },
      }
    );
  }

  async markHandlerFailed(
    eventId: string,
    handlerName: string,
    errorSummary: string
  ): Promise<void> {
    const executionKey = `${eventId}:${handlerName}`;
    await EventHandlerExecutionModel.updateOne(
      { executionKey },
      {
        $set: {
          status: 'FAILED',
          lastErrorSummary: sanitizeOutboxErrorSummary(errorSummary),
        },
        $unset: { leaseOwner: 1, leaseExpiresAt: 1 },
      }
    );
  }

  async getHandlerExecutions(eventId: string): Promise<IEventHandlerExecutionDocument[]> {
    return (await EventHandlerExecutionModel.find({ eventId })
      .sort({ createdAt: 1 })
      .lean()) as unknown as IEventHandlerExecutionDocument[];
  }

  async upsertWorkerHeartbeat(params: {
    workerId: string;
    status: 'RUNNING' | 'STOPPING' | 'STOPPED';
    hostname: string;
    pid: number;
    startedAt: Date;
    processedCount: number;
    failedCount: number;
    activeLeaseCount: number;
    pollIntervalMs: number;
    batchSize: number;
  }): Promise<void> {
    await WorkerHeartbeatModel.updateOne(
      { workerId: params.workerId },
      {
        $set: {
          status: params.status,
          hostname: params.hostname,
          pid: params.pid,
          startedAt: params.startedAt,
          lastHeartbeatAt: new Date(),
          processedCount: params.processedCount,
          failedCount: params.failedCount,
          activeLeaseCount: params.activeLeaseCount,
          pollIntervalMs: params.pollIntervalMs,
          batchSize: params.batchSize,
        },
      },
      { upsert: true }
    );
  }
}

export const eventRepository = new EventRepository();
