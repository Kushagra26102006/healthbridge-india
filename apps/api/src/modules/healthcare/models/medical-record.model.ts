import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { HEALTH_RECORD_TYPES } from '@healthbridge/config';
import { MedicalRecordType, MedicalRecordSource } from '@healthbridge/shared-types';

export interface IMedicalRecordDocument extends Document {
  patientId: Types.ObjectId;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  source: MedicalRecordSource;
  resourceReference?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecordDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required for medical record'],
      index: true,
    },
    recordType: {
      type: String,
      enum: {
        values: HEALTH_RECORD_TYPES,
        message: '{VALUE} is not a supported health record type',
      },
      required: [true, 'Medical record type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Medical record title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    source: {
      type: String,
      enum: ['MANUAL_ENTRY', 'ABDM_INGESTION', 'EHR_SYNC'],
      default: 'MANUAL_ENTRY',
      index: true,
    },
    resourceReference: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'medicalRecords',
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

// High performance index for patient timeline lookups
MedicalRecordSchema.index({ patientId: 1, recordType: 1, createdAt: -1 });

export const MedicalRecordModel: Model<IMedicalRecordDocument> =
  (mongoose.models.MedicalRecord as Model<IMedicalRecordDocument>) ||
  mongoose.model<IMedicalRecordDocument>('MedicalRecord', MedicalRecordSchema);

export default MedicalRecordModel;
