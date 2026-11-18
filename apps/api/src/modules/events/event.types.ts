/**
 * HealthBridge India — Internal Event Engine Types (Day 8 Task 03)
 */

import type { ClientSession } from 'mongoose';
import type {
  DomainEventSourceModule,
  DomainEventStatus,
  DomainEventType,
  EventErrorCategory,
  OutboxTransactionMode,
} from '@healthbridge/shared-types';
import type { IOutboxEventDocument } from './models/outbox-event.model';

export interface OutboxPublishInput {
  eventId?: string;
  idempotencyKey?: string;
  eventType: DomainEventType;
  schemaVersion?: number;
  sourceModule: DomainEventSourceModule;
  aggregateId: string;
  aggregateType: string;
  correlationId?: string;
  actorId?: string;
  actorRole?: string;
  payload: Record<string, unknown>;
  maxRetries?: number;
  safeTags?: Record<string, string | number | boolean>;
  session?: ClientSession;
}

export interface OutboxPublishResult {
  eventId: string;
  eventType: DomainEventType;
  status: DomainEventStatus;
  deduplicated: boolean;
  transactionMode: OutboxTransactionMode;
  correlationId: string;
}

export interface EventExecutionContext {
  event: IOutboxEventDocument;
  workerId: string;
  attempt: number;
  correlationId: string;
}

export interface EventHandlerDefinition {
  name: string;
  eventTypes: DomainEventType[];
  description: string;
  handle: (ctx: EventExecutionContext) => Promise<void>;
}

export interface TransactionalOutboxExecutionResult<T> {
  result: T;
  events: OutboxPublishResult[];
  transactionMode: OutboxTransactionMode;
}

export interface EventDispatchOutcome {
  eventId: string;
  eventType: DomainEventType;
  finalStatus: DomainEventStatus;
  handlersRun: number;
  handlersSkippedIdempotent: number;
  durationMs: number;
  errorCategory?: EventErrorCategory;
  errorSummary?: string;
}
