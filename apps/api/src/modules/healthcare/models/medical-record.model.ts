import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { HEALTH_RECORD_TYPES } from '@healthbridge/config';
import {
  MedicalRecordType,
  MedicalRecordSource,
  RecordVerificationStatus,
  DocumentMalwareScanStatus,
} from '@healthbridge/shared-types';

export interface IMedicalRecordDocument extends Document {
  patientId: Types.ObjectId;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  source: MedicalRecordSource;
  resourceReference?: string;
  recordDate: Date;
  doctorName?: string;
  doctorId?: Types.ObjectId;
  facilityName?: string;
  facilityId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  fileData?: string;
  storageId?: string;
  sha256Checksum?: string;
  scanStatus?: DocumentMalwareScanStatus;
  isArchived?: boolean;
  archivedAt?: Date;
  archivedBy?: Types.ObjectId;
  verificationStatus: RecordVerificationStatus;
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
    recordDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    doctorName: {
      type: String,
      trim: true,
      maxlength: [200, 'Doctor name cannot exceed 200 characters'],
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    facilityName: {
      type: String,
      trim: true,
      maxlength: [200, 'Facility name cannot exceed 200 characters'],
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    mimeType: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    fileData: {
      type: String,
    },
    storageId: {
      type: String,
      trim: true,
      index: true,
    },
    sha256Checksum: {
      type: String,
      trim: true,
      index: true,
    },
    scanStatus: {
      type: String,
      enum: ['CLEAN', 'INFECTED', 'SCAN_NOT_CONFIGURED'],
      default: 'SCAN_NOT_CONFIGURED',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'SELF_SUBMITTED'],
      default: 'VERIFIED',
      index: true,
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

// High performance compound indexes for patient timeline, duplicate detection, and filter queries
MedicalRecordSchema.index({ patientId: 1, recordType: 1, recordDate: -1 });
MedicalRecordSchema.index({ patientId: 1, recordDate: -1 });
MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
MedicalRecordSchema.index({ patientId: 1, verificationStatus: 1 });
MedicalRecordSchema.index({ patientId: 1, source: 1 });
MedicalRecordSchema.index({ patientId: 1, isArchived: 1, recordDate: -1 });
MedicalRecordSchema.index({ patientId: 1, sha256Checksum: 1, isArchived: 1 });

export const MedicalRecordModel: Model<IMedicalRecordDocument> =
  (mongoose.models.MedicalRecord as Model<IMedicalRecordDocument>) ||
  mongoose.model<IMedicalRecordDocument>('MedicalRecord', MedicalRecordSchema);

export default MedicalRecordModel;
