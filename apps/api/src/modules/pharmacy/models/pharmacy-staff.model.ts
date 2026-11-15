import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  PharmacyStaffRole,
  PharmacyPermission,
  PharmacyStaffStatus,
} from '@healthbridge/shared-types';

export interface IPharmacyStaffDocument extends Document {
  pharmacyId: Types.ObjectId;
  userId?: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  staffId: string;
  designation: string;
  role: PharmacyStaffRole;
  permissions: PharmacyPermission[];
  status: PharmacyStaffStatus;
  pharmacistRegistrationNumber?: string;
  isOwner: boolean;
  invitationToken?: string;
  invitationSentAt?: Date;
  invitationExpiresAt?: Date;
  invitedBy?: Types.ObjectId;
  lastActiveAt?: Date;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyStaffSchema = new Schema<IPharmacyStaffDocument>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'PharmacyProfile',
      required: [true, 'Associated pharmacy profile ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Staff full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Staff email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    staffId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    designation: {
      type: String,
      required: [true, 'Staff designation is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'PHARMACY_OWNER',
        'PHARMACY_MANAGER',
        'PHARMACIST',
        'INVENTORY_STAFF',
        'PROCUREMENT_STAFF',
        'ORDER_STAFF',
      ],
      default: 'PHARMACIST',
      index: true,
    },
    permissions: {
      type: [String],
      enum: [
        'VIEW_DASHBOARD',
        'MANAGE_INVENTORY',
        'VERIFY_PRESCRIPTIONS',
        'DISPENSE_MEDICINES',
        'MANAGE_PROCUREMENT',
        'MANAGE_ORDERS',
        'VIEW_REPORTS',
        'MANAGE_STAFF',
        'MANAGE_SETTINGS',
        'VIEW_AUDIT_LOGS',
      ],
      default: ['VIEW_DASHBOARD', 'VERIFY_PRESCRIPTIONS', 'DISPENSE_MEDICINES'],
    },
    status: {
      type: String,
      enum: ['INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED'],
      default: 'INVITED',
      index: true,
    },
    pharmacistRegistrationNumber: {
      type: String,
      trim: true,
    },
    isOwner: {
      type: Boolean,
      default: false,
    },
    invitationToken: {
      type: String,
      trim: true,
      index: { sparse: true },
    },
    invitationSentAt: {
      type: Date,
    },
    invitationExpiresAt: {
      type: Date,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastActiveAt: {
      type: Date,
    },
    joinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'pharmacyStaff',
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

// Compound index to guarantee staff uniqueness per pharmacy
PharmacyStaffSchema.index({ pharmacyId: 1, email: 1 }, { unique: true });
PharmacyStaffSchema.index({ pharmacyId: 1, staffId: 1 }, { unique: true });

export const PharmacyStaffModel: Model<IPharmacyStaffDocument> =
  (mongoose.models.PharmacyStaff as Model<IPharmacyStaffDocument>) ||
  mongoose.model<IPharmacyStaffDocument>('PharmacyStaff', PharmacyStaffSchema);

export default PharmacyStaffModel;
