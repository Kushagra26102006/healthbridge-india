import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { CalibrationStatus } from '@healthbridge/shared-types';

export interface ICalibrationParameter {
  parameter: string;
  expectedValue: string;
  measuredValue: string;
  tolerance: string;
  passed: boolean;
}

export interface IInstrumentCalibrationDocument extends Document {
  calibrationReference: string;
  instrumentId: Types.ObjectId;
  instrumentName: string;
  laboratoryId: Types.ObjectId;
  calibrationType: 'ROUTINE' | 'POST_REPAIR' | 'INITIAL' | 'VERIFICATION';
  scheduledDate: Date;
  performedDate?: Date;
  dueDate: Date;
  performedById?: Types.ObjectId;
  performedByName?: string;
  verifierId?: Types.ObjectId;
  verifierName?: string;
  calibrationResult?: 'PASSED' | 'FAILED';
  status: CalibrationStatus;
  standardsUsed?: string;
  parametersChecked: ICalibrationParameter[];
  certificateNumber?: string;
  certificateUrl?: string;
  notes?: string;
  clearedById?: Types.ObjectId;
  clearedByName?: string;
  clearedAt?: Date;
  clearanceNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalibrationParameterSchema = new Schema<ICalibrationParameter>(
  {
    parameter: { type: String, required: true, trim: true },
    expectedValue: { type: String, required: true, trim: true },
    measuredValue: { type: String, required: true, trim: true },
    tolerance: { type: String, required: true, trim: true },
    passed: { type: Boolean, required: true },
  },
  { _id: false }
);

const InstrumentCalibrationSchema = new Schema<IInstrumentCalibrationDocument>(
  {
    calibrationReference: { type: String, required: true, unique: true, index: true },
    instrumentId: { type: Schema.Types.ObjectId, ref: 'LabInstrument', required: true, index: true },
    instrumentName: { type: String, required: true, trim: true },
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    calibrationType: {
      type: String,
      enum: ['ROUTINE', 'POST_REPAIR', 'INITIAL', 'VERIFICATION'],
      required: true,
      default: 'ROUTINE',
    },
    scheduledDate: { type: Date, required: true },
    performedDate: { type: Date },
    dueDate: { type: Date, required: true, index: true },
    performedById: { type: Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String, trim: true },
    verifierId: { type: Schema.Types.ObjectId, ref: 'User' },
    verifierName: { type: String, trim: true },
    calibrationResult: {
      type: String,
      enum: ['PASSED', 'FAILED'],
      index: true,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'PASSED', 'FAILED', 'OVERDUE'],
      required: true,
      default: 'SCHEDULED',
      index: true,
    },
    standardsUsed: { type: String, trim: true },
    parametersChecked: [CalibrationParameterSchema],
    certificateNumber: { type: String, trim: true },
    certificateUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
    clearedById: { type: Schema.Types.ObjectId, ref: 'User' },
    clearedByName: { type: String, trim: true },
    clearedAt: { type: Date },
    clearanceNotes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

InstrumentCalibrationSchema.index({ laboratoryId: 1, instrumentId: 1, dueDate: -1 });
InstrumentCalibrationSchema.index({ laboratoryId: 1, status: 1 });

export const InstrumentCalibrationModel: Model<IInstrumentCalibrationDocument> =
  mongoose.models.InstrumentCalibration ||
  mongoose.model<IInstrumentCalibrationDocument>('InstrumentCalibration', InstrumentCalibrationSchema);
