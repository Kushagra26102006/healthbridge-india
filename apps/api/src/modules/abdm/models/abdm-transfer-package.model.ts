/**
 * HealthBridge India — ABDM Transfer Package Model (Day 7 Task 04)
 *
 * Stores HIP outbound transfer package metadata, cryptographic hashes, and AES-encrypted
 * ciphertext (`select: false`). Plaintext clinical payloads are NEVER stored in operational
 * fields or logged.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmEncryptionProviderMode,
  AbdmEnvironment,
  AbdmHealthInfoType,
  AbdmImportedRecordValidationStatus,
} from '@healthbridge/shared-types';

export interface IAbdmTransferPackageDocument extends Document {
  internalPackageRef: string;
  transferId: Types.ObjectId;
  externalTransactionId?: string;
  patientId: Types.ObjectId;
  consentArtefactId: string;
  hiType: AbdmHealthInfoType;
  careContextReference: string;
  bundleSha256: string;
  encryptedPayloadSha256?: string;
  encryptedPayload?: string;
  encryptionApplied: boolean;
  encryptionProviderMode: AbdmEncryptionProviderMode;
  fhirValidationStatus: AbdmImportedRecordValidationStatus;
  validationErrorCount: number;
  validationWarningCount: number;
  unmappedFieldsCount: number;
  pageNumber: number;
  pageCount: number;
  correlationId: string;
  environment: AbdmEnvironment;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmTransferPackageSchema = new Schema<IAbdmTransferPackageDocument>(
  {
    internalPackageRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    consentArtefactId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    hiType: {
      type: String,
      required: true,
      trim: true,
    },
    careContextReference: {
      type: String,
      required: true,
      trim: true,
    },
    bundleSha256: {
      type: String,
      required: true,
      immutable: true,
    },
    encryptedPayloadSha256: {
      type: String,
      immutable: true,
    },
    encryptedPayload: {
      type: String,
      select: false,
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
    fhirValidationStatus: {
      type: String,
      enum: ['VALID', 'VALID_WITH_WARNINGS', 'INVALID'],
      required: true,
      default: 'VALID',
    },
    validationErrorCount: { type: Number, default: 0, min: 0 },
    validationWarningCount: { type: Number, default: 0, min: 0 },
    unmappedFieldsCount: { type: Number, default: 0, min: 0 },
    pageNumber: { type: Number, default: 0, min: 0 },
    pageCount: { type: Number, default: 1, min: 1 },
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
    },
  },
  {
    timestamps: true,
    collection: 'abdm_transfer_packages',
  }
);

AbdmTransferPackageSchema.index({ transferId: 1, pageNumber: 1, careContextReference: 1 });

export const AbdmTransferPackageModel: Model<IAbdmTransferPackageDocument> =
  mongoose.models.AbdmTransferPackage ||
  mongoose.model<IAbdmTransferPackageDocument>('AbdmTransferPackage', AbdmTransferPackageSchema);
