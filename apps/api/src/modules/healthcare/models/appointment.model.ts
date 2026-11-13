import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { AppointmentStatus } from '@healthbridge/shared-types';

export interface IAppointmentDocument extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  scheduledAt: Date;
  reason: string;
  status: AppointmentStatus;
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
    reason: {
      type: String,
      required: [true, 'Appointment consultation reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'REQUESTED',
      index: true,
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

// Conflict detection and scheduling performance indexes
AppointmentSchema.index({ doctorId: 1, scheduledAt: 1, status: 1 });
AppointmentSchema.index({ patientId: 1, scheduledAt: 1 });

export const AppointmentModel: Model<IAppointmentDocument> =
  (mongoose.models.Appointment as Model<IAppointmentDocument>) ||
  mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);

export default AppointmentModel;
