import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  LeaveType,
  LeaveRequestStatus,
} from '@healthbridge/shared-types';

export interface ILaboratoryLeaveRequestDocument extends Document {
  laboratoryId: Types.ObjectId;
  staffId: Types.ObjectId;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  status: LeaveRequestStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  affectedShiftCount?: number;
  affectedTaskCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratoryLeaveRequestSchema = new Schema<ILaboratoryLeaveRequestDocument>(
  {
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: [true, 'Associated laboratory profile ID is required'],
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryStaff',
      required: [true, 'Staff member ID is required'],
      index: true,
    },
    leaveType: {
      type: String,
      enum: ['ANNUAL', 'SICK', 'CASUAL', 'EMERGENCY', 'MATERNITY', 'OTHER'],
      required: true,
    },
    startDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    endDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    affectedShiftCount: {
      type: Number,
      default: 0,
    },
    affectedTaskCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'laboratoryLeaveRequests',
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

LaboratoryLeaveRequestSchema.index({ laboratoryId: 1, staffId: 1, status: 1 });
LaboratoryLeaveRequestSchema.index({ laboratoryId: 1, startDate: 1, endDate: 1 });

export const LaboratoryLeaveRequestModel: Model<ILaboratoryLeaveRequestDocument> =
  (mongoose.models.LaboratoryLeaveRequest as Model<ILaboratoryLeaveRequestDocument>) ||
  mongoose.model<ILaboratoryLeaveRequestDocument>(
    'LaboratoryLeaveRequest',
    LaboratoryLeaveRequestSchema
  );

// ============================================================================
// STAFF AVAILABILITY
// ============================================================================

export interface IWeeklyAvailabilityWindow {
  dayOfWeek: string;
  isAvailable: boolean;
  preferredShiftTemplateId?: Types.ObjectId;
  maxHours?: number;
}

export interface ICustomBlackout {
  date: string;
  reason?: string;
}

export interface ILaboratoryStaffAvailabilityDocument extends Document {
  laboratoryId: Types.ObjectId;
  staffId: Types.ObjectId;
  timezone: string;
  weeklySchedule: IWeeklyAvailabilityWindow[];
  customBlackouts: ICustomBlackout[];
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyAvailabilityWindowSchema = new Schema<IWeeklyAvailabilityWindow>(
  {
    dayOfWeek: {
      type: String,
      enum: [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ],
      required: true,
    },
    isAvailable: { type: Boolean, default: true },
    preferredShiftTemplateId: { type: Schema.Types.ObjectId, ref: 'LaboratoryShiftTemplate' },
    maxHours: { type: Number, default: 8 },
  },
  { _id: false }
);

const CustomBlackoutSchema = new Schema<ICustomBlackout>(
  {
    date: { type: String, required: true },
    reason: { type: String, trim: true },
  },
  { _id: false }
);

const LaboratoryStaffAvailabilitySchema = new Schema<ILaboratoryStaffAvailabilityDocument>(
  {
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: true,
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryStaff',
      required: true,
      unique: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    weeklySchedule: {
      type: [WeeklyAvailabilityWindowSchema],
      default: [
        { dayOfWeek: 'MONDAY', isAvailable: true, maxHours: 8 },
        { dayOfWeek: 'TUESDAY', isAvailable: true, maxHours: 8 },
        { dayOfWeek: 'WEDNESDAY', isAvailable: true, maxHours: 8 },
        { dayOfWeek: 'THURSDAY', isAvailable: true, maxHours: 8 },
        { dayOfWeek: 'FRIDAY', isAvailable: true, maxHours: 8 },
        { dayOfWeek: 'SATURDAY', isAvailable: true, maxHours: 4 },
        { dayOfWeek: 'SUNDAY', isAvailable: false, maxHours: 0 },
      ],
    },
    customBlackouts: {
      type: [CustomBlackoutSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'laboratoryStaffAvailability',
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

export const LaboratoryStaffAvailabilityModel: Model<ILaboratoryStaffAvailabilityDocument> =
  (mongoose.models.LaboratoryStaffAvailability as Model<ILaboratoryStaffAvailabilityDocument>) ||
  mongoose.model<ILaboratoryStaffAvailabilityDocument>(
    'LaboratoryStaffAvailability',
    LaboratoryStaffAvailabilitySchema
  );
