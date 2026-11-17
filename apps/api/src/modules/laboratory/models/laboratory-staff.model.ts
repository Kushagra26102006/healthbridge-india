import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  LaboratoryStaffRole,
  LaboratoryPermission,
  LaboratoryStaffStatus,
} from '@healthbridge/shared-types';

export interface ILaboratoryStaffDocument extends Document {
  laboratoryId: Types.ObjectId;
  userId?: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  employeeId: string;
  designation: string;
  departmentId?: Types.ObjectId;
  role: LaboratoryStaffRole;
  permissions: LaboratoryPermission[];
  allowedPermissions: LaboratoryPermission[];
  deniedPermissions: LaboratoryPermission[];
  status: LaboratoryStaffStatus;
  isPrimaryOwner: boolean;
  invitationTokenHash?: string;
  invitationSentAt?: Date;
  invitationExpiresAt?: Date;
  invitedBy?: Types.ObjectId;
  invitationAcceptedAt?: Date;
  lastActiveAt?: Date;
  profilePhotoUrl?: string;
  qualifications?: string[];
  licenseNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratoryStaffSchema = new Schema<ILaboratoryStaffDocument>(
  {
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: [true, 'Associated laboratory profile ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: { sparse: true },
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
    employeeId: {
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
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryDepartment',
      index: true,
    },
    role: {
      type: String,
      enum: [
        'LAB_ADMIN',
        'LAB_MANAGER',
        'LAB_SUPERVISOR',
        'LAB_TECHNICIAN',
        'LAB_REVIEWER',
        'LAB_PATHOLOGIST',
        'LAB_INVENTORY_MANAGER',
        'LAB_QUALITY_MANAGER',
      ],
      default: 'LAB_TECHNICIAN',
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    allowedPermissions: {
      type: [String],
      default: [],
    },
    deniedPermissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        'INVITED',
        'PENDING_ACCEPTANCE',
        'ACTIVE',
        'SUSPENDED',
        'DEACTIVATED',
        'EXPIRED',
      ],
      default: 'INVITED',
      index: true,
    },
    isPrimaryOwner: {
      type: Boolean,
      default: false,
    },
    invitationTokenHash: {
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
    invitationAcceptedAt: {
      type: Date,
    },
    lastActiveAt: {
      type: Date,
    },
    profilePhotoUrl: {
      type: String,
      trim: true,
    },
    qualifications: {
      type: [String],
      default: [],
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'laboratoryStaff',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        delete ret.invitationTokenHash;
        return ret;
      },
    },
  }
);

// Compound indexes
LaboratoryStaffSchema.index({ laboratoryId: 1, email: 1 }, { unique: true });
LaboratoryStaffSchema.index({ laboratoryId: 1, employeeId: 1 }, { unique: true });

export const LaboratoryStaffModel: Model<ILaboratoryStaffDocument> =
  (mongoose.models.LaboratoryStaff as Model<ILaboratoryStaffDocument>) ||
  mongoose.model<ILaboratoryStaffDocument>('LaboratoryStaff', LaboratoryStaffSchema);

export default LaboratoryStaffModel;
