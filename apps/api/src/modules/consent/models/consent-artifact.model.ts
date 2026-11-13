import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { ConsentArtifactStatus } from '@healthbridge/shared-types';

export interface IConsentArtifactDocument extends Document {
  consentRequestId?: Types.ObjectId;
  patientId: Types.ObjectId;
  requesterId: Types.ObjectId;
  requesterName?: string;
  purpose: string;
  permittedDataTypes: string[];
  validityPeriod: {
    from: Date;
    to: Date;
  };
  consentStatus: ConsentArtifactStatus;
  approvedAt: Date;
  revokedAt?: Date;
  signature?: string;
  createdAt: Date;
  updatedAt: Date;
  isValidConsent(): boolean;
}

const ConsentArtifactSchema = new Schema<IConsentArtifactDocument>(
  {
    consentRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ConsentRequest',
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required for consent artifact'],
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
    purpose: {
      type: String,
      required: [true, 'ABDM purpose code is required'],
      trim: true,
      index: true,
    },
    permittedDataTypes: {
      type: [String],
      required: [true, 'At least one health record data type must be permitted'],
      validate: {
        validator: (types: string[]) => types.length > 0,
        message: 'At least one data type is required',
      },
    },
    validityPeriod: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    consentStatus: {
      type: String,
      enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    approvedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    signature: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'consentArtifacts',
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

/**
 * Validates whether the consent artifact currently authorizes medical record access.
 * Strict ABDM rule: Must be ACTIVE and within current validity window.
 */
ConsentArtifactSchema.methods.isValidConsent = function (): boolean {
  if (this.consentStatus !== 'ACTIVE') {
    return false;
  }
  const now = new Date();
  return now >= this.validityPeriod.from && now <= this.validityPeriod.to;
};

// Index for consent lookups when evaluating EHR query authorization
ConsentArtifactSchema.index({
  patientId: 1,
  requesterId: 1,
  consentStatus: 1,
  'validityPeriod.to': 1,
});

export const ConsentArtifactModel: Model<IConsentArtifactDocument> =
  (mongoose.models.ConsentArtifact as Model<IConsentArtifactDocument>) ||
  mongoose.model<IConsentArtifactDocument>('ConsentArtifact', ConsentArtifactSchema);

export default ConsentArtifactModel;
