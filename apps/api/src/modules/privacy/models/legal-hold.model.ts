/**
 * HealthBridge India — Legal & Clinical Hold Model (Day 9 Task 02)
 *
 * Prevents deletion or disposal of specified patient data categories while an active
 * legal, medico-legal, or regulatory investigation hold is in effect.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ILegalHoldDocument extends Document {
  holdReference: string;
  patientId: Types.ObjectId;
  scopeCategories: string[];
  reason: string;
  status: 'ACTIVE' | 'RELEASED';
  placedBy: Types.ObjectId;
  placedAt: Date;
  releasedBy?: Types.ObjectId;
  releasedAt?: Date;
}

const LegalHoldSchema = new Schema<ILegalHoldDocument>(
  {
    holdReference: { type: String, required: true, unique: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scopeCategories: { type: [String], required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['ACTIVE', 'RELEASED'], default: 'ACTIVE', index: true },
    placedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    placedAt: { type: Date, default: Date.now, required: true },
    releasedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    releasedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'legalHolds',
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

LegalHoldSchema.index({ patientId: 1, status: 1 });

export const LegalHoldModel: Model<ILegalHoldDocument> =
  (mongoose.models.LegalHold as Model<ILegalHoldDocument>) ||
  mongoose.model<ILegalHoldDocument>('LegalHold', LegalHoldSchema);

export default LegalHoldModel;
