/**
 * HealthBridge India — ABDM Consent Request Model (Day 7 Task 03)
 *
 * Strictly separate from internal `ConsentRequestModel` (`apps/api/src/modules/consent/`).
 * Tracks external ABDM HIE-CM V3 consent requests, maintaining independent internal
 * workflow statuses vs official external ABDM HIE-CM statuses.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmConsentAccessMode,
  AbdmConsentFrequencyUnit,
  AbdmConsentRequestInternalStatus,
  AbdmEnvironment,
  AbdmExternalConsentStatus,
  AbdmHealthInfoType,
  AbdmPurposeCode,
} from '@healthbridge/shared-types';

export interface IAbdmConsentRequestDocument extends Document {
  internalReference: string;
  externalRequestId?: string;
  patientId: Types.ObjectId;
  patientAbhaAddress: string;
  requestingUserId: Types.ObjectId;
  requestingUserRole: string;
  requestingParticipantId: string;
  requestingParticipantRole: 'HIU' | 'HIP';
  requestingOrganizationName: string;
  requesterName: string;
  purposeCode: AbdmPurposeCode;
  purposeText: string;
  hiTypes: AbdmHealthInfoType[];
  accessMode: AbdmConsentAccessMode;
  dateRange: {
    from: Date;
    to: Date;
  };
  dataEraseAt: Date;
  frequency: {
    unit: AbdmConsentFrequencyUnit;
    value: number;
    repeats: number;
  };
  internalStatus: AbdmConsentRequestInternalStatus;
  externalStatus: AbdmExternalConsentStatus;
  externalTransactionRef?: string;
  correlationId: string;
  artefactIds: string[];
  environment: AbdmEnvironment;
  isMocked: boolean;
  expiresAt?: Date;
  lastSyncedAt?: Date;
  lastExternalEventAt?: Date;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  statusHistory: Array<{
    fromInternalStatus?: string;
    toInternalStatus: string;
    externalStatus?: string;
    reason?: string;
    changedAt: Date;
    correlationId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmConsentRequestSchema = new Schema<IAbdmConsentRequestDocument>(
  {
    internalReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    externalRequestId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientAbhaAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    requestingUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestingUserRole: {
      type: String,
      required: true,
      trim: true,
    },
    requestingParticipantId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    requestingParticipantRole: {
      type: String,
      enum: ['HIU', 'HIP'],
      default: 'HIU',
      required: true,
    },
    requestingOrganizationName: {
      type: String,
      required: true,
      trim: true,
    },
    requesterName: {
      type: String,
      required: true,
      trim: true,
    },
    purposeCode: {
      type: String,
      enum: ['CAREMGT', 'BTG', 'PUBHLTH', 'HPAYMT', 'DSRCH', 'PATRQT'],
      required: true,
      index: true,
    },
    purposeText: {
      type: String,
      required: true,
      trim: true,
    },
    hiTypes: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one official ABDM HI-type is required',
      },
    },
    accessMode: {
      type: String,
      enum: ['VIEW', 'STORE', 'QUERY', 'STREAM'],
      default: 'VIEW',
      required: true,
    },
    dateRange: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    dataEraseAt: {
      type: Date,
      required: true,
      index: true,
    },
    frequency: {
      unit: {
        type: String,
        enum: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'],
        default: 'HOUR',
      },
      value: { type: Number, default: 1, min: 1 },
      repeats: { type: Number, default: 0, min: 0 },
    },
    internalStatus: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_SUBMISSION',
        'SUBMITTED',
        'AWAITING_PATIENT_ACTION',
        'APPROVED',
        'REJECTED',
        'EXPIRED',
        'REVOKED',
        'FAILED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    externalStatus: {
      type: String,
      enum: ['REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED', 'UNKNOWN'],
      default: 'UNKNOWN',
      required: true,
      index: true,
    },
    externalTransactionRef: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    correlationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    artefactIds: {
      type: [String],
      default: [],
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
    expiresAt: {
      type: Date,
      index: true,
    },
    lastSyncedAt: {
      type: Date,
    },
    lastExternalEventAt: {
      type: Date,
    },
    lastErrorCode: {
      type: String,
      trim: true,
    },
    lastErrorMessage: {
      type: String,
      trim: true,
    },
    statusHistory: {
      type: [
        {
          fromInternalStatus: { type: String },
          toInternalStatus: { type: String, required: true },
          externalStatus: { type: String },
          reason: { type: String },
          changedAt: { type: Date, required: true, default: Date.now },
          correlationId: { type: String },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'abdmConsentRequests',
  }
);

// Compound operational indexes
AbdmConsentRequestSchema.index({ patientId: 1, internalStatus: 1, createdAt: -1 });
AbdmConsentRequestSchema.index({ internalStatus: 1, expiresAt: 1 });
AbdmConsentRequestSchema.index({ environment: 1, internalStatus: 1 });

export const AbdmConsentRequestModel: Model<IAbdmConsentRequestDocument> =
  (mongoose.models.AbdmConsentRequest as Model<IAbdmConsentRequestDocument>) ||
  mongoose.model<IAbdmConsentRequestDocument>('AbdmConsentRequest', AbdmConsentRequestSchema);

export default AbdmConsentRequestModel;
