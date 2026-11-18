/**
 * HealthBridge India — Versioned Privacy Notice & Acknowledgement Models (Day 9 Task 02)
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IPrivacyNoticeAcknowledgementDocument extends Document {
  userId: Types.ObjectId;
  noticeVersion: string;
  acknowledgedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const PrivacyNoticeAcknowledgementSchema = new Schema<IPrivacyNoticeAcknowledgementDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    noticeVersion: { type: String, required: true, trim: true, index: true },
    acknowledgedAt: { type: Date, default: Date.now, required: true },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  {
    timestamps: false,
    collection: 'privacyNoticeAcknowledgements',
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

PrivacyNoticeAcknowledgementSchema.index({ userId: 1, noticeVersion: 1 }, { unique: true });

export const PrivacyNoticeAcknowledgementModel: Model<IPrivacyNoticeAcknowledgementDocument> =
  (mongoose.models.PrivacyNoticeAcknowledgement as Model<IPrivacyNoticeAcknowledgementDocument>) ||
  mongoose.model<IPrivacyNoticeAcknowledgementDocument>(
    'PrivacyNoticeAcknowledgement',
    PrivacyNoticeAcknowledgementSchema
  );

export default PrivacyNoticeAcknowledgementModel;
