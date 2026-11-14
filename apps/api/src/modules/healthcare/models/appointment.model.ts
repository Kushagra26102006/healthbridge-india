import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { AppointmentStatus, ConsultationType } from '@healthbridge/shared-types';

export interface IAppointmentDocument extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  scheduledAt: Date;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
  reason: string;
  notes?: string;
  status: AppointmentStatus;
  cancellationReason?: string;
  rejectionReason?: string;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  confirmedBy?: Types.ObjectId;
  checkedInAt?: Date;
  consultationStartedAt?: Date;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
  queueNumber?: number;
  encounterId?: Types.ObjectId;
  rescheduledFrom?: Date;
  rescheduledAt?: Date;
  rescheduleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID reference is required'],
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Appointment schedule time is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time slot is required'],
      trim: true,
      default: '09:00',
    },
    endTime: {
      type: String,
      required: [true, 'End time slot is required'],
      trim: true,
      default: '09:30',
    },
    consultationType: {
      type: String,
      enum: ['IN_PERSON', 'TELECONSULTATION'],
      default: 'IN_PERSON',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Appointment consultation reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'SCHEDULED',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
      ],
      default: 'CONFIRMED',
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    checkedInAt: {
      type: Date,
    },
    consultationStartedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    queueNumber: {
      type: Number,
      index: true,
    },
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: 'Encounter',
      index: true,
    },
    rescheduledFrom: {
      type: Date,
    },
    rescheduledAt: {
      type: Date,
    },
    rescheduleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'appointments',
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

// CRITICAL CONCURRENCY GUARD: Partial unique index to strictly prevent double-booking active slots
AppointmentSchema.index(
  { doctorId: 1, scheduledAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
    },
  }
);

// High-performance patient & doctor query indexes
AppointmentSchema.index({ patientId: 1, scheduledAt: -1 });
AppointmentSchema.index({ patientId: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, scheduledAt: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, queueNumber: 1 });
AppointmentSchema.index({ doctorId: 1, patientId: 1 });

export const AppointmentModel: Model<IAppointmentDocument> =
  (mongoose.models.Appointment as Model<IAppointmentDocument>) ||
  mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);

export default AppointmentModel;
