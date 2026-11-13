import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { AdminLevel } from '@healthbridge/shared-types';

export interface IAdminProfileDocument extends Document {
  userId: Types.ObjectId;
  administrativeLevel: AdminLevel;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AdminProfileSchema = new Schema<IAdminProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for admin profile'],
      unique: true,
      index: true,
    },
    administrativeLevel: {
      type: String,
      enum: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'SUPPORT_ADMIN'],
      default: 'HOSPITAL_ADMIN',
      index: true,
    },
    permissions: {
      type: [String],
      default: ['VIEW_METRICS', 'MANAGE_USERS', 'VERIFY_PROVIDERS'],
    },
  },
  {
    timestamps: true,
    collection: 'adminProfiles',
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

export const AdminProfileModel: Model<IAdminProfileDocument> =
  (mongoose.models.AdminProfile as Model<IAdminProfileDocument>) ||
  mongoose.model<IAdminProfileDocument>('AdminProfile', AdminProfileSchema);

export default AdminProfileModel;

