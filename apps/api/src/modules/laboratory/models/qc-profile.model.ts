import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { QCDataType } from '@healthbridge/shared-types';

export interface IQCProfileVersion {
  version: number;
  effectiveDate: Date;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  qualitativeExpected?: string;
  unit?: string;
  notes?: string;
  createdById: Types.ObjectId;
  createdAt: Date;
}

export interface IQCProfileDocument extends Document {
  laboratoryId: Types.ObjectId;
  profileName: string;
  testCode: string;
  testName: string;
  parameterName: string;
  controlMaterial: string;
  controlLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'NORMAL' | 'ABNORMAL_LOW' | 'ABNORMAL_HIGH';
  dataType: QCDataType;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  qualitativeExpected?: string;
  unit?: string;
  applicableInstrumentId?: Types.ObjectId;
  applicableInstrumentName?: string;
  reagentLotRequirements?: string;
  runFrequency: 'DAILY' | 'EACH_SHIFT' | 'PER_BATCH' | 'WEEKLY' | 'MONTHLY';
  version: number;
  effectiveDate: Date;
  isActive: boolean;
  versions: IQCProfileVersion[];
  createdById: Types.ObjectId;
  updatedById?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QCProfileVersionSchema = new Schema<IQCProfileVersion>(
  {
    version: { type: Number, required: true },
    effectiveDate: { type: Date, required: true },
    targetValue: { type: Number },
    acceptableMin: { type: Number },
    acceptableMax: { type: Number },
    qualitativeExpected: { type: String, trim: true },
    unit: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QCProfileSchema = new Schema<IQCProfileDocument>(
  {
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    profileName: { type: String, required: true, trim: true },
    testCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    testName: { type: String, required: true, trim: true },
    parameterName: { type: String, required: true, trim: true },
    controlMaterial: { type: String, required: true, trim: true },
    controlLevel: {
      type: String,
      enum: ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'NORMAL', 'ABNORMAL_LOW', 'ABNORMAL_HIGH'],
      required: true,
      default: 'NORMAL',
    },
    dataType: {
      type: String,
      enum: ['NUMERIC', 'QUALITATIVE', 'BOOLEAN'],
      required: true,
      default: 'NUMERIC',
    },
    targetValue: { type: Number },
    acceptableMin: { type: Number },
    acceptableMax: { type: Number },
    qualitativeExpected: { type: String, trim: true },
    unit: { type: String, trim: true },
    applicableInstrumentId: { type: Schema.Types.ObjectId, ref: 'LabInstrument', index: true },
    applicableInstrumentName: { type: String, trim: true },
    reagentLotRequirements: { type: String, trim: true },
    runFrequency: {
      type: String,
      enum: ['DAILY', 'EACH_SHIFT', 'PER_BATCH', 'WEEKLY', 'MONTHLY'],
      required: true,
      default: 'DAILY',
    },
    version: { type: Number, required: true, default: 1 },
    effectiveDate: { type: Date, required: true, default: Date.now },
    isActive: { type: Boolean, required: true, default: true, index: true },
    versions: [QCProfileVersionSchema],
    createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

QCProfileSchema.index({ laboratoryId: 1, testCode: 1, isActive: 1 });
QCProfileSchema.index({ laboratoryId: 1, profileName: 1 });

export const QCProfileModel: Model<IQCProfileDocument> =
  mongoose.models.QCProfile || mongoose.model<IQCProfileDocument>('QCProfile', QCProfileSchema);
