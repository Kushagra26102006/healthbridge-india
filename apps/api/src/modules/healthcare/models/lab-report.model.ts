import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { LabResultInterpretation, LabTestCategory, LabReportStatus } from '@healthbridge/shared-types';

export interface ILabObservationDocument {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  interpretation: LabResultInterpretation | 'ABNORMAL' | 'CRITICAL';
  observationDate?: Date;
}

export interface ILaboratoryReportDocument extends Document {
  reportNumber: string;
  patientId: Types.ObjectId;
  laboratoryId: Types.ObjectId;
  orderId?: Types.ObjectId;
  doctorId?: Types.ObjectId;
  facilityId?: Types.ObjectId;
  testName: string;
  category: LabTestCategory;
  testDate: Date;
  publishedAt: Date;
  status: LabReportStatus;
  observations: ILabObservationDocument[];
  reportUrl: string;
  documentMimeType?: string;
  documentFileSize?: number;
  documentBuffer?: Buffer;
  verificationStatus?: string;
  clinicalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabObservationSchema = new Schema<ILabObservationDocument>(
  {
    testName: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    referenceRange: { type: String, required: true, trim: true },
    interpretation: {
      type: String,
      enum: ['NORMAL', 'ABOVE_RANGE', 'BELOW_RANGE', 'NOT_AVAILABLE', 'ABNORMAL', 'CRITICAL'],
      default: 'NORMAL',
      required: true,
    },
    observationDate: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const LaboratoryReportSchema = new Schema<ILaboratoryReportDocument>(
  {
    reportNumber: {
      type: String,
      required: [true, 'Report reference number is required'],
      unique: true,
      trim: true,
      index: true,
    },
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
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    testName: {
      type: String,
      required: [true, 'Diagnostic test name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'BLOOD_TESTS',
        'URINE_TESTS',
        'BIOCHEMISTRY',
        'HEMATOLOGY',
        'IMAGING',
        'MICROBIOLOGY',
        'OTHER',
      ],
      default: 'BIOCHEMISTRY',
      required: true,
      index: true,
    },
    testDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'PRELIMINARY', 'CANCELLED'],
      default: 'COMPLETED',
      required: true,
      index: true,
    },
    observations: {
      type: [LabObservationSchema],
      required: [true, 'Report observations are required'],
      validate: {
        validator: (obs: ILabObservationDocument[]) => obs.length > 0,
        message: 'Report must include at least one diagnostic observation',
      },
    },
    reportUrl: {
      type: String,
      required: [true, 'Diagnostic report URL/storage reference is required'],
      trim: true,
    },
    documentMimeType: {
      type: String,
      default: 'application/pdf',
      trim: true,
    },
    documentFileSize: {
      type: Number,
      default: 524288, // 512 KB
    },
    documentBuffer: {
      type: Buffer,
      select: false, // Don't return heavy buffer in standard queries
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'PRELIMINARY'],
      default: 'VERIFIED',
    },
    clinicalNotes: {
      type: String,
      trim: true,
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
        delete ret.documentBuffer;
        return ret;
      },
    },
  }
);

// Compound indexes for patient queries and filtering
LaboratoryReportSchema.index({ patientId: 1, publishedAt: -1 });
LaboratoryReportSchema.index({ patientId: 1, category: 1 });
LaboratoryReportSchema.index({ patientId: 1, status: 1 });

export const LaboratoryReportModel: Model<ILaboratoryReportDocument> =
  (mongoose.models.LaboratoryReport as Model<ILaboratoryReportDocument>) ||
  mongoose.model<ILaboratoryReportDocument>('LaboratoryReport', LaboratoryReportSchema);

export default LaboratoryReportModel;
