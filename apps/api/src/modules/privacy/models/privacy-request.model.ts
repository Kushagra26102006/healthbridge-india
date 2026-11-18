/**
 * HealthBridge India — Unified Patient Privacy & Rights Request Model (Day 9 Task 02)
 *
 * Covers:
 *   - EXPORT (patient data export jobs with private short-lived download expiry)
 *   - CORRECTION (personal/clinical correction requests preserving original values)
 *   - DELETION & ACCOUNT_CLOSURE (retention & legal-hold aware disposal governance)
 *   - ACCESS_INQUIRY & COMPLAINT (patient grievance/inquiry handling)
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type PrivacyRequestType =
  | 'EXPORT'
  | 'CORRECTION'
  | 'DELETION'
  | 'ACCOUNT_CLOSURE'
  | 'ACCESS_INQUIRY'
  | 'COMPLAINT';

export type PrivacyRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'WITHDRAWN';

export interface IPrivacyReviewHistoryEntry {
  timestamp: Date;
  actorId: string;
  actorRole: string;
  fromStatus: string;
  toStatus: string;
  note?: string;
}

export interface IPrivacyRequestDocument extends Document {
  referenceNumber: string;
  patientId: Types.ObjectId;
  requestType: PrivacyRequestType;
  status: PrivacyRequestStatus;
  reason?: string;
  // Export-specific fields
  exportCategories?: string[];
  exportFormat?: 'JSON';
  exportArtifact?: {
    generatedAt: Date;
    expiresAt: Date;
    sha256Checksum: string;
    recordCount: number;
    storageScope: 'PRIVATE_EPHEMERAL';
    payloadJson?: string;
    downloadedAt?: Date;
  };
  // Correction-specific fields (never overwrites finalized clinical records directly)
  correctionDetails?: {
    targetResource: string;
    targetResourceId?: string;
    fieldOrCategory: string;
    originalValueSnapshot?: string;
    requestedCorrection: string;
    patientExplanation: string;
    supportingDocumentRef?: string;
    isFinalizedClinicalRecord: boolean;
    appliedAmendmentReference?: string;
  };
  // Deletion / Closure-specific fields
  deletionDetails?: {
    requestedAction: 'ACCOUNT_DEACTIVATION' | 'ACCOUNT_CLOSURE' | 'DATA_DELETION' | 'DATA_ANONYMIZATION';
    retentionBlockedCategories: string[];
    eligibleCategories: string[];
    legalHoldBlocked: boolean;
    activeLegalHoldIds: string[];
    externalIntegrationCaveat: string;
    backupCaveat: string;
    actualDisposalOutcome?: 'PENDING_REVIEW' | 'PARTIAL_RESTRICTED_RETENTION' | 'ACCOUNT_CLOSED_RECORDS_RETAINED' | 'DEFERRED_LEGAL_HOLD' | 'REJECTED';
  };
  assignedReviewerId?: Types.ObjectId;
  escalationStatus: 'NONE' | 'ESCALATED' | 'RESOLVED';
  decisionSummary?: string;
  completionEvidence?: string;
  reviewHistory: IPrivacyReviewHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ReviewHistorySchema = new Schema<IPrivacyReviewHistoryEntry>(
  {
    timestamp: { type: Date, default: Date.now, required: true },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const PrivacyRequestSchema = new Schema<IPrivacyRequestDocument>(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestType: {
      type: String,
      enum: ['EXPORT', 'CORRECTION', 'DELETION', 'ACCOUNT_CLOSURE', 'ACCESS_INQUIRY', 'COMPLAINT'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'WITHDRAWN'],
      default: 'SUBMITTED',
      index: true,
    },
    reason: { type: String, trim: true, maxlength: 1000 },
    exportCategories: { type: [String] },
    exportFormat: { type: String, enum: ['JSON'], default: 'JSON' },
    exportArtifact: {
      generatedAt: { type: Date },
      expiresAt: { type: Date },
      sha256Checksum: { type: String },
      recordCount: { type: Number },
      storageScope: { type: String, enum: ['PRIVATE_EPHEMERAL'], default: 'PRIVATE_EPHEMERAL' },
      payloadJson: { type: String, select: false },
      downloadedAt: { type: Date },
    },
    correctionDetails: {
      targetResource: { type: String, trim: true },
      targetResourceId: { type: String, trim: true },
      fieldOrCategory: { type: String, trim: true },
      originalValueSnapshot: { type: String, trim: true },
      requestedCorrection: { type: String, trim: true },
      patientExplanation: { type: String, trim: true },
      supportingDocumentRef: { type: String, trim: true },
      isFinalizedClinicalRecord: { type: Boolean, default: false },
      appliedAmendmentReference: { type: String, trim: true },
    },
    deletionDetails: {
      requestedAction: {
        type: String,
        enum: ['ACCOUNT_DEACTIVATION', 'ACCOUNT_CLOSURE', 'DATA_DELETION', 'DATA_ANONYMIZATION'],
      },
      retentionBlockedCategories: { type: [String], default: [] },
      eligibleCategories: { type: [String], default: [] },
      legalHoldBlocked: { type: Boolean, default: false },
      activeLegalHoldIds: { type: [String], default: [] },
      externalIntegrationCaveat: { type: String },
      backupCaveat: { type: String },
      actualDisposalOutcome: {
        type: String,
        enum: [
          'PENDING_REVIEW',
          'PARTIAL_RESTRICTED_RETENTION',
          'ACCOUNT_CLOSED_RECORDS_RETAINED',
          'DEFERRED_LEGAL_HOLD',
          'REJECTED',
        ],
      },
    },
    assignedReviewerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    escalationStatus: {
      type: String,
      enum: ['NONE', 'ESCALATED', 'RESOLVED'],
      default: 'NONE',
    },
    decisionSummary: { type: String, trim: true, maxlength: 1000 },
    completionEvidence: { type: String, trim: true, maxlength: 1000 },
    reviewHistory: { type: [ReviewHistorySchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'privacyRequests',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        if (ret.exportArtifact && typeof ret.exportArtifact === 'object') {
          delete (ret.exportArtifact as Record<string, unknown>).payloadJson;
        }
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

PrivacyRequestSchema.index({ patientId: 1, requestType: 1, createdAt: -1 });
PrivacyRequestSchema.index({ status: 1, requestType: 1, createdAt: -1 });

export const PrivacyRequestModel: Model<IPrivacyRequestDocument> =
  (mongoose.models.PrivacyRequest as Model<IPrivacyRequestDocument>) ||
  mongoose.model<IPrivacyRequestDocument>('PrivacyRequest', PrivacyRequestSchema);

export default PrivacyRequestModel;
