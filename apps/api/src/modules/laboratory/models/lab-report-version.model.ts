/**
 * HealthBridge India — Laboratory Report Version Database Model
 * Immutable version ledger preserving complete report snapshots across amendment lifecycles.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { LabReportStatus } from '@healthbridge/shared-types';

export interface ILabReportVersionDocument extends Document {
  reportId: Types.ObjectId;
  reportNumber: string;
  version: number;
  status: LabReportStatus;
  contentSnapshot: Record<string, unknown>;
  documentHash: string;
  documentBuffer?: Buffer;
  documentUrl?: string;
  documentFileSize?: number;
  createdBy: Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  amendmentReason?: string;
  changedFields?: string[];
  approvalSnapshot?: {
    approvedById?: Types.ObjectId;
    approvedByName?: string;
    approvedByDesignation?: string;
    approvedByRegistrationNumber?: string;
    approvedAt?: Date;
    comments?: string;
  };
}

const LabReportVersionSchema = new Schema<ILabReportVersionDocument>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryReport',
      required: [true, 'Report ID reference is required'],
      index: true,
    },
    reportNumber: {
      type: String,
      required: [true, 'Report reference number is required'],
      trim: true,
      index: true,
    },
    version: {
      type: Number,
      required: [true, 'Version sequence number is required'],
      min: 1,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    contentSnapshot: {
      type: Schema.Types.Mixed,
      required: [true, 'Immutable content snapshot is required'],
    },
    documentHash: {
      type: String,
      required: [true, 'Cryptographic document hash is required'],
      trim: true,
    },
    documentBuffer: {
      type: Buffer,
      select: false,
    },
    documentUrl: {
      type: String,
      trim: true,
    },
    documentFileSize: {
      type: Number,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      trim: true,
    },
    amendmentReason: {
      type: String,
      trim: true,
    },
    changedFields: {
      type: [String],
      default: [],
    },
    approvalSnapshot: {
      approvedById: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedByName: { type: String },
      approvedByDesignation: { type: String },
      approvedByRegistrationNumber: { type: String },
      approvedAt: { type: Date },
      comments: { type: String },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable: no updates
    collection: 'labReportVersions',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        delete ret.documentBuffer;
        return ret;
      },
    },
  }
);

// Compound unique index ensuring immutable version progression
LabReportVersionSchema.index({ reportId: 1, version: 1 }, { unique: true });
LabReportVersionSchema.index({ reportNumber: 1, version: 1 });

export const LabReportVersionModel: Model<ILabReportVersionDocument> =
  (mongoose.models.LabReportVersion as Model<ILabReportVersionDocument>) ||
  mongoose.model<ILabReportVersionDocument>('LabReportVersion', LabReportVersionSchema);

export default LabReportVersionModel;
