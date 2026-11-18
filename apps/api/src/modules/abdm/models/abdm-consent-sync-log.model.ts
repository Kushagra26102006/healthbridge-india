/**
 * HealthBridge India — ABDM Consent Synchronization Log Model (Day 7 Task 03)
 *
 * Records scheduled and on-demand expiry detection and external status synchronization
 * runs, including failure diagnostics (sanitized, zero patient PII).
 */

import mongoose, { Document, Model, Schema } from 'mongoose';
import type { AbdmEnvironment } from '@healthbridge/shared-types';

export interface IAbdmConsentSyncLogDocument extends Document {
  syncType: 'SCHEDULED_SWEEP' | 'MANUAL_ADMIN_SYNC' | 'REQUEST_STATUS_POLL';
  environment: AbdmEnvironment;
  isMocked: boolean;
  status: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED';
  triggeredBy?: string;
  expiredRequestsMarked: number;
  expiredArtefactsMarked: number;
  nearingExpiryNotified: number;
  externalStatusChecked: number;
  externalStatusUpdated: number;
  failuresCount: number;
  failureMessages: string[];
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmConsentSyncLogSchema = new Schema<IAbdmConsentSyncLogDocument>(
  {
    syncType: {
      type: String,
      enum: ['SCHEDULED_SWEEP', 'MANUAL_ADMIN_SYNC', 'REQUEST_STATUS_POLL'],
      required: true,
      index: true,
    },
    environment: {
      type: String,
      enum: ['disabled', 'development', 'sandbox', 'production'],
      required: true,
      index: true,
    },
    isMocked: {
      type: Boolean,
      default: false,
      required: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PARTIAL_FAILURE', 'FAILED'],
      required: true,
      index: true,
    },
    triggeredBy: {
      type: String,
      trim: true,
    },
    expiredRequestsMarked: { type: Number, default: 0 },
    expiredArtefactsMarked: { type: Number, default: 0 },
    nearingExpiryNotified: { type: Number, default: 0 },
    externalStatusChecked: { type: Number, default: 0 },
    externalStatusUpdated: { type: Number, default: 0 },
    failuresCount: { type: Number, default: 0 },
    failureMessages: {
      type: [String],
      default: [],
    },
    startedAt: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'abdmConsentSyncLogs',
  }
);

AbdmConsentSyncLogSchema.index({ status: 1, completedAt: -1 });

export const AbdmConsentSyncLogModel: Model<IAbdmConsentSyncLogDocument> =
  (mongoose.models.AbdmConsentSyncLog as Model<IAbdmConsentSyncLogDocument>) ||
  mongoose.model<IAbdmConsentSyncLogDocument>('AbdmConsentSyncLog', AbdmConsentSyncLogSchema);

export default AbdmConsentSyncLogModel;
