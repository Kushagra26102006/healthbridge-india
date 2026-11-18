import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { ConsentStatus } from '@healthbridge/shared-types';

export interface IConsentRequestDocument extends Document {
  patientId: Types.ObjectId;
  requesterId: Types.ObjectId;
  requesterName?: string;
  requesterRole: string;
  organization: string;
  facilityId?: Types.ObjectId;
  purpose: string;
  purposeDescription?: string;
  requestedDataTypes: string[];
  dateRange: {
    from: Date;
    to: Date;
  };
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  revokedAt?: Date;
  rejectionReason?: string;
  revocationReason?: string;
  signature?: string;
  consentVersion?: number;
  permittedOperations?: string[];
  sourceOfConsent?: 'PATIENT_PORTAL' | 'ABDM_GATEWAY' | 'CLINICAL_WORKFLOW';
  receiptNumber?: string;
  transactionReference?: string;
  status: ConsentStatus | 'DRAFT' | 'REQUESTED' | 'GRANTED' | 'DENIED' | 'WITHDRAWN';
  expiresAt: Date;
  auditId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
}

const ConsentRequestSchema = new Schema<IConsentRequestDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID reference is required'],
      index: true,
    },
    requesterName: {
      type: String,
      trim: true,
    },
    requesterRole: {
      type: String,
      default: 'DOCTOR',
      trim: true,
    },
    organization: {
      type: String,
      default: 'HealthBridge Partner Hospital',
      trim: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
    },
    purpose: {
      type: String,
      required: [true, 'ABDM purpose code is required'],
      trim: true,
      index: true,
    },
    purposeDescription: {
      type: String,
      trim: true,
    },
    requestedDataTypes: {
      type: [String],
      required: [true, 'At least one health record data type must be requested'],
      validate: {
        validator: (types: string[]) => types.length > 0,
        message: 'At least one data type is required',
      },
    },
    dateRange: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    revocationReason: {
      type: String,
      trim: true,
    },
    signature: {
      type: String,
      trim: true,
    },
    consentVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    permittedOperations: {
      type: [String],
      default: ['VIEW'],
    },
    sourceOfConsent: {
      type: String,
      enum: ['PATIENT_PORTAL', 'ABDM_GATEWAY', 'CLINICAL_WORKFLOW'],
      default: 'PATIENT_PORTAL',
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING',
        'APPROVED',
        'REJECTED',
        'REVOKED',
        'EXPIRED',
        'REQUESTED',
        'GRANTED',
        'DENIED',
        'WITHDRAWN',
      ],
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Consent request expiration time is required'],
      index: true,
    },
    auditId: {
      type: Schema.Types.ObjectId,
      ref: 'AuditLog',
    },
  },
  {
    timestamps: true,
    collection: 'consentRequests',
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

ConsentRequestSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Compound indexes for high-throughput queries
ConsentRequestSchema.index({ patientId: 1, status: 1, expiresAt: 1 });
ConsentRequestSchema.index({ requesterId: 1, status: 1 });
ConsentRequestSchema.index({ patientId: 1, requestedAt: -1 });

export const ConsentRequestModel: Model<IConsentRequestDocument> =
  (mongoose.models.ConsentRequest as Model<IConsentRequestDocument>) ||
  mongoose.model<IConsentRequestDocument>('ConsentRequest', ConsentRequestSchema);

export default ConsentRequestModel;
