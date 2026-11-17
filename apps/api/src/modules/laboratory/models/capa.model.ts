import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { CAPAStatus } from '@healthbridge/shared-types';

export interface ICAPAActionItem {
  actionId: string;
  description: string;
  assignedToId: Types.ObjectId;
  assignedToName: string;
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt?: Date;
  verificationNotes?: string;
}

export interface ICAPADocument extends Document {
  capaReference: string;
  incidentId: Types.ObjectId;
  incidentReference: string;
  laboratoryId: Types.ObjectId;
  problemStatement: string;
  rootCauseCategory: string;
  rootCauseAnalysis: string;
  correctiveAction: string;
  preventiveAction: string;
  assignedOwnerId: Types.ObjectId;
  assignedOwnerName: string;
  dueDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: CAPAStatus;
  actions: ICAPAActionItem[];
  verificationMethod?: string;
  verifiedById?: Types.ObjectId;
  verifiedByName?: string;
  verifiedAt?: Date;
  effectivenessReviewNotes?: string;
  effectivenessResult?: 'EFFECTIVE' | 'INEFFECTIVE';
  closedById?: Types.ObjectId;
  closedByName?: string;
  closedAt?: Date;
  reopenReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CAPAActionItemSchema = new Schema<ICAPAActionItem>(
  {
    actionId: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    assignedToId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToName: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      required: true,
      default: 'PENDING',
    },
    completedAt: { type: Date },
    verificationNotes: { type: String, trim: true },
  },
  { _id: false }
);

const CAPASchema = new Schema<ICAPADocument>(
  {
    capaReference: { type: String, required: true, unique: true, index: true },
    incidentId: { type: Schema.Types.ObjectId, ref: 'QualityIncident', required: true, index: true },
    incidentReference: { type: String, required: true, trim: true },
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    problemStatement: { type: String, required: true, trim: true },
    rootCauseCategory: { type: String, required: true, trim: true },
    rootCauseAnalysis: { type: String, required: true, trim: true },
    correctiveAction: { type: String, required: true, trim: true },
    preventiveAction: { type: String, required: true, trim: true },
    assignedOwnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedOwnerName: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'ASSIGNED',
        'IN_PROGRESS',
        'PENDING_VERIFICATION',
        'EFFECTIVE',
        'INEFFECTIVE',
        'CLOSED',
      ],
      required: true,
      default: 'OPEN',
      index: true,
    },
    actions: [CAPAActionItemSchema],
    verificationMethod: { type: String, trim: true },
    verifiedById: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedByName: { type: String, trim: true },
    verifiedAt: { type: Date },
    effectivenessReviewNotes: { type: String, trim: true },
    effectivenessResult: {
      type: String,
      enum: ['EFFECTIVE', 'INEFFECTIVE'],
    },
    closedById: { type: Schema.Types.ObjectId, ref: 'User' },
    closedByName: { type: String, trim: true },
    closedAt: { type: Date },
    reopenReason: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

CAPASchema.index({ laboratoryId: 1, status: 1, dueDate: 1 });
CAPASchema.index({ laboratoryId: 1, assignedOwnerId: 1 });

export const CAPAModel: Model<ICAPADocument> =
  mongoose.models.CAPA || mongoose.model<ICAPADocument>('CAPA', CAPASchema);
