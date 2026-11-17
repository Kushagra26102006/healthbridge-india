/**
 * HealthBridge India — ABHA Transaction & Audit History Model (Day 7 Task 02)
 *
 * Persists non-sensitive ABHA verification/creation/linking workflow transactions,
 * correlation IDs, expiry windows, and failure categories for patient history and
 * admin aggregate metrics.
 *
 * NEVER stores OTP values, Aadhaar numbers, X-Tokens, or client secrets.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmEnvironment,
  AbhaFailureCategory,
  AbhaVerificationMethod,
  AbhaVerificationStatus,
  AbhaWorkflowType,
} from '@healthbridge/shared-types';

export interface IAbhaVerifiedSnapshot {
  abhaNumberEncrypted?: string;
  abhaNumberHash?: string;
  abhaNumberMasked?: string;
  abhaAddress?: string;
  abhaStatus?: string;
  fullName?: string;
  gender?: string;
  yearOfBirth?: string;
  stateName?: string;
  districtName?: string;
  demographicReviewRequired?: boolean;
  demographicMismatchReasons?: string[];
}

export interface IAbhaTransactionDocument extends Document {
  internalTransactionId: string;
  externalTransactionId?: string;
  patientId: Types.ObjectId;
  initiatedBy: Types.ObjectId;
  workflowType: AbhaWorkflowType;
  verificationMethod?: AbhaVerificationMethod;
  verificationStatus: AbhaVerificationStatus;
  correlationId: string;
  maskedIdentifier?: string;
  failureCategory?: AbhaFailureCategory;
  failureMessage?: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  patientConsentConfirmed: boolean;
  expiresAt?: Date;
  completedAt?: Date;
  verifiedSnapshot?: IAbhaVerifiedSnapshot;
  linkedToAbhaLinkId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AbhaVerifiedSnapshotSchema = new Schema<IAbhaVerifiedSnapshot>(
  {
    abhaNumberEncrypted: { type: String, select: false },
    abhaNumberHash: { type: String },
    abhaNumberMasked: { type: String },
    abhaAddress: { type: String, lowercase: true, trim: true },
    abhaStatus: { type: String },
    fullName: { type: String },
    gender: { type: String },
    yearOfBirth: { type: String },
    stateName: { type: String },
    districtName: { type: String },
    demographicReviewRequired: { type: Boolean, default: false },
    demographicMismatchReasons: { type: [String], default: [] },
  },
  { _id: false }
);

const AbhaTransactionSchema = new Schema<IAbhaTransactionDocument>(
  {
    internalTransactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    externalTransactionId: {
      type: String,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workflowType: {
      type: String,
      enum: [
        'ABHA_CREATION_AADHAAR_OTP',
        'ABHA_VERIFY_NUMBER_OTP',
        'ABHA_VERIFY_ADDRESS_OTP',
        'ABHA_ADDRESS_LOOKUP',
        'ABHA_ADDRESS_SUGGESTIONS',
        'ABHA_ADDRESS_CREATE',
        'ABHA_PROFILE_FETCH',
        'ABHA_LINK',
        'ABHA_UNLINK',
      ],
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
      required: true,
      index: true,
    },
    correlationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    maskedIdentifier: {
      type: String,
      trim: true,
    },
    failureCategory: {
      type: String,
      enum: [
        'INVALID_INPUT',
        'INVALID_OTP',
        'SESSION_EXPIRED',
        'RATE_LIMITED',
        'SERVICE_UNAVAILABLE',
        'DUPLICATE_IDENTITY',
        'UNAUTHORIZED',
        'UNSUPPORTED_OPERATION',
        'EXTERNAL_API_ERROR',
      ],
    },
    failureMessage: {
      type: String,
      trim: true,
      maxlength: 500,
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
    patientConsentConfirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    expiresAt: { type: Date },
    completedAt: { type: Date },
    verifiedSnapshot: { type: AbhaVerifiedSnapshotSchema },
    linkedToAbhaLinkId: {
      type: Schema.Types.ObjectId,
      ref: 'AbhaLink',
    },
  },
  {
    timestamps: true,
    collection: 'abhaTransactions',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

AbhaTransactionSchema.index({ patientId: 1, createdAt: -1 });
AbhaTransactionSchema.index({ verificationStatus: 1, createdAt: -1 });

export const AbhaTransactionModel: Model<IAbhaTransactionDocument> =
  (mongoose.models.AbhaTransaction as Model<IAbhaTransactionDocument>) ||
  mongoose.model<IAbhaTransactionDocument>('AbhaTransaction', AbhaTransactionSchema);

export default AbhaTransactionModel;
