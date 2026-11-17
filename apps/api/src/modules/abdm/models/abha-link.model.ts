/**
 * HealthBridge India — ABHA Patient Identity Link Model (Day 7 Task 02)
 *
 * Authoritative persistence layer mapping internal HealthBridge patients (`User._id`)
 * to external verified ABDM ABHA identities while strictly separating:
 *   1. Internal patient primary key (`patientId`) vs external ABHA Number & ABHA Address.
 *   2. Identity linking (`consentScope: 'IDENTITY_LINKING_ONLY'`) vs clinical data exchange consent.
 *
 * Security Invariants:
 *   - ABHA Number is stored AES-256-GCM encrypted (`select: false`) + HMAC-SHA256 blind index.
 *   - OTP values, Aadhaar numbers, X-Tokens, and client secrets are NEVER stored here.
 *   - Partial unique indexes prevent duplicate active links per patient and across patients.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmEnvironment,
  AbhaLinkRecordStatus,
  AbhaVerificationMethod,
  AbhaVerificationStatus,
} from '@healthbridge/shared-types';

export interface IAbhaAddressHistoryEntry {
  address: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'UNLINKED';
  verifiedAt?: Date;
  updatedAt: Date;
}

export interface IAbhaUnlinkMetadata {
  unlinkedAt: Date;
  unlinkedBy: Types.ObjectId;
  reason: string;
  scope: 'LOCAL_HEALTHBRIDGE_UNLINK';
}

export interface IAbhaLinkDocument extends Document {
  patientId: Types.ObjectId;
  patientProfileId?: Types.ObjectId;
  abhaNumberEncrypted?: string;
  abhaNumberHash?: string;
  abhaNumberMasked?: string;
  abhaAddress?: string;
  abhaAddressHistory: IAbhaAddressHistoryEntry[];
  verificationStatus: AbhaVerificationStatus;
  verificationMethod?: AbhaVerificationMethod;
  linkStatus: AbhaLinkRecordStatus;
  externalTransactionId?: string;
  internalTransactionId?: string;
  linkedAt?: Date;
  verifiedAt?: Date;
  lastVerificationAt?: Date;
  consentConfirmedAt?: Date;
  consentScope: 'IDENTITY_LINKING_ONLY';
  environment: AbdmEnvironment;
  isMocked: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  unlinkMetadata?: IAbhaUnlinkMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const AbhaAddressHistorySchema = new Schema<IAbhaAddressHistoryEntry>(
  {
    address: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUPERSEDED', 'UNLINKED'],
      required: true,
    },
    verifiedAt: { type: Date },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const AbhaUnlinkMetadataSchema = new Schema<IAbhaUnlinkMetadata>(
  {
    unlinkedAt: { type: Date, required: true },
    unlinkedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    scope: {
      type: String,
      enum: ['LOCAL_HEALTHBRIDGE_UNLINK'],
      default: 'LOCAL_HEALTHBRIDGE_UNLINK',
      required: true,
    },
  },
  { _id: false }
);

const AbhaLinkSchema = new Schema<IAbhaLinkDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Internal patient reference is required'],
      index: true,
    },
    patientProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'PatientProfile',
      index: true,
    },
    abhaNumberEncrypted: {
      type: String,
      select: false, // Never returned unless explicitly requested for authorized server-side FHIR mapping
    },
    abhaNumberHash: {
      type: String,
      trim: true,
    },
    abhaNumberMasked: {
      type: String,
      trim: true,
    },
    abhaAddress: {
      type: String,
      trim: true,
      lowercase: true,
    },
    abhaAddressHistory: {
      type: [AbhaAddressHistorySchema],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: [
        'NOT_LINKED',
        'PENDING_VERIFICATION',
        'VERIFICATION_IN_PROGRESS',
        'VERIFIED',
        'VERIFICATION_FAILED',
        'REVOKED_OR_UNLINKED',
      ],
      default: 'NOT_LINKED',
      required: true,
      index: true,
    },
    verificationMethod: {
      type: String,
      enum: [
        'AADHAAR_OTP',
        'ABHA_NUMBER_MOBILE_OTP',
        'ABHA_NUMBER_AADHAAR_OTP',
        'ABHA_ADDRESS_MOBILE_OTP',
        'ABHA_ADDRESS_AADHAAR_OTP',
        'DEMOGRAPHIC_REVIEW',
      ],
    },
    linkStatus: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'UNLINKED', 'REVOKED', 'FAILED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    externalTransactionId: {
      type: String,
      trim: true,
    },
    internalTransactionId: {
      type: String,
      trim: true,
      index: true,
    },
    linkedAt: { type: Date },
    verifiedAt: { type: Date },
    lastVerificationAt: { type: Date },
    consentConfirmedAt: { type: Date },
    consentScope: {
      type: String,
      enum: ['IDENTITY_LINKING_ONLY'],
      default: 'IDENTITY_LINKING_ONLY',
      required: true,
    },
    environment: {
      type: String,
      enum: ['disabled', 'development', 'sandbox', 'production'],
      required: true,
      default: 'development',
    },
    isMocked: {
      type: Boolean,
      required: true,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    unlinkMetadata: {
      type: AbhaUnlinkMetadataSchema,
    },
  },
  {
    timestamps: true,
    collection: 'abhaLinks',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        delete ret.abhaNumberEncrypted;
        delete ret.abhaNumberHash;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// At most ONE active ABHA link per internal HealthBridge patient
AbhaLinkSchema.index(
  { patientId: 1 },
  {
    unique: true,
    partialFilterExpression: { linkStatus: 'ACTIVE' },
    name: 'uniq_active_abha_link_per_patient',
  }
);

// Prevent linking the same ABHA Number to multiple patients simultaneously
AbhaLinkSchema.index(
  { abhaNumberHash: 1 },
  {
    unique: true,
    partialFilterExpression: {
      linkStatus: 'ACTIVE',
      abhaNumberHash: { $exists: true, $type: 'string' },
    },
    name: 'uniq_active_abha_number_hash',
  }
);

// Prevent linking the same ABHA Address to multiple patients simultaneously
AbhaLinkSchema.index(
  { abhaAddress: 1 },
  {
    unique: true,
    partialFilterExpression: {
      linkStatus: 'ACTIVE',
      abhaAddress: { $exists: true, $type: 'string' },
    },
    name: 'uniq_active_abha_address',
  }
);

AbhaLinkSchema.index({ patientId: 1, createdAt: -1 });

export const AbhaLinkModel: Model<IAbhaLinkDocument> =
  (mongoose.models.AbhaLink as Model<IAbhaLinkDocument>) ||
  mongoose.model<IAbhaLinkDocument>('AbhaLink', AbhaLinkSchema);

export default AbhaLinkModel;
