/**
 * HealthBridge India — Transactional Outbox Event Model (Day 8 Task 03)
 *
 * Persists domain events alongside domain state mutations (using MongoDB multi-document
 * transactions when replica set / mongos topology supports them, or explicitly tagged
 * `COMPENSATED_FALLBACK` with rollback hooks otherwise).
 *
 * Indexes optimize:
 *   - Unique eventId & idempotencyKey duplicate protection
 *   - Worker polling by status + nextRetryAt + createdAt
 *   - Stale lease recovery by status + leaseExpiresAt
 *   - Aggregate trace & admin observability filtering
 */

import mongoose, { Document, Model, Schema } from 'mongoose';
import type {
  DomainEventSourceModule,
  DomainEventStatus,
  DomainEventType,
  EventErrorCategory,
  OutboxTransactionMode,
} from '@healthbridge/shared-types';
import {
  DOMAIN_EVENT_SOURCE_MODULES,
  DOMAIN_EVENT_STATUSES,
  DOMAIN_EVENT_TYPES,
} from '@healthbridge/validation';

export interface IReplayHistoryEntry {
  replayedAt: Date;
  actorId: string;
  reason: string;
  previousStatus: DomainEventStatus;
}

export interface IOutboxEventDocument extends Document {
  eventId: string;
  idempotencyKey?: string;
  eventType: DomainEventType;
  schemaVersion: number;
  sourceModule: DomainEventSourceModule;
  aggregateId: string;
  aggregateType: string;
  correlationId: string;
  actorId?: string;
  actorRole?: string;
  payload: Record<string, unknown>;
  metadata: {
    transactionMode: OutboxTransactionMode;
    signature: string;
    replayCount: number;
    lastReplayBy?: string;
    lastReplayReason?: string;
    safeTags?: Record<string, string | number | boolean>;
  };
  status: DomainEventStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
  leaseOwner?: string;
  leaseExpiresAt?: Date;
  processingStartedAt?: Date;
  processedAt?: Date;
  processingDurationMs?: number;
  errorCategory?: EventErrorCategory;
  lastErrorSummary?: string;
  deadLetteredAt?: Date;
  replayHistory: IReplayHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplayHistoryEntrySchema = new Schema<IReplayHistoryEntry>(
  {
    replayedAt: { type: Date, required: true, default: Date.now },
    actorId: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 240 },
    previousStatus: { type: String, enum: DOMAIN_EVENT_STATUSES, required: true },
  },
  { _id: false }
);

const OutboxEventSchema = new Schema<IOutboxEventDocument>(
  {
    eventId: { type: String, required: true },
    idempotencyKey: { type: String, required: false },
    eventType: { type: String, enum: DOMAIN_EVENT_TYPES, required: true },
    schemaVersion: { type: Number, required: true, default: 1, min: 1 },
    sourceModule: { type: String, enum: DOMAIN_EVENT_SOURCE_MODULES, required: true },
    aggregateId: { type: String, required: true },
    aggregateType: { type: String, required: true },
    correlationId: { type: String, required: true },
    actorId: { type: String, required: false },
    actorRole: { type: String, required: false },
    payload: { type: Schema.Types.Mixed, required: true },
    metadata: {
      transactionMode: {
        type: String,
        enum: ['MONGODB_TRANSACTION', 'COMPENSATED_FALLBACK'],
        required: true,
        default: 'COMPENSATED_FALLBACK',
      },
      signature: { type: String, required: true },
      replayCount: { type: Number, required: true, default: 0, min: 0 },
      lastReplayBy: { type: String, required: false },
      lastReplayReason: { type: String, required: false },
      safeTags: { type: Schema.Types.Mixed, required: false },
    },
    status: {
      type: String,
      enum: DOMAIN_EVENT_STATUSES,
      required: true,
      default: 'PENDING',
    },
    retryCount: { type: Number, required: true, default: 0, min: 0 },
    maxRetries: { type: Number, required: true, default: 5, min: 1, max: 20 },
    nextRetryAt: { type: Date, required: true, default: Date.now },
    leaseOwner: { type: String, required: false },
    leaseExpiresAt: { type: Date, required: false },
    processingStartedAt: { type: Date, required: false },
    processedAt: { type: Date, required: false },
    processingDurationMs: { type: Number, required: false, min: 0 },
    errorCategory: {
      type: String,
      enum: [
        'TRANSIENT_IO',
        'VALIDATION_ERROR',
        'AUTHORIZATION_ERROR',
        'HANDLER_ERROR',
        'AUTHENTICITY_ERROR',
        'PERMANENT_ERROR',
      ],
      required: false,
    },
    lastErrorSummary: { type: String, required: false, maxlength: 400 },
    deadLetteredAt: { type: Date, required: false },
    replayHistory: { type: [ReplayHistoryEntrySchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'outbox_events',
  }
);

// Uniqueness & Idempotency Indexes
OutboxEventSchema.index({ eventId: 1 }, { unique: true });
OutboxEventSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

// Worker polling & lease recovery compound indexes
OutboxEventSchema.index({ status: 1, nextRetryAt: 1, createdAt: 1 });
OutboxEventSchema.index({ status: 1, leaseExpiresAt: 1 });

// Operational inspection & correlation indexes
OutboxEventSchema.index({ aggregateType: 1, aggregateId: 1, createdAt: -1 });
OutboxEventSchema.index({ eventType: 1, status: 1, createdAt: -1 });
OutboxEventSchema.index({ correlationId: 1 });

export const OutboxEventModel: Model<IOutboxEventDocument> =
  (mongoose.models.OutboxEvent as Model<IOutboxEventDocument>) ||
  mongoose.model<IOutboxEventDocument>('OutboxEvent', OutboxEventSchema);
