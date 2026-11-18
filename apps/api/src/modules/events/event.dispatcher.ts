/**
 * HealthBridge India — Idempotent Domain Event Dispatcher (Day 8 Task 03)
 *
 * Guarantees:
 *   1. Verifies HMAC-SHA256 authenticity signature & strict Zod payload schema before execution.
 *   2. Executes every registered handler under an atomic `(eventId, handlerName)` idempotency claim.
 *   3. NEVER marks an event PROCESSED until ALL registered handlers succeed.
 *   4. Schedules exponential backoff with jitter on retryable failures, or dead-letters on
 *      permanent errors / exhausted retry limits.
 */

import { logger } from '../../utils/logger';
import { AuditLogModel } from '../security/models/audit-log.model';
import type { IOutboxEventDocument } from './models/outbox-event.model';
import { eventRepository, EventRepository } from './event.repository';
import { eventHandlerRegistry, EventHandlerRegistry } from './event.registry';
import {
  sanitizeOutboxErrorSummary,
  validateDomainEventPayload,
  verifyOutboxEventSignature,
} from './event.schema';
import { classifyEventError, computeNextRetryDate } from './event.retry';
import type { EventDispatchOutcome } from './event.types';

const DEFAULT_HANDLER_LEASE_MS = 30_000;

export class EventDispatcher {
  constructor(
    private readonly repository: EventRepository = eventRepository,
    private readonly registry: EventHandlerRegistry = eventHandlerRegistry
  ) {}

  async dispatchEvent(
    event: IOutboxEventDocument,
    workerId: string,
    options?: {
      handlerLeaseMs?: number;
      baseRetryDelayMs?: number;
      maxRetryDelayMs?: number;
    }
  ): Promise<EventDispatchOutcome> {
    const startedAt = Date.now();
    const handlerLeaseMs = options?.handlerLeaseMs ?? DEFAULT_HANDLER_LEASE_MS;

    try {
      // 1. Authenticity check (tampered or forged outbox records are rejected immediately)
      if (!verifyOutboxEventSignature(event)) {
        const authErr = Object.assign(
          new Error('Outbox event HMAC signature mismatch — possible tampering detected.'),
          { code: 'AUTHENTICITY_ERROR', nonRetryable: true }
        );
        throw authErr;
      }

      // 2. Re-validate payload against strict Zod contract
      validateDomainEventPayload(
        event.eventType,
        (event.payload || {}) as Record<string, unknown>
      );

      // 3. Execute all registered handlers with per-handler atomic idempotency guards
      const handlers = this.registry.getHandlersFor(event.eventType);
      let handlersRun = 0;
      let handlersSkippedIdempotent = 0;

      for (const handler of handlers) {
        const claim = await this.repository.claimHandlerExecution({
          eventId: event.eventId,
          handlerName: handler.name,
          eventType: event.eventType,
          workerId,
          leaseDurationMs: handlerLeaseMs,
        });

        if (claim === 'ALREADY_COMPLETED') {
          handlersSkippedIdempotent++;
          continue;
        }

        if (claim === 'IN_PROGRESS') {
          throw Object.assign(
            new Error(`Handler '${handler.name}' is currently leased by another worker.`),
            { code: 'TRANSIENT_IO' }
          );
        }

        const handlerStart = Date.now();
        try {
          await handler.handle({
            event,
            workerId,
            attempt: (event.retryCount || 0) + 1,
            correlationId: event.correlationId,
          });
          await this.repository.markHandlerCompleted(
            event.eventId,
            handler.name,
            Date.now() - handlerStart
          );
          handlersRun++;
        } catch (handlerError: any) {
          await this.repository.markHandlerFailed(
            event.eventId,
            handler.name,
            String(handlerError?.message || handlerError)
          );
          throw handlerError;
        }
      }

      // 4. Mark PROCESSED ONLY after every handler has completed successfully
      const durationMs = Date.now() - startedAt;
      await this.repository.markProcessed(event.eventId, workerId, durationMs);

      return {
        eventId: event.eventId,
        eventType: event.eventType,
        finalStatus: 'PROCESSED',
        handlersRun,
        handlersSkippedIdempotent,
        durationMs,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startedAt;
      const classification = classifyEventError(error);
      const nextRetryCount = (event.retryCount || 0) + 1;
      const maxRetries = event.maxRetries || 5;
      const errorSummary = sanitizeOutboxErrorSummary(String(error?.message || error));

      const shouldDeadLetter = !classification.retryable || nextRetryCount >= maxRetries;
      const nextStatus = shouldDeadLetter ? 'DEAD_LETTER' : 'RETRYING';
      const nextRetryAt = shouldDeadLetter
        ? undefined
        : computeNextRetryDate(nextRetryCount, Date.now(), {
            baseDelayMs: options?.baseRetryDelayMs,
            maxDelayMs: options?.maxRetryDelayMs,
          });

      await this.repository.markRetryOrDeadLetter({
        eventId: event.eventId,
        workerId,
        nextStatus,
        retryCount: nextRetryCount,
        nextRetryAt,
        durationMs,
        errorCategory: classification.category,
        errorSummary,
      });

      if (shouldDeadLetter) {
        logger.error('Domain event moved to DEAD_LETTER queue', {
          eventId: event.eventId,
          eventType: event.eventType,
          correlationId: event.correlationId,
          retryCount: nextRetryCount,
          errorCategory: classification.category,
        });

        await AuditLogModel.create({
          actorRole: 'SYSTEM',
          action: 'DOMAIN_EVENT_DEAD_LETTERED',
          resourceType: 'OUTBOX_EVENT',
          resourceId: event.eventId,
          requestId: event.correlationId,
          timestamp: new Date(),
          outcome: 'FAILURE',
          metadata: {
            eventType: event.eventType,
            sourceModule: event.sourceModule,
            retryCount: nextRetryCount,
            errorCategory: classification.category,
          },
        }).catch(() => undefined);
      } else {
        logger.warn('Domain event failed; scheduled for retry with exponential backoff', {
          eventId: event.eventId,
          eventType: event.eventType,
          correlationId: event.correlationId,
          retryCount: nextRetryCount,
          nextRetryAt: nextRetryAt?.toISOString(),
          errorCategory: classification.category,
        });
      }

      return {
        eventId: event.eventId,
        eventType: event.eventType,
        finalStatus: nextStatus,
        handlersRun: 0,
        handlersSkippedIdempotent: 0,
        durationMs,
        errorCategory: classification.category,
        errorSummary,
      };
    }
  }
}

export const eventDispatcher = new EventDispatcher();
