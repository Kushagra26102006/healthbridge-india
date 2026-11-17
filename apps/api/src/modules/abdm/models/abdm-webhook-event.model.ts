/**
 * HealthBridge India — ABDM Inbound Webhook Event Persistence Model (Day 7 Task 01)
 *
 * Persists callback correlation metadata and enforces idempotency on (requestId, eventType).
 * Sensitive clinical payloads are stripped/redacted before persistence in foundation mode.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';
import type { AbdmWebhookProcessingStatus } from '@healthbridge/shared-types';

export interface IAbdmWebhookEventDocument extends Document {
  requestId: string;
  correlationId: string;
  eventType: string;
  eventHash: string;
  sourceTimestamp: Date;
  processingStatus: AbdmWebhookProcessingStatus;
  sanitizedMetadata?: Record<string, unknown>;
  errorMessage?: string;
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmWebhookEventSchema = new Schema<IAbdmWebhookEventDocument>(
  {
    requestId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    correlationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    eventHash: {
      type: String,
      required: true,
      trim: true,
    },
    sourceTimestamp: {
      type: Date,
      required: true,
    },
    processingStatus: {
      type: String,
      enum: ['RECEIVED', 'DUPLICATE_IGNORED', 'PROCESSED', 'FAILED'],
      default: 'RECEIVED',
      index: true,
    },
    sanitizedMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    receivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'abdm_webhook_events',
  }
);

// Compound unique index enforcing idempotent callback handling per ABDM requestId + eventType
AbdmWebhookEventSchema.index({ requestId: 1, eventType: 1 }, { unique: true });

export const AbdmWebhookEventModel: Model<IAbdmWebhookEventDocument> =
  (mongoose.models.AbdmWebhookEvent as Model<IAbdmWebhookEventDocument>) ||
  mongoose.model<IAbdmWebhookEventDocument>('AbdmWebhookEvent', AbdmWebhookEventSchema);

export default AbdmWebhookEventModel;
