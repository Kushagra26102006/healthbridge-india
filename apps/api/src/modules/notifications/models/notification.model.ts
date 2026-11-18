import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  DeliveryStatus,
  NotificationCategory,
  NotificationEventType,
  NotificationPriority,
  NotificationType,
} from '@healthbridge/shared-types';

export interface INotificationDocument extends Document {
  userId: Types.ObjectId;
  userRole?: string;
  category: NotificationCategory;
  eventType: NotificationEventType;
  title: string;
  message: string;
  priority: NotificationPriority;
  type: NotificationType;
  sourceModule?: string;
  eventId?: string;
  deliveryStatus: DeliveryStatus;
  relatedEntity?: {
    entityType: string;
    entityId: string;
    referenceNumber?: string;
  };
  linkUrl?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  isRead: boolean;
  expiresAt?: Date;
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
    userRole: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'PRESCRIPTION',
        'ORDER',
        'INVENTORY',
        'PROCUREMENT',
        'SECURITY',
        'APPOINTMENT',
        'CONSENT',
        'LAB',
        'SYSTEM',
      ],
      default: 'SYSTEM',
      index: true,
    },
    eventType: {
      type: String,
      trim: true,
      default: 'SYSTEM_ALERT',
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
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    sourceModule: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    eventId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING'],
      default: 'PENDING',
    },
    type: {
      type: String,
      enum: [
        'APPOINTMENT',
        'CONSENT_REQUEST',
        'LAB_REPORT',
        'PRESCRIPTION',
        'SYSTEM_ALERT',
        'ORDER',
        'INVENTORY',
        'PROCUREMENT',
        'SECURITY',
      ],
      default: 'SYSTEM_ALERT',
      index: true,
    },
    relatedEntity: {
      entityType: { type: String, trim: true },
      entityId: { type: String, trim: true },
      referenceNumber: { type: String, trim: true },
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    readAt: {
      type: Date,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: false,
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

// High-speed compound indexes for filtered user queries, deduplication & retention
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, category: 1, createdAt: -1 });
NotificationSchema.index({ eventId: 1 }, { sparse: true });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
NotificationSchema.index({ createdAt: -1 });

export const NotificationModel: Model<INotificationDocument> =
  (mongoose.models.Notification as Model<INotificationDocument>) ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default NotificationModel;
