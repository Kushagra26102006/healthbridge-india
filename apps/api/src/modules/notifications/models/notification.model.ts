import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { NotificationType } from '@healthbridge/shared-types';

export interface INotificationDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for notification'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message body is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: ['APPOINTMENT', 'CONSENT_REQUEST', 'LAB_REPORT', 'PRESCRIPTION', 'SYSTEM_ALERT'],
      required: [true, 'Notification type is required'],
      index: true,
    },
    readAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
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

// High-speed index for user unread notification queries
NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const NotificationModel: Model<INotificationDocument> =
  (mongoose.models.Notification as Model<INotificationDocument>) ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default NotificationModel;
