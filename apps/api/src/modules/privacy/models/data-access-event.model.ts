/**
 * HealthBridge India — Append-Only Data Access Transparency Ledger (Day 9 Task 02)
 *
 * Records meaningful access attempts (ALLOWED and DENIED) to patient-scoped resources
 * without storing clinical payloads or exposing internal security investigation details.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { UserRole } from '@healthbridge/shared-types';

export type AccessPurpose =
  | 'TREATMENT'
  | 'HEALTHCARE_COORDINATION'
  | 'LABORATORY_SERVICE'
  | 'PHARMACY_FULFILLMENT'
  | 'PATIENT_SELF_ACCESS'
  | 'ADMINISTRATIVE_OPERATIONS'
  | 'ABDM_HEALTH_INFORMATION_EXCHANGE';

export type AccessAuthorizationDecision = 'ALLOWED' | 'DENIED';

export interface IDataAccessEventDocument extends Document {
  accessEventId: string;
  patientId: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole: UserRole;
  actorName?: string;
  organization?: string;
  resourceCategory: string;
  resourceReference?: string;
  accessPurpose: AccessPurpose;
  lawfulBasis: string;
  authorizationDecision: AccessAuthorizationDecision;
  consentReference?: string;
  requestId: string;
  correlationId?: string;
  patientVisible: boolean;
  timestamp: Date;
}

const DataAccessEventSchema = new Schema<IDataAccessEventDocument>(
  {
    accessEventId: { type: String, required: true, unique: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: {
      type: String,
      enum: ['PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY', 'ADMIN'],
      required: true,
      index: true,
    },
    actorName: { type: String, trim: true },
    organization: { type: String, trim: true },
    resourceCategory: { type: String, required: true, trim: true, index: true },
    resourceReference: { type: String, trim: true },
    accessPurpose: {
      type: String,
      enum: [
        'TREATMENT',
        'HEALTHCARE_COORDINATION',
        'LABORATORY_SERVICE',
        'PHARMACY_FULFILLMENT',
        'PATIENT_SELF_ACCESS',
        'ADMINISTRATIVE_OPERATIONS',
        'ABDM_HEALTH_INFORMATION_EXCHANGE',
      ],
      required: true,
      index: true,
    },
    lawfulBasis: { type: String, required: true, trim: true },
    authorizationDecision: {
      type: String,
      enum: ['ALLOWED', 'DENIED'],
      required: true,
      index: true,
    },
    consentReference: { type: String, trim: true },
    requestId: { type: String, required: true, trim: true, index: true },
    correlationId: { type: String, trim: true },
    patientVisible: { type: Boolean, default: true, index: true },
    timestamp: { type: Date, default: Date.now, required: true, index: true },
  },
  {
    timestamps: false,
    collection: 'dataAccessEvents',
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

// Enforce append-only immutability so ordinary users or services cannot tamper with access history
DataAccessEventSchema.pre('updateOne', function () {
  throw new Error('DataAccessEvent records are immutable and cannot be modified');
});
DataAccessEventSchema.pre('updateMany', function () {
  throw new Error('DataAccessEvent records are immutable and cannot be modified');
});
DataAccessEventSchema.pre('findOneAndUpdate', function () {
  throw new Error('DataAccessEvent records are immutable and cannot be modified');
});
DataAccessEventSchema.pre('deleteOne', function () {
  throw new Error('DataAccessEvent records cannot be deleted');
});
DataAccessEventSchema.pre('deleteMany', function () {
  throw new Error('DataAccessEvent records cannot be deleted');
});
DataAccessEventSchema.pre('findOneAndDelete', function () {
  throw new Error('DataAccessEvent records cannot be deleted');
});

DataAccessEventSchema.index({ patientId: 1, patientVisible: 1, timestamp: -1 });
DataAccessEventSchema.index({ actorId: 1, timestamp: -1 });

export const DataAccessEventModel: Model<IDataAccessEventDocument> =
  (mongoose.models.DataAccessEvent as Model<IDataAccessEventDocument>) ||
  mongoose.model<IDataAccessEventDocument>('DataAccessEvent', DataAccessEventSchema);

export default DataAccessEventModel;
