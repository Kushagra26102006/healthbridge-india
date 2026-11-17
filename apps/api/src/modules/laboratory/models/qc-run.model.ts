import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { QCRunStatus } from '@healthbridge/shared-types';

export interface IQCRunRuleEvaluation {
  ruleName: string;
  passed: boolean;
  explanation: string;
  deviation?: number;
  deviationPercentage?: number;
}

export interface IQCRunDocument extends Document {
  laboratoryId: Types.ObjectId;
  qcProfileId: Types.ObjectId;
  qcProfileName: string;
  profileVersion: number;
  testCode: string;
  instrumentId?: Types.ObjectId;
  instrumentName?: string;
  controlMaterial: string;
  controlLotNumber: string;
  reagentLotId?: Types.ObjectId;
  reagentLotNumber?: string;
  runIdentifier: string;
  measuredNumericValue?: number;
  measuredQualitativeValue?: string;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  qualitativeExpected?: string;
  unit?: string;
  qcStatus: QCRunStatus;
  ruleEvaluation: IQCRunRuleEvaluation;
  operatorId: Types.ObjectId;
  operatorName: string;
  runDate: Date;
  comments?: string;
  incidentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QCRunRuleEvaluationSchema = new Schema<IQCRunRuleEvaluation>(
  {
    ruleName: { type: String, required: true },
    passed: { type: Boolean, required: true },
    explanation: { type: String, required: true },
    deviation: { type: Number },
    deviationPercentage: { type: Number },
  },
  { _id: false }
);

const QCRunSchema = new Schema<IQCRunDocument>(
  {
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    qcProfileId: { type: Schema.Types.ObjectId, ref: 'QCProfile', required: true, index: true },
    qcProfileName: { type: String, required: true, trim: true },
    profileVersion: { type: Number, required: true, default: 1 },
    testCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    instrumentId: { type: Schema.Types.ObjectId, ref: 'LabInstrument', index: true },
    instrumentName: { type: String, trim: true },
    controlMaterial: { type: String, required: true, trim: true },
    controlLotNumber: { type: String, required: true, trim: true, index: true },
    reagentLotId: { type: Schema.Types.ObjectId, ref: 'ReagentLot', index: true },
    reagentLotNumber: { type: String, trim: true },
    runIdentifier: { type: String, required: true, unique: true, index: true },
    measuredNumericValue: { type: Number },
    measuredQualitativeValue: { type: String, trim: true },
    targetValue: { type: Number },
    acceptableMin: { type: Number },
    acceptableMax: { type: Number },
    qualitativeExpected: { type: String, trim: true },
    unit: { type: String, trim: true },
    qcStatus: {
      type: String,
      enum: ['PENDING', 'PASSED', 'FAILED', 'INVALIDATED', 'UNDER_INVESTIGATION'],
      required: true,
      default: 'PENDING',
      index: true,
    },
    ruleEvaluation: { type: QCRunRuleEvaluationSchema, required: true },
    operatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    operatorName: { type: String, required: true, trim: true },
    runDate: { type: Date, required: true, default: Date.now, index: true },
    comments: { type: String, trim: true },
    incidentId: { type: Schema.Types.ObjectId, ref: 'QualityIncident', index: true },
  },
  {
    timestamps: true,
  }
);

QCRunSchema.index({ laboratoryId: 1, testCode: 1, runDate: -1 });
QCRunSchema.index({ laboratoryId: 1, qcStatus: 1, runDate: -1 });
QCRunSchema.index({ laboratoryId: 1, instrumentId: 1, runDate: -1 });

export const QCRunModel: Model<IQCRunDocument> =
  mongoose.models.QCRun || mongoose.model<IQCRunDocument>('QCRun', QCRunSchema);
