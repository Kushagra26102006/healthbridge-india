import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { DeliveryStatus, NotificationChannel } from '@healthbridge/shared-types';

export interface INotificationDeliveryDocument extends Document {
  notificationId: Types.ObjectId;
  userId: Types.ObjectId;
  channel: NotificationChannel;
  provider: string;
  status: DeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  providerReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationDeliverySchema = new Schema<INotificationDeliveryDocument>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: [true, 'Notification reference ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference ID is required'],
      index: true,
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS'],
      required: true,
    },
    provider: {
      type: String,
      trim: true,
      default: 'IN_APP_LOCAL',
    },
    status: {
      type: String,
      enum: ['PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING'],
      default: 'PENDING',
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    providerReference: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'notificationDeliveries',
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

NotificationDeliverySchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationDeliverySchema.index({ notificationId: 1, channel: 1 });

export const NotificationDeliveryModel: Model<INotificationDeliveryDocument> =
  (mongoose.models.NotificationDelivery as Model<INotificationDeliveryDocument>) ||
  mongoose.model<INotificationDeliveryDocument>(
    'NotificationDelivery',
    NotificationDeliverySchema
  );

export default NotificationDeliveryModel;
