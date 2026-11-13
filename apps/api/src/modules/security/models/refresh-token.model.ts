import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { DeviceInfo } from '@healthbridge/shared-types';

export interface IRefreshTokenDocument extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  deviceInfo?: DeviceInfo;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isActive(): boolean;
}

const DeviceInfoSchema = new Schema<DeviceInfo>(
  {
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    deviceName: { type: String, trim: true },
  },
  { _id: false }
);

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for refresh token'],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, 'SHA-256 token hash is required'],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Token expiration date is required'],
    },
    revokedAt: {
      type: Date,
    },
    deviceInfo: {
      type: DeviceInfoSchema,
    },
  },
  {
    timestamps: true,
    collection: 'refreshTokens',
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

RefreshTokenSchema.methods.isExpired = function (): boolean {
  return new Date() >= this.expiresAt;
};

RefreshTokenSchema.methods.isActive = function (): boolean {
  return !this.revokedAt && !this.isExpired();
};

// Automatic cleanup via MongoDB TTL index (removes document after expiry)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel: Model<IRefreshTokenDocument> =
  (mongoose.models.RefreshToken as Model<IRefreshTokenDocument>) ||
  mongoose.model<IRefreshTokenDocument>('RefreshToken', RefreshTokenSchema);

export default RefreshTokenModel;
