/**
 * HealthBridge India — ABDM Imported External Health Record Model (Day 7 Task 04)
 *
 * Stores HIU-imported external FHIR R4 clinical documents with:
 * - Immutable provenance & SHA-256 bundle hash (`immutable: true`)
 * - AES-256-GCM encrypted FHIR bundle payload (`select: false`)
 * - Deduplication via unique `{ patientId, sourceParticipantId, careContextReference, bundleSha256 }`
 * - Quarantined review workflow (`QUARANTINED_REVIEW`) for ambiguous patient matching or warnings
 * - Read-only enforcement: clinicians and doctors may NEVER modify imported external source records.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmEnvironment,
  AbdmHealthInfoType,
  AbdmImportedRecordReviewStatus,
  AbdmImportedRecordSummaryDto,
  AbdmImportedRecordValidationStatus,
  FhirValidationIssueDto,
} from '@healthbridge/shared-types';

export interface IAbdmImportedRecordDocument extends Document {
  internalImportRef: string;
  patientId: Types.ObjectId;
  transferId: Types.ObjectId;
  externalTransactionId: string;
  consentArtefactId: string;
  externalConsentId: string;
  sourceParticipantId: string;
  sourceOrganizationName: string;
  careContextReference: string;
  hiType: AbdmHealthInfoType;
  bundleSha256: string;
  encryptedFhirBundle?: string;
  originalIssuedAt?: Date;
  importedAt: Date;
  validationStatus: AbdmImportedRecordValidationStatus;
  reviewStatus: AbdmImportedRecordReviewStatus;
  patientMatchConfidence: 'EXACT_ABHA_MATCH' | 'DEMOGRAPHIC_REVIEW_REQUIRED';
  quarantineReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  isAmended: boolean;
  summary: AbdmImportedRecordSummaryDto;
  unmappedFields: string[];
  validationErrors: FhirValidationIssueDto[];
  validationWarnings: FhirValidationIssueDto[];
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmImportedRecordSchema = new Schema<IAbdmImportedRecordDocument>(
  {
    internalImportRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      immutable: true,
    },
    transferId: {
      type: Schema.Types.ObjectId,
      ref: 'AbdmHealthInformationTransfer',
      required: true,
      index: true,
      immutable: true,
    },
    externalTransactionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      immutable: true,
    },
    consentArtefactId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      immutable: true,
    },
    externalConsentId: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    sourceParticipantId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      immutable: true,
    },
    sourceOrganizationName: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    careContextReference: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    hiType: {
      type: String,
      required: true,
      trim: true,
      index: true,
      immutable: true,
    },
    bundleSha256: {
      type: String,
      required: true,
      immutable: true,
    },
    encryptedFhirBundle: {
      type: String,
      select: false,
    },
    originalIssuedAt: {
      type: Date,
      immutable: true,
    },
    importedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    validationStatus: {
      type: String,
      enum: ['VALID', 'VALID_WITH_WARNINGS', 'INVALID'],
      required: true,
      index: true,
    },
    reviewStatus: {
      type: String,
      enum: ['IMPORTED_VERIFIED', 'QUARANTINED_REVIEW', 'APPROVED_AFTER_REVIEW', 'REJECTED'],
      required: true,
      default: 'IMPORTED_VERIFIED',
      index: true,
    },
    patientMatchConfidence: {
      type: String,
      enum: ['EXACT_ABHA_MATCH', 'DEMOGRAPHIC_REVIEW_REQUIRED'],
      required: true,
      default: 'EXACT_ABHA_MATCH',
    },
    quarantineReason: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true },
    isAmended: { type: Boolean, default: false, immutable: true },
    summary: {
      type: Schema.Types.Mixed,
      required: true,
      immutable: true,
    },
    unmappedFields: {
      type: [String],
      default: [],
    },
    validationErrors: {
      type: Schema.Types.Mixed,
      default: [],
    },
    validationWarnings: {
      type: Schema.Types.Mixed,
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
  },
  {
    timestamps: true,
    collection: 'abdm_imported_records',
  }
);

// Prevent duplicate imports of the exact same clinical document bundle
AbdmImportedRecordSchema.index(
  { patientId: 1, sourceParticipantId: 1, careContextReference: 1, bundleSha256: 1 },
  { unique: true }
);
AbdmImportedRecordSchema.index({ patientId: 1, reviewStatus: 1, hiType: 1, importedAt: -1 });

export const AbdmImportedRecordModel: Model<IAbdmImportedRecordDocument> =
  mongoose.models.AbdmImportedRecord ||
  mongoose.model<IAbdmImportedRecordDocument>('AbdmImportedRecord', AbdmImportedRecordSchema);
