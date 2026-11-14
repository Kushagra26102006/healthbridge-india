import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  NotificationCategory,
  NotificationChannelPreferences,
} from '@healthbridge/shared-types';

export interface INotificationPreferenceDocument extends Document {
  userId: Types.ObjectId;
  userRole?: string;
  channels: NotificationChannelPreferences;
  categoryPreferences: Record<NotificationCategory, NotificationChannelPreferences>;
  mandatoryCategories: NotificationCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const ChannelPreferenceSchema = new Schema<NotificationChannelPreferences>(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  { _id: false }
);

export const DEFAULT_CATEGORY_PREFERENCES: Record<NotificationCategory, NotificationChannelPreferences> = {
  PRESCRIPTION: { inApp: true, email: true, sms: true },
  ORDER: { inApp: true, email: true, sms: true },
  INVENTORY: { inApp: true, email: true, sms: false },
  PROCUREMENT: { inApp: true, email: true, sms: false },
  SECURITY: { inApp: true, email: true, sms: true }, // Mandatory: cannot be disabled
  APPOINTMENT: { inApp: true, email: true, sms: true },
  CONSENT: { inApp: true, email: true, sms: false },
  LAB: { inApp: true, email: true, sms: true },
  SYSTEM: { inApp: true, email: false, sms: false },
};

const NotificationPreferenceSchema = new Schema<INotificationPreferenceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference ID is required'],
      unique: true,
      index: true,
    },
    userRole: {
      type: String,
      trim: true,
    },
    channels: {
      type: ChannelPreferenceSchema,
      default: () => ({ inApp: true, email: true, sms: true }),
    },
    categoryPreferences: {
      type: Schema.Types.Mixed,
      default: () => ({ ...DEFAULT_CATEGORY_PREFERENCES }),
    },
    mandatoryCategories: {
      type: [String],
      default: ['SECURITY'],
    },
  },
  {
    timestamps: true,
    collection: 'notificationPreferences',
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

export const NotificationPreferenceModel: Model<INotificationPreferenceDocument> =
  (mongoose.models.NotificationPreference as Model<INotificationPreferenceDocument>) ||
  mongoose.model<INotificationPreferenceDocument>(
    'NotificationPreference',
    NotificationPreferenceSchema
  );

export default NotificationPreferenceModel;
