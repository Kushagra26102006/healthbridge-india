import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  LaboratoryTaskType,
  LaboratoryTaskStatus,
  TaskPriority,
} from '@healthbridge/shared-types';

export interface ITaskAssignmentHistorySubdocument {
  timestamp: Date;
  action: 'ASSIGNED' | 'REASSIGNED' | 'ACCEPTED' | 'STATUS_CHANGED' | 'BLOCKED' | 'UNBLOCKED' | 'COMPLETED';
  previousStaffId?: Types.ObjectId;
  newStaffId?: Types.ObjectId;
  changedBy: Types.ObjectId;
  note?: string;
}

export interface ILaboratoryTaskAssignmentDocument extends Document {
  assignmentNumber: string;
  laboratoryId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  taskType: LaboratoryTaskType;
  title: string;
  description?: string;
  relatedEntityType: string;
  relatedEntityId?: string;
  assignedStaffId: Types.ObjectId;
  assignedBy: Types.ObjectId;
  priority: TaskPriority;
  dueDate: Date;
  status: LaboratoryTaskStatus;
  blockedReason?: string;
  completionNotes?: string;
  completedAt?: Date;
  assignmentHistory: ITaskAssignmentHistorySubdocument[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskAssignmentHistorySchema = new Schema<ITaskAssignmentHistorySubdocument>(
  {
    timestamp: { type: Date, default: Date.now },
    action: {
      type: String,
      enum: [
        'ASSIGNED',
        'REASSIGNED',
        'ACCEPTED',
        'STATUS_CHANGED',
        'BLOCKED',
        'UNBLOCKED',
        'COMPLETED',
      ],
      required: true,
    },
    previousStaffId: { type: Schema.Types.ObjectId, ref: 'LaboratoryStaff' },
    newStaffId: { type: Schema.Types.ObjectId, ref: 'LaboratoryStaff' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const LaboratoryTaskAssignmentSchema = new Schema<ILaboratoryTaskAssignmentDocument>(
  {
    assignmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: [true, 'Associated laboratory profile ID is required'],
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryDepartment',
      index: true,
    },
    taskType: {
      type: String,
      enum: [
        'SAMPLE_COLLECTION',
        'SAMPLE_ACCESSIONING',
        'TEST_PROCESSING',
        'QC_RUN',
        'REPORT_REVIEW',
        'REPORT_APPROVAL',
        'INSTRUMENT_MAINTENANCE',
        'INVENTORY_ACTIVITY',
        'QUALITY_INCIDENT',
        'CAPA_ACTION',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    relatedEntityType: {
      type: String,
      required: true,
      trim: true,
    },
    relatedEntityId: {
      type: String,
      trim: true,
      index: true,
    },
    assignedStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryStaff',
      required: [true, 'Assigned staff ID is required'],
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'UNASSIGNED',
        'ASSIGNED',
        'ACCEPTED',
        'IN_PROGRESS',
        'BLOCKED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'ASSIGNED',
      index: true,
    },
    blockedReason: {
      type: String,
      trim: true,
    },
    completionNotes: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
    },
    assignmentHistory: {
      type: [TaskAssignmentHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'laboratoryTaskAssignments',
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

LaboratoryTaskAssignmentSchema.index({ laboratoryId: 1, status: 1 });
LaboratoryTaskAssignmentSchema.index({ laboratoryId: 1, assignedStaffId: 1, status: 1 });
LaboratoryTaskAssignmentSchema.index({ laboratoryId: 1, dueDate: 1 });

export const LaboratoryTaskAssignmentModel: Model<ILaboratoryTaskAssignmentDocument> =
  (mongoose.models.LaboratoryTaskAssignment as Model<ILaboratoryTaskAssignmentDocument>) ||
  mongoose.model<ILaboratoryTaskAssignmentDocument>(
    'LaboratoryTaskAssignment',
    LaboratoryTaskAssignmentSchema
  );

export default LaboratoryTaskAssignmentModel;
