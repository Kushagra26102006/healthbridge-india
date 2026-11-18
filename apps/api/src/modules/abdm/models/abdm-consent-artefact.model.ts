/**
 * HealthBridge India — ABDM Consent Artefact Model (Day 7 Task 03)
 *
 * Preserves externally issued ABDM HIE-CM Consent Artefacts immutably alongside
 * validation metadata, encrypted sensitive snapshot, revocation state, and append-only
 * status history. Never silently alters the original external artefact payload.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmConsentAccessMode,
  AbdmConsentArtefactValidationStatus,
  AbdmConsentFrequencyUnit,
  AbdmConsentRevocationStatus,
  AbdmEnvironment,
  AbdmExternalConsentStatus,
  AbdmHealthInfoType,
  AbdmPurposeCode,
  ConsentOriginType,
} from '@healthbridge/shared-types';

export interface IAbdmConsentArtefactDocument extends Document {
  internalReference: string;
  externalConsentId: string;
  consentRequestId?: Types.ObjectId;
  externalRequestId?: string;
  origin: ConsentOriginType;
  patientId: Types.ObjectId;
  patientAbhaAddress: string;
  hipId?: string;
  hiuId: string;
  hiuName?: string;
  purposeCode: AbdmPurposeCode;
  purposeText: string;
  hiTypes: AbdmHealthInfoType[];
  accessMode: AbdmConsentAccessMode;
  dateRange: {
    from: Date;
    to: Date;
  };
  dataEraseAt: Date;
  frequency?: {
    unit: AbdmConsentFrequencyUnit;
    value: number;
    repeats: number;
  };
  externalStatus: AbdmExternalConsentStatus;
  validationStatus: AbdmConsentArtefactValidationStatus;
  revocationStatus: AbdmConsentRevocationStatus;
  signatureVerified: boolean;
  externalConfirmationReceived: boolean;
  /**
   * Immutable original artefact payload received from HIE-CM (never mutated post-creation).
   */
  originalExternalPayload: Record<string, unknown>;
  /**
   * Encrypted copy of sensitive artefact metadata (AES-256-GCM) for defense-in-depth at rest.
   */
  encryptedSensitivePayload?: string;
  /**
   * Deterministic SHA-256 hash of canonical originalExternalPayload for tamper detection.
   */
  payloadSha256: string;
  source: 'ABDM_HIE_CM_CALLBACK' | 'ABDM_HIE_CM_FETCH' | 'MOCK_HIE_CM_DEVELOPMENT';
  environment: AbdmEnvironment;
  isMocked: boolean;
  grantedAt?: Date;
  expiresAt: Date;
  revokedAt?: Date;
  revocationRequestedAt?: Date;
  revocationReason?: string;
  revocationCorrelationId?: string;
  nearingExpiryNotifiedAt?: Date;
  lastSyncedAt?: Date;
  lastExternalEventAt?: Date;
  validationIssues: string[];
  statusHistory: Array<{
    fromExternalStatus?: string;
    toExternalStatus: string;
    validationStatus?: string;
    revocationStatus?: string;
    reason?: string;
    changedAt: Date;
    correlationId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmConsentArtefactSchema = new Schema<IAbdmConsentArtefactDocument>(
  {
    internalReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    externalConsentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    origin: {
      type: String,
      enum: ['ABDM_HIE_CM', 'INTERNAL_HEALTHBRIDGE'],
      default: 'ABDM_HIE_CM',
      required: true,
      immutable: true,
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
    hipId: {
      type: String,
      trim: true,
      index: true,
    },
    hiuId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    hiuName: {
      type: String,
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
      },
      value: { type: Number, min: 1 },
      repeats: { type: Number, min: 0 },
    },
    externalStatus: {
      type: String,
      enum: ['REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED', 'UNKNOWN'],
      required: true,
      index: true,
    },
    validationStatus: {
      type: String,
      enum: [
        'PENDING_VALIDATION',
        'VALID',
        'INVALID_SCHEMA',
        'SIGNATURE_UNVERIFIED',
        'PATIENT_MISMATCH',
        'EXPIRED',
        'REVOKED',
      ],
      required: true,
      index: true,
    },
    revocationStatus: {
      type: String,
      enum: ['NOT_REVOKED', 'PENDING_CONFIRMATION', 'CONFIRMED_REVOKED', 'FAILED'],
      default: 'NOT_REVOKED',
      required: true,
      index: true,
    },
    signatureVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    externalConfirmationReceived: {
      type: Boolean,
      default: false,
      required: true,
    },
    originalExternalPayload: {
      type: Schema.Types.Mixed,
      required: true,
      immutable: true,
    },
    encryptedSensitivePayload: {
      type: String,
      select: false,
    },
    payloadSha256: {
      type: String,
      required: true,
      immutable: true,
    },
    source: {
      type: String,
      enum: ['ABDM_HIE_CM_CALLBACK', 'ABDM_HIE_CM_FETCH', 'MOCK_HIE_CM_DEVELOPMENT'],
      required: true,
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
    grantedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    revocationRequestedAt: {
      type: Date,
    },
    revocationReason: {
      type: String,
      trim: true,
    },
    revocationCorrelationId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    nearingExpiryNotifiedAt: {
      type: Date,
    },
    lastSyncedAt: {
      type: Date,
    },
    lastExternalEventAt: {
      type: Date,
    },
    validationIssues: {
      type: [String],
      default: [],
    },
    statusHistory: {
      type: [
        {
          fromExternalStatus: { type: String },
          toExternalStatus: { type: String, required: true },
          validationStatus: { type: String },
          revocationStatus: { type: String },
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
    collection: 'abdmConsentArtefacts',
  }
);

// Compound operational indexes
AbdmConsentArtefactSchema.index({ patientId: 1, externalStatus: 1, expiresAt: 1 });
AbdmConsentArtefactSchema.index({ patientId: 1, hiuId: 1, externalStatus: 1 });
AbdmConsentArtefactSchema.index({ externalStatus: 1, expiresAt: 1 });
AbdmConsentArtefactSchema.index({ environment: 1, externalStatus: 1 });

export const AbdmConsentArtefactModel: Model<IAbdmConsentArtefactDocument> =
  (mongoose.models.AbdmConsentArtefact as Model<IAbdmConsentArtefactDocument>) ||
  mongoose.model<IAbdmConsentArtefactDocument>('AbdmConsentArtefact', AbdmConsentArtefactSchema);

export default AbdmConsentArtefactModel;
