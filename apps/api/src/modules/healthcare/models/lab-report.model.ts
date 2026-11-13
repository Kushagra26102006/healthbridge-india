import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { LabObservation } from '@healthbridge/shared-types';

export interface ILaboratoryReportDocument extends Document {
  patientId: Types.ObjectId;
  laboratoryId: Types.ObjectId;
  orderId: Types.ObjectId;
  observations: LabObservation[];
  reportUrl: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LabObservationSchema = new Schema<LabObservation>(
  {
    testName: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    referenceRange: { type: String, required: true, trim: true },
    interpretation: {
      type: String,
      enum: ['NORMAL', 'ABNORMAL', 'CRITICAL'],
      default: 'NORMAL',
      required: true,
    },
  },
  { _id: false }
);

const LaboratoryReportSchema = new Schema<ILaboratoryReportDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Laboratory ID reference is required'],
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryOrder',
      required: [true, 'Associated laboratory order ID is required'],
      index: true,
    },
    observations: {
      type: [LabObservationSchema],
      required: [true, 'Report observations are required'],
      validate: {
        validator: (obs: LabObservation[]) => obs.length > 0,
        message: 'Report must include at least one diagnostic observation',
      },
    },
    reportUrl: {
      type: String,
      required: [true, 'Diagnostic report URL/storage reference is required'],
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'labReports',
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

LaboratoryReportSchema.index({ patientId: 1, publishedAt: -1 });

export const LaboratoryReportModel: Model<ILaboratoryReportDocument> =
  (mongoose.models.LaboratoryReport as Model<ILaboratoryReportDocument>) ||
  mongoose.model<ILaboratoryReportDocument>('LaboratoryReport', LaboratoryReportSchema);

export default LaboratoryReportModel;
