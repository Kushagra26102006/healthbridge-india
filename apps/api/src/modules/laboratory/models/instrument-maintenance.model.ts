import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { MaintenanceType } from '@healthbridge/shared-types';

export interface IInstrumentMaintenanceDocument extends Document {
  maintenanceReference: string;
  instrumentId: Types.ObjectId;
  instrumentName: string;
  laboratoryId: Types.ObjectId;
  maintenanceType: MaintenanceType;
  workDescription: string;
  scheduledDate: Date;
  completedDate?: Date;
  technicianName?: string;
  serviceProvider?: string;
  maintenanceNotes?: string;
  downtimeHours?: number;
  partsReplaced: string[];
  nextScheduledDate?: Date;
  cost?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedById?: Types.ObjectId;
  completedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstrumentMaintenanceSchema = new Schema<IInstrumentMaintenanceDocument>(
  {
    maintenanceReference: { type: String, required: true, unique: true, index: true },
    instrumentId: { type: Schema.Types.ObjectId, ref: 'LabInstrument', required: true, index: true },
    instrumentName: { type: String, required: true, trim: true },
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    maintenanceType: {
      type: String,
      enum: ['PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN'],
      required: true,
      default: 'PREVENTIVE',
    },
    workDescription: { type: String, required: true, trim: true },
    scheduledDate: { type: Date, required: true, index: true },
    completedDate: { type: Date },
    technicianName: { type: String, trim: true },
    serviceProvider: { type: String, trim: true },
    maintenanceNotes: { type: String, trim: true },
    downtimeHours: { type: Number, min: 0 },
    partsReplaced: [{ type: String, trim: true }],
    nextScheduledDate: { type: Date, index: true },
    cost: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      required: true,
      default: 'SCHEDULED',
      index: true,
    },
    completedById: { type: Schema.Types.ObjectId, ref: 'User' },
    completedByName: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

InstrumentMaintenanceSchema.index({ laboratoryId: 1, instrumentId: 1, scheduledDate: -1 });
InstrumentMaintenanceSchema.index({ laboratoryId: 1, status: 1 });

export const InstrumentMaintenanceModel: Model<IInstrumentMaintenanceDocument> =
  mongoose.models.InstrumentMaintenance ||
  mongoose.model<IInstrumentMaintenanceDocument>('InstrumentMaintenance', InstrumentMaintenanceSchema);
