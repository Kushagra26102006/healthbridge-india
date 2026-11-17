import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  ShiftAssignmentStatus,
  ShiftSwapStatus,
} from '@healthbridge/shared-types';

export interface ILaboratoryShiftTemplateDocument extends Document {
  laboratoryId: Types.ObjectId;
  name: string;
  code: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakMinutes: number;
  isOvernight: boolean;
  color?: string;
  applicableDepartmentIds?: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratoryShiftTemplateSchema = new Schema<ILaboratoryShiftTemplateDocument>(
  {
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: [true, 'Associated laboratory profile ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Shift template name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Shift template code is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    breakMinutes: {
      type: Number,
      default: 30,
    },
    isOvernight: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      trim: true,
    },
    applicableDepartmentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'LaboratoryDepartment',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'laboratoryShiftTemplates',
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

LaboratoryShiftTemplateSchema.index({ laboratoryId: 1, code: 1 }, { unique: true });

export const LaboratoryShiftTemplateModel: Model<ILaboratoryShiftTemplateDocument> =
  (mongoose.models.LaboratoryShiftTemplate as Model<ILaboratoryShiftTemplateDocument>) ||
  mongoose.model<ILaboratoryShiftTemplateDocument>(
    'LaboratoryShiftTemplate',
    LaboratoryShiftTemplateSchema
  );

// ============================================================================
// SHIFT ASSIGNMENT
// ============================================================================

export interface IShiftSwapDetailsSubdocument {
  requestedWithStaffId: Types.ObjectId;
  reason?: string;
  requestedAt: Date;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  status: ShiftSwapStatus;
  rejectionReason?: string;
}

export interface ILaboratoryShiftAssignmentDocument extends Document {
  laboratoryId: Types.ObjectId;
  staffId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  shiftTemplateId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  status: ShiftAssignmentStatus;
  swapDetails?: IShiftSwapDetailsSubdocument;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSwapDetailsSchema = new Schema<IShiftSwapDetailsSubdocument>(
  {
    requestedWithStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryStaff',
      required: true,
    },
    reason: { type: String, trim: true },
    requestedAt: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String, trim: true },
  },
  { _id: false }
);

const LaboratoryShiftAssignmentSchema = new Schema<ILaboratoryShiftAssignmentDocument>(
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
      required: [true, 'Assigned staff member ID is required'],
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryDepartment',
      index: true,
    },
    shiftTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryShiftTemplate',
      required: [true, 'Shift template ID is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Shift date is required (YYYY-MM-DD)'],
      trim: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    isOvernight: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        'SCHEDULED',
        'CONFIRMED',
        'SWAP_REQUESTED',
        'SWAPPED',
        'COMPLETED',
        'ABSENT',
        'CANCELLED',
      ],
      default: 'SCHEDULED',
      index: true,
    },
    swapDetails: {
      type: ShiftSwapDetailsSchema,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'laboratoryShiftAssignments',
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

LaboratoryShiftAssignmentSchema.index({ laboratoryId: 1, staffId: 1, date: 1 });
LaboratoryShiftAssignmentSchema.index({ laboratoryId: 1, date: 1, status: 1 });

export const LaboratoryShiftAssignmentModel: Model<ILaboratoryShiftAssignmentDocument> =
  (mongoose.models.LaboratoryShiftAssignment as Model<ILaboratoryShiftAssignmentDocument>) ||
  mongoose.model<ILaboratoryShiftAssignmentDocument>(
    'LaboratoryShiftAssignment',
    LaboratoryShiftAssignmentSchema
  );
