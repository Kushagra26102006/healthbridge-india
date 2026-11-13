import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { ConsentRequestStatus } from '@healthbridge/shared-types';

export interface IConsentRequestDocument extends Document {
  patientId: Types.ObjectId;
  requesterId: Types.ObjectId;
  requesterName?: string;
  purpose: string;
  purposeDescription?: string;
  requestedDataTypes: string[];
  dateRange: {
    from: Date;
    to: Date;
  };
  requestedAt: Date;
  status: ConsentRequestStatus;
  expiresAt: Date;
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
    status: {
      type: String,
      enum: ['REQUESTED', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED'],
      default: 'REQUESTED',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Consent request expiration time is required'],
      index: true,
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

// Index for query: find pending consent requests for patient before expiry
ConsentRequestSchema.index({ patientId: 1, status: 1, expiresAt: 1 });

export const ConsentRequestModel: Model<IConsentRequestDocument> =
  (mongoose.models.ConsentRequest as Model<IConsentRequestDocument>) ||
  mongoose.model<IConsentRequestDocument>('ConsentRequest', ConsentRequestSchema);

export default ConsentRequestModel;
