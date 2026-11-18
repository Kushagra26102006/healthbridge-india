/**
 * HealthBridge India — ABDM Health Information Discovery Request Model (Day 7 Task 04)
 *
 * Tracks care-context discovery sessions separately from ABHA linking and Consent artefacts.
 * Stores metadata & discovered care-context references only (never plaintext clinical records).
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmDiscoveredCareContextDto,
  AbdmDiscoveryStatus,
  AbdmEnvironment,
  AbdmHealthInfoType,
  AbdmHieParticipantRole,
} from '@healthbridge/shared-types';

export interface IAbdmDiscoveryRequestDocument extends Document {
  internalDiscoveryRef: string;
  externalTransactionRef?: string;
  idempotencyKey?: string;
  patientId: Types.ObjectId;
  initiatingActorId: Types.ObjectId;
  initiatingActorRole: string;
  participantId: string;
  participantName?: string;
  participantRole: AbdmHieParticipantRole;
  requestedCategories: AbdmHealthInfoType[];
  status: AbdmDiscoveryStatus;
  discoveredCareContexts: AbdmDiscoveredCareContextDto[];
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  failureReason?: string;
  lastCallbackAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DiscoveredCareContextSchema = new Schema<AbdmDiscoveredCareContextDto>(
  {
    careContextReference: { type: String, required: true, trim: true },
    display: { type: String, required: true, trim: true },
    hiTypes: [{ type: String, required: true }],
    recordDate: { type: String },
    sourceCategory: { type: String, trim: true },
    alreadyLinked: { type: Boolean, default: false },
  },
  { _id: false }
);

const AbdmDiscoveryRequestSchema = new Schema<IAbdmDiscoveryRequestDocument>(
  {
    internalDiscoveryRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },
    externalTransactionRef: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    initiatingActorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    initiatingActorRole: {
      type: String,
      required: true,
      trim: true,
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
    participantRole: {
      type: String,
      enum: ['HIP', 'HIU'],
      required: true,
      default: 'HIU',
    },
    requestedCategories: {
      type: [String],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ['DISCOVERY_PENDING', 'DISCOVERY_COMPLETED', 'NO_MATCH_FOUND', 'FAILED', 'EXPIRED'],
      required: true,
      default: 'DISCOVERY_PENDING',
      index: true,
    },
    discoveredCareContexts: {
      type: [DiscoveredCareContextSchema],
      default: [],
    },
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
    failureReason: {
      type: String,
      trim: true,
    },
    lastCallbackAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'abdm_discovery_requests',
  }
);

AbdmDiscoveryRequestSchema.index({ patientId: 1, participantId: 1, status: 1, createdAt: -1 });
AbdmDiscoveryRequestSchema.index(
  { patientId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true, $type: 'string' } } }
);

export const AbdmDiscoveryRequestModel: Model<IAbdmDiscoveryRequestDocument> =
  mongoose.models.AbdmDiscoveryRequest ||
  mongoose.model<IAbdmDiscoveryRequestDocument>('AbdmDiscoveryRequest', AbdmDiscoveryRequestSchema);
