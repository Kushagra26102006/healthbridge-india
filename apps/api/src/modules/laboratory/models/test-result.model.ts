/**
 * HealthBridge India — Test Result Database Model
 * Conforms to structured laboratory result entry, abnormal/critical flags,
 * and immutable pre-analytical observations.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  ParameterDataType,
  ResultFlag,
  TestResultStatus,
} from '@healthbridge/shared-types';

export interface IParameterResultEntry {
  parameterId?: string;
  parameterCode: string;
  parameterName: string;
  dataType: ParameterDataType;
  numericValue?: number;
  textValue?: string;
  booleanValue?: boolean;
  qualitativeValue?: string;
  unit?: string;
  referenceRangeSnapshot?: {
    gender?: string;
    ageMinYears?: number;
    ageMaxYears?: number;
    normalMin?: number;
    normalMax?: number;
    criticalLow?: number;
    criticalHigh?: number;
    unit: string;
    textualInterpretation?: string;
  };
  flag: ResultFlag;
  isAbnormal: boolean;
  isCritical: boolean;
  notes?: string;
}

export interface ITestResultDocument extends Document {
  laboratoryId: Types.ObjectId;
  orderId: Types.ObjectId;
  orderNumber: string;
  sampleId: Types.ObjectId;
  sampleNumber: string;
  testId?: Types.ObjectId;
  testCode: string;
  testName: string;
  parameters: IParameterResultEntry[];
  overallFlag: ResultFlag;
  hasAbnormalResults: boolean;
  hasCriticalResults: boolean;
  status: TestResultStatus;
  enteredById: Types.ObjectId;
  enteredByName?: string;
  enteredAt: Date;
  updatedById?: Types.ObjectId;
  updatedByName?: string;
  updatedAt: Date;
  processingNotes?: {
    actorName: string;
    timestamp: Date;
    note: string;
    category?: string;
  }[];
  createdAt: Date;
}

const ParameterResultEntrySchema = new Schema<IParameterResultEntry>(
  {
    parameterId: { type: String, trim: true },
    parameterCode: { type: String, required: true, trim: true, uppercase: true },
    parameterName: { type: String, required: true, trim: true },
    dataType: {
      type: String,
      enum: ['NUMERIC', 'TEXT', 'BOOLEAN', 'QUALITATIVE', 'DATE'],
      required: true,
      default: 'NUMERIC',
    },
    numericValue: { type: Number },
    textValue: { type: String, trim: true },
    booleanValue: { type: Boolean },
    qualitativeValue: { type: String, trim: true },
    unit: { type: String, trim: true },
    referenceRangeSnapshot: {
      gender: { type: String },
      ageMinYears: { type: Number },
      ageMaxYears: { type: Number },
      normalMin: { type: Number },
      normalMax: { type: Number },
      criticalLow: { type: Number },
      criticalHigh: { type: Number },
      unit: { type: String },
      textualInterpretation: { type: String },
    },
    flag: {
      type: String,
      enum: ['NORMAL', 'LOW', 'HIGH', 'ABNORMAL', 'CRITICAL', 'NOT_APPLICABLE', 'UNVERIFIED'],
      default: 'NORMAL',
      required: true,
    },
    isAbnormal: { type: Boolean, default: false },
    isCritical: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const TestResultSchema = new Schema<ITestResultDocument>(
  {
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Laboratory ID reference is required'],
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryOrder',
      required: [true, 'Laboratory Order ID reference is required'],
      index: true,
    },
    orderNumber: {
      type: String,
      required: [true, 'Order number reference is required'],
      trim: true,
      index: true,
    },
    sampleId: {
      type: Schema.Types.ObjectId,
      ref: 'LabSample',
      required: [true, 'Lab Sample ID reference is required'],
      index: true,
    },
    sampleNumber: {
      type: String,
      required: [true, 'Sample number reference is required'],
      trim: true,
      index: true,
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'LabTest',
    },
    testCode: {
      type: String,
      required: [true, 'Diagnostic test code is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    testName: {
      type: String,
      required: [true, 'Diagnostic test name is required'],
      trim: true,
    },
    parameters: {
      type: [ParameterResultEntrySchema],
      default: [],
    },
    overallFlag: {
      type: String,
      enum: ['NORMAL', 'LOW', 'HIGH', 'ABNORMAL', 'CRITICAL', 'NOT_APPLICABLE', 'UNVERIFIED'],
      default: 'NORMAL',
      required: true,
    },
    hasAbnormalResults: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasCriticalResults: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'IN_PROGRESS',
        'DRAFT',
        'SUBMITTED_FOR_REVIEW',
        'ON_HOLD',
        'REJECTED',
        'APPROVED',
      ],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    enteredById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enteredByName: {
      type: String,
      trim: true,
    },
    enteredAt: {
      type: Date,
      default: Date.now,
    },
    updatedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedByName: {
      type: String,
      trim: true,
    },
    processingNotes: [
      {
        actorName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, required: true },
        category: { type: String, default: 'GENERAL' },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'testResults',
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

// Compound unique index ensuring one result record per test per order
TestResultSchema.index({ laboratoryId: 1, orderId: 1, testCode: 1 }, { unique: true });
TestResultSchema.index({ sampleId: 1 });

export const TestResultModel: Model<ITestResultDocument> =
  (mongoose.models.TestResult as Model<ITestResultDocument>) ||
  mongoose.model<ITestResultDocument>('TestResult', TestResultSchema);

export default TestResultModel;
