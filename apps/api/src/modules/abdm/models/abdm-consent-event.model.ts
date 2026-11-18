/**
 * HealthBridge India — ABDM Consent Lifecycle & Callback Event Ledger (Day 7 Task 03)
 *
 * Append-only immutable event log supporting:
 * - Idempotent callback deduplication (`{ eventId, eventType }` unique index)
 * - Out-of-order / stale callback detection (`eventTimestamp`)
 * - Complete audit trail for patient consent history and admin failure telemetry
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { AbdmEnvironment, AbdmExternalConsentStatus } from '@healthbridge/shared-types';

export interface IAbdmConsentEventDocument extends Document {
  eventId: string;
  consentRequestId?: Types.ObjectId;
  externalRequestId?: string;
  externalConsentId?: string;
  patientId?: Types.ObjectId;
  eventType: string;
  direction: 'OUTBOUND' | 'INBOUND_CALLBACK' | 'INTERNAL_SYNC' | 'PATIENT_ACTION';
  previousInternalStatus?: string;
  nextInternalStatus?: string;
  externalStatus?: AbdmExternalConsentStatus;
  processingOutcome: 'PROCESSED' | 'DUPLICATE_IGNORED' | 'STALE_IGNORED' | 'REJECTED' | 'FAILED';
  correlationId?: string;
  externalTransactionRef?: string;
  reason?: string;
  sanitizedMetadata?: Record<string, unknown>;
  environment: AbdmEnvironment;
  eventTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmConsentEventSchema = new Schema<IAbdmConsentEventDocument>(
  {
    eventId: {
      type: String,
      required: true,
      trim: true,
    },
    consentRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'AbdmConsentRequest',
      index: true,
    },
    externalRequestId: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    externalConsentId: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['OUTBOUND', 'INBOUND_CALLBACK', 'INTERNAL_SYNC', 'PATIENT_ACTION'],
      required: true,
      index: true,
    },
    previousInternalStatus: {
      type: String,
    },
    nextInternalStatus: {
      type: String,
    },
    externalStatus: {
      type: String,
      enum: ['REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED', 'UNKNOWN'],
    },
    processingOutcome: {
      type: String,
      enum: ['PROCESSED', 'DUPLICATE_IGNORED', 'STALE_IGNORED', 'REJECTED', 'FAILED'],
      required: true,
      index: true,
    },
    correlationId: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    externalTransactionRef: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    sanitizedMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    environment: {
      type: String,
      enum: ['disabled', 'development', 'sandbox', 'production'],
      required: true,
      index: true,
    },
    eventTimestamp: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'abdmConsentEvents',
  }
);

// Unique idempotency constraint per eventId + eventType
AbdmConsentEventSchema.index({ eventId: 1, eventType: 1 }, { unique: true });
AbdmConsentEventSchema.index({ patientId: 1, createdAt: -1 });
AbdmConsentEventSchema.index({ direction: 1, processingOutcome: 1, createdAt: -1 });

export const AbdmConsentEventModel: Model<IAbdmConsentEventDocument> =
  (mongoose.models.AbdmConsentEvent as Model<IAbdmConsentEventDocument>) ||
  mongoose.model<IAbdmConsentEventDocument>('AbdmConsentEvent', AbdmConsentEventSchema);

export default AbdmConsentEventModel;
