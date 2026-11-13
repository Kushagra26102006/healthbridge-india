import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type VerificationTokenType = 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | 'PHONE_OTP';

export interface IVerificationTokenDocument extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  type: VerificationTokenType;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isValid(): boolean;
}

const VerificationTokenSchema = new Schema<IVerificationTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for verification token'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['PASSWORD_RESET', 'EMAIL_VERIFICATION', 'PHONE_OTP'],
      required: [true, 'Token type is required'],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Token expiration time is required'],
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'verificationTokens',
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

VerificationTokenSchema.methods.isExpired = function (): boolean {
  return new Date() >= this.expiresAt;
};

VerificationTokenSchema.methods.isValid = function (): boolean {
  return !this.usedAt && !this.isExpired();
};

// Automatic cleanup: Delete records 24 hours after their expiration
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
VerificationTokenSchema.index({ tokenHash: 1, type: 1 });

export const VerificationTokenModel: Model<IVerificationTokenDocument> =
  (mongoose.models.VerificationToken as Model<IVerificationTokenDocument>) ||
  mongoose.model<IVerificationTokenDocument>('VerificationToken', VerificationTokenSchema);

export default VerificationTokenModel;
