/**
 * HealthBridge India — ABDM Transfer Acknowledgement Model (Day 7 Task 04)
 *
 * Persists inbound & outbound ABDM V3 transfer acknowledgements (`health-information/notify`,
 * `hip/on-request`, `hiu/on-request`) with compound idempotency indexing.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmExternalHiStatus,
  AbdmExternalSessionStatus,
  AbdmHieParticipantRole,
} from '@healthbridge/shared-types';

export interface IAbdmTransferAcknowledgementDocument extends Document {
  acknowledgementRef: string;
  transferId: Types.ObjectId;
  externalTransactionId: string;
  role: AbdmHieParticipantRole;
  ackType:
    | 'REQUEST_RECEIVED'
    | 'TRANSFER_INITIATED'
    | 'TRANSFER_ACCEPTED'
    | 'TRANSFER_COMPLETED'
    | 'TRANSFER_REJECTED'
    | 'TRANSFER_FAILED';
  externalSessionStatus: AbdmExternalSessionStatus;
  careContextStatuses: Array<{
    careContextReference: string;
    hiStatus: AbdmExternalHiStatus;
    description?: string;
  }>;
  failureCategory?: string;
  correlationId: string;
  acknowledgedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmTransferAcknowledgementSchema = new Schema<IAbdmTransferAcknowledgementDocument>(
  {
    acknowledgementRef: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    transferId: {
      type: Schema.Types.ObjectId,
      ref: 'AbdmHealthInformationTransfer',
      required: true,
      index: true,
    },
    externalTransactionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['HIP', 'HIU'],
      required: true,
      immutable: true,
    },
    ackType: {
      type: String,
      enum: [
        'REQUEST_RECEIVED',
        'TRANSFER_INITIATED',
        'TRANSFER_ACCEPTED',
        'TRANSFER_COMPLETED',
        'TRANSFER_REJECTED',
        'TRANSFER_FAILED',
      ],
      required: true,
    },
    externalSessionStatus: {
      type: String,
      enum: [
        'REQUESTED',
        'ACKNOWLEDGED',
        'TRANSFERRED',
        'PARTIAL_TRANSFERRED',
        'RECEIVED',
        'FAILED',
        'EXPIRED',
        'UNKNOWN',
      ],
      required: true,
    },
    careContextStatuses: [
      {
        _id: false,
        careContextReference: { type: String, required: true, trim: true },
        hiStatus: { type: String, enum: ['OK', 'DELIVERED', 'ERRORED'], required: true },
        description: { type: String, trim: true },
      },
    ],
    failureCategory: { type: String, trim: true },
    correlationId: {
      type: String,
      required: true,
      index: true,
    },
    acknowledgedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'abdm_transfer_acknowledgements',
  }
);

// Idempotency key: prevent duplicate processing of the same acknowledgement event
AbdmTransferAcknowledgementSchema.index(
  { acknowledgementRef: 1, externalTransactionId: 1, ackType: 1 },
  { unique: true }
);

export const AbdmTransferAcknowledgementModel: Model<IAbdmTransferAcknowledgementDocument> =
  mongoose.models.AbdmTransferAcknowledgement ||
  mongoose.model<IAbdmTransferAcknowledgementDocument>(
    'AbdmTransferAcknowledgement',
    AbdmTransferAcknowledgementSchema
  );
