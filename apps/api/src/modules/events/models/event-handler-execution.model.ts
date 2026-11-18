/**
 * HealthBridge India — Per-Handler Event Execution Idempotency Model (Day 8 Task 03)
 *
 * Guarantees at-most-once side-effect execution per `(eventId, handlerName)` pair using
 * a unique compound key `executionKey = "${eventId}:${handlerName}"`.
 *
 * Even if an event is retried (because Handler B failed after Handler A succeeded) or
 * redelivered across concurrent workers, Handler A is never executed twice.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';
import type { DomainEventType } from '@healthbridge/shared-types';
import { DOMAIN_EVENT_TYPES } from '@healthbridge/validation';

export type HandlerExecutionStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IEventHandlerExecutionDocument extends Document {
  executionKey: string;
  eventId: string;
  handlerName: string;
  eventType: DomainEventType;
  status: HandlerExecutionStatus;
  attempts: number;
  leaseOwner?: string;
  leaseExpiresAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  lastErrorSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventHandlerExecutionSchema = new Schema<IEventHandlerExecutionDocument>(
  {
    executionKey: { type: String, required: true },
    eventId: { type: String, required: true },
    handlerName: { type: String, required: true },
    eventType: { type: String, enum: DOMAIN_EVENT_TYPES, required: true },
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
      required: true,
      default: 'PROCESSING',
    },
    attempts: { type: Number, required: true, default: 1, min: 1 },
    leaseOwner: { type: String, required: false },
    leaseExpiresAt: { type: Date, required: false },
    completedAt: { type: Date, required: false },
    durationMs: { type: Number, required: false, min: 0 },
    lastErrorSummary: { type: String, required: false, maxlength: 400 },
  },
  {
    timestamps: true,
    collection: 'event_handler_executions',
  }
);

EventHandlerExecutionSchema.index({ executionKey: 1 }, { unique: true });
EventHandlerExecutionSchema.index({ eventId: 1, status: 1 });
EventHandlerExecutionSchema.index({ status: 1, leaseExpiresAt: 1 });

export const EventHandlerExecutionModel: Model<IEventHandlerExecutionDocument> =
  (mongoose.models.EventHandlerExecution as Model<IEventHandlerExecutionDocument>) ||
  mongoose.model<IEventHandlerExecutionDocument>(
    'EventHandlerExecution',
    EventHandlerExecutionSchema
  );
