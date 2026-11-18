/**
 * HealthBridge India — ABDM Linked Health Record (Care Context) Model (Day 7 Task 04)
 *
 * Strictly distinct from:
 *   - `AbhaLinkModel` (patient ABHA identity verification)
 *   - `AbdmConsentArtefactModel` (patient consent authorization for data exchange)
 *
 * Having an ABHA link NEVER automatically creates linked health records, and having a linked
 * health record NEVER grants consent to retrieve clinical records.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmEnvironment,
  AbdmHealthInfoType,
  AbdmRecordLinkStatus,
} from '@healthbridge/shared-types';

export interface IAbdmLinkedHealthRecordDocument extends Document {
  internalLinkRef: string;
  externalLinkRef?: string;
  externalTransactionRef?: string;
  discoveryId?: Types.ObjectId;
  patientId: Types.ObjectId;
  participantId: string;
  participantName?: string;
  careContextReference: string;
  careContextDisplay: string;
  hiTypes: AbdmHealthInfoType[];
  linkMode: 'USER_INITIATED' | 'HIP_INITIATED';
  status: AbdmRecordLinkStatus;
  unlinkScope?: 'LOCAL_HEALTHBRIDGE_UNLINK_ONLY' | 'EXTERNAL_CONFIRMED';
  unlinkedAt?: Date;
  unlinkedBy?: Types.ObjectId;
  unlinkReason?: string;
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  linkedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmLinkedHealthRecordSchema = new Schema<IAbdmLinkedHealthRecordDocument>(
  {
    internalLinkRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },
    externalLinkRef: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    externalTransactionRef: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    discoveryId: {
      type: Schema.Types.ObjectId,
      ref: 'AbdmDiscoveryRequest',
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participantId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    participantName: {
      type: String,
      trim: true,
    },
    careContextReference: {
      type: String,
      required: true,
      trim: true,
    },
    careContextDisplay: {
      type: String,
      required: true,
      trim: true,
    },
    hiTypes: {
      type: [String],
      required: true,
      default: [],
    },
    linkMode: {
      type: String,
      enum: ['USER_INITIATED', 'HIP_INITIATED'],
      required: true,
      default: 'USER_INITIATED',
    },
    status: {
      type: String,
      enum: [
        'LINKING_PENDING',
        'OTP_VERIFICATION_PENDING',
        'LINKED',
        'UNLINKED_LOCALLY',
        'FAILED',
        'EXPIRED',
      ],
      required: true,
      default: 'LINKING_PENDING',
      index: true,
    },
    unlinkScope: {
      type: String,
      enum: ['LOCAL_HEALTHBRIDGE_UNLINK_ONLY', 'EXTERNAL_CONFIRMED'],
    },
    unlinkedAt: { type: Date },
    unlinkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    unlinkReason: { type: String, trim: true },
    correlationId: {
      type: String,
      required: true,
      index: true,
    },
    environment: {
      type: String,
      enum: ['disabled', 'development', 'sandbox', 'production'],
      required: true,
      default: 'development',
      index: true,
    },
    isMocked: {
      type: Boolean,
      required: true,
      default: true,
    },
    linkedAt: { type: Date },
    failureReason: { type: String, trim: true },
  },
  {
    timestamps: true,
    collection: 'abdm_linked_health_records',
  }
);

// Prevent duplicate active care-context links for the same patient + participant + careContextReference
AbdmLinkedHealthRecordSchema.index(
  { patientId: 1, participantId: 1, careContextReference: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['LINKING_PENDING', 'OTP_VERIFICATION_PENDING', 'LINKED'] },
    },
  }
);
AbdmLinkedHealthRecordSchema.index({ patientId: 1, status: 1, createdAt: -1 });

export const AbdmLinkedHealthRecordModel: Model<IAbdmLinkedHealthRecordDocument> =
  mongoose.models.AbdmLinkedHealthRecord ||
  mongoose.model<IAbdmLinkedHealthRecordDocument>(
    'AbdmLinkedHealthRecord',
    AbdmLinkedHealthRecordSchema
  );
