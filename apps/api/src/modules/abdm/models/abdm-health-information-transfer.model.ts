/**
 * HealthBridge India — ABDM Health Information Transfer Model (Day 7 Task 04)
 *
 * Tracks outbound HIP data pushes and inbound HIU receptions with an append-only
 * `stateHistory` ledger, monotonic terminal-state protection, and idempotent transaction tracking.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmEncryptionProviderMode,
  AbdmEnvironment,
  AbdmExternalSessionStatus,
  AbdmHealthInfoType,
  AbdmHieParticipantRole,
  AbdmHieTransferState,
  AbdmTransferStateTransitionDto,
} from '@healthbridge/shared-types';

export interface IAbdmHealthInformationTransferDocument extends Document {
  internalTransferRef: string;
  externalTransactionId?: string;
  healthInformationRequestId: Types.ObjectId;
  role: AbdmHieParticipantRole;
  direction: 'OUTBOUND_HIP_PUSH' | 'INBOUND_HIU_RECEIVE';
  patientId: Types.ObjectId;
  participantId: string;
  consentArtefactId: string;
  externalConsentId: string;
  hiTypes: AbdmHealthInfoType[];
  status: AbdmHieTransferState;
  externalSessionStatus?: AbdmExternalSessionStatus;
  encryptionApplied: boolean;
  encryptionProviderMode: AbdmEncryptionProviderMode;
  totalEntries: number;
  validatedEntries: number;
  importedEntries: number;
  quarantinedEntries: number;
  retryCount: number;
  stateHistory: AbdmTransferStateTransitionDto[];
  lastEventTimestamp?: Date;
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  failureCode?: string;
  failureReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StateTransitionSchema = new Schema<AbdmTransferStateTransitionDto>(
  {
    fromState: { type: String },
    toState: { type: String, required: true },
    externalStatus: { type: String },
    source: {
      type: String,
      enum: ['LOCAL_WORKFLOW', 'ABDM_CALLBACK', 'HIP_DATA_PUSH', 'ACKNOWLEDGEMENT', 'REVIEWER'],
      required: true,
    },
    reason: { type: String, trim: true },
    correlationId: { type: String, trim: true },
    occurredAt: { type: String, required: true },
  },
  { _id: false }
);

const AbdmHealthInformationTransferSchema = new Schema<IAbdmHealthInformationTransferDocument>(
  {
    internalTransferRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },
    externalTransactionId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    healthInformationRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'AbdmHealthInformationRequest',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['HIP', 'HIU'],
      required: true,
      index: true,
      immutable: true,
    },
    direction: {
      type: String,
      enum: ['OUTBOUND_HIP_PUSH', 'INBOUND_HIU_RECEIVE'],
      required: true,
      immutable: true,
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
    consentArtefactId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    externalConsentId: {
      type: String,
      required: true,
      trim: true,
    },
    hiTypes: {
      type: [String],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'DISCOVERY_PENDING',
        'DISCOVERY_COMPLETED',
        'LINKING_PENDING',
        'CONSENT_PENDING',
        'AUTHORIZED',
        'REQUEST_SUBMITTED',
        'TRANSFER_PENDING',
        'TRANSFER_RECEIVED',
        'VALIDATION_PENDING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
        'REQUIRES_REVIEW',
      ],
      required: true,
      default: 'AUTHORIZED',
      index: true,
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
    },
    encryptionApplied: {
      type: Boolean,
      required: true,
      default: false,
    },
    encryptionProviderMode: {
      type: String,
      enum: [
        'NOT_CONFIGURED',
        'MOCK_LOCAL_X25519_NOT_BOUNCYCASTLE_WEIERSTRASS',
        'FIDELIUS_SHORT_WEIERSTRASS_CONFIGURED',
      ],
      required: true,
      default: 'NOT_CONFIGURED',
    },
    totalEntries: { type: Number, default: 0, min: 0 },
    validatedEntries: { type: Number, default: 0, min: 0 },
    importedEntries: { type: Number, default: 0, min: 0 },
    quarantinedEntries: { type: Number, default: 0, min: 0 },
    retryCount: { type: Number, default: 0, min: 0 },
    stateHistory: {
      type: [StateTransitionSchema],
      default: [],
    },
    lastEventTimestamp: { type: Date },
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
    failureCode: { type: String, trim: true },
    failureReason: { type: String, trim: true },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'abdm_health_information_transfers',
  }
);

AbdmHealthInformationTransferSchema.index({ patientId: 1, role: 1, status: 1, createdAt: -1 });
AbdmHealthInformationTransferSchema.index(
  { role: 1, externalTransactionId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalTransactionId: { $exists: true, $type: 'string' } },
  }
);

export const AbdmHealthInformationTransferModel: Model<IAbdmHealthInformationTransferDocument> =
  mongoose.models.AbdmHealthInformationTransfer ||
  mongoose.model<IAbdmHealthInformationTransferDocument>(
    'AbdmHealthInformationTransfer',
    AbdmHealthInformationTransferSchema
  );
