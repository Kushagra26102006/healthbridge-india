import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { IncidentCategory, IncidentSeverity, IncidentStatus } from '@healthbridge/shared-types';

export interface IQualityIncidentDocument extends Document {
  incidentReference: string;
  laboratoryId: Types.ObjectId;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  relatedTestCode?: string;
  relatedInstrumentId?: Types.ObjectId;
  relatedInstrumentName?: string;
  relatedReagentLotId?: Types.ObjectId;
  relatedReagentLotNumber?: string;
  relatedQCRunId?: Types.ObjectId;
  affectedOrderIds: Types.ObjectId[];
  affectedReportIds: Types.ObjectId[];
  reportedById: Types.ObjectId;
  reportedByName: string;
  assignedInvestigatorId?: Types.ObjectId;
  assignedInvestigatorName?: string;
  investigationNotes?: string;
  rootCauseCategory?: string;
  rootCauseAnalysis?: string;
  status: IncidentStatus;
  resolvedById?: Types.ObjectId;
  resolvedByName?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  closedById?: Types.ObjectId;
  closedByName?: string;
  closedAt?: Date;
  capaId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QualityIncidentSchema = new Schema<IQualityIncidentDocument>(
  {
    incidentReference: { type: String, required: true, unique: true, index: true },
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    category: {
      type: String,
      enum: [
        'QC_FAILURE',
        'INSTRUMENT_FAILURE',
        'CALIBRATION_FAILURE',
        'REAGENT_ISSUE',
        'SPECIMEN_ISSUE',
        'PRE_ANALYTICAL',
        'POST_ANALYTICAL',
        'GENERAL',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      default: 'MEDIUM',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    relatedTestCode: { type: String, uppercase: true, trim: true, index: true },
    relatedInstrumentId: { type: Schema.Types.ObjectId, ref: 'LabInstrument', index: true },
    relatedInstrumentName: { type: String, trim: true },
    relatedReagentLotId: { type: Schema.Types.ObjectId, ref: 'ReagentLot', index: true },
    relatedReagentLotNumber: { type: String, trim: true },
    relatedQCRunId: { type: Schema.Types.ObjectId, ref: 'QCRun', index: true },
    affectedOrderIds: [{ type: Schema.Types.ObjectId, ref: 'LabOrder' }],
    affectedReportIds: [{ type: Schema.Types.ObjectId, ref: 'LabReport' }],
    reportedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedByName: { type: String, required: true, trim: true },
    assignedInvestigatorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedInvestigatorName: { type: String, trim: true },
    investigationNotes: { type: String, trim: true },
    rootCauseCategory: { type: String, trim: true },
    rootCauseAnalysis: { type: String, trim: true },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_INVESTIGATION', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED'],
      required: true,
      default: 'OPEN',
      index: true,
    },
    resolvedById: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedByName: { type: String, trim: true },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String, trim: true },
    closedById: { type: Schema.Types.ObjectId, ref: 'User' },
    closedByName: { type: String, trim: true },
    closedAt: { type: Date },
    capaId: { type: Schema.Types.ObjectId, ref: 'CAPA' },
  },
  {
    timestamps: true,
  }
);

QualityIncidentSchema.index({ laboratoryId: 1, status: 1, createdAt: -1 });
QualityIncidentSchema.index({ laboratoryId: 1, severity: 1 });
QualityIncidentSchema.index({ laboratoryId: 1, relatedTestCode: 1 });

export const QualityIncidentModel: Model<IQualityIncidentDocument> =
  mongoose.models.QualityIncident ||
  mongoose.model<IQualityIncidentDocument>('QualityIncident', QualityIncidentSchema);
