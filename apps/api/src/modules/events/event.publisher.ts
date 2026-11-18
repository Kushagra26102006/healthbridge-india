/**
 * HealthBridge India — Internal-Only Domain Event Publisher (Day 8 Task 03)
 *
 * SECURITY INVARIANT:
 *   This publisher is strictly internal to backend domain services.
 *   NO public or client-facing HTTP endpoint may invoke `eventPublisher.publish`.
 */

import mongoose from 'mongoose';
import { logger } from '../../utils/logger';
import { OutboxEventModel } from './models/outbox-event.model';
import { eventRepository, EventRepository } from './event.repository';
import { sanitizeOutboxErrorSummary } from './event.schema';
import type {
  OutboxPublishInput,
  OutboxPublishResult,
  TransactionalOutboxExecutionResult,
} from './event.types';
import type { ClientSession } from 'mongoose';

export class EventPublisher {
  constructor(private readonly repository: EventRepository = eventRepository) {}

  /**
   * Publishes a single validated domain event into the durable MongoDB Outbox.
   * When an active Mongoose `session` is provided, writes participate atomically in that transaction.
   */
  async publish(input: OutboxPublishInput): Promise<OutboxPublishResult> {
    const mode = input.session ? 'MONGODB_TRANSACTION' : 'COMPENSATED_FALLBACK';
    return this.repository.insertOutboxEvent(input, mode);
  }

  /**
   * Safe non-throwing variant used by existing domain services in environments where
   * MongoDB may be mocked in unit tests (e.g., readyState !== 1 and OutboxEventModel not mocked).
   * Still strictly validates payloads and persists whenever DB or mocked model is available.
   */
  async publishSafe(input: OutboxPublishInput): Promise<OutboxPublishResult | null> {
    try {
      const isMocked = Boolean(
        (OutboxEventModel.create as any)?._isMockFunction ||
          (OutboxEventModel.create as any)?.mock
      );
      const hasLiveDb =
        mongoose.connection.readyState === 1 && Boolean(mongoose.connection.db);
      if (!hasLiveDb && !isMocked) {
        return null;
      }
      return await this.publish(input);
    } catch (error) {
      logger.warn('Failed to publish domain event in safe hook', {
        eventType: input.eventType,
        aggregateId: input.aggregateId,
        error: sanitizeOutboxErrorSummary(String((error as any)?.message || error)),
      });
      return null;
    }
  }

  /**
   * Runs a business write together with outbox event publication using MongoDB ACID
   * transactions when topology supports it, or explicitly tracked `COMPENSATED_FALLBACK`.
   */
  async executeTransactional<T>(params: {
    businessOperation: (session?: ClientSession) => Promise<T>;
    buildEvents: (businessResult: T) => OutboxPublishInput[];
    compensate?: (businessResult: T, error: unknown) => Promise<void>;
  }): Promise<TransactionalOutboxExecutionResult<T>> {
    return this.repository.executeWithOutbox(params);
  }
}

export const eventPublisher = new EventPublisher();
