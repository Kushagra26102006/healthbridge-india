import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { InstrumentCategory, InstrumentOperatingStatus } from '@healthbridge/shared-types';

export interface ILabInstrumentDocument extends Omit<Document, 'model'> {
  laboratoryId: Types.ObjectId;
  instrumentIdentifier: string;
  instrumentName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  category: InstrumentCategory;
  department?: string;
  associatedTestCodes: string[];
  operatingStatus: InstrumentOperatingStatus;
  statusReason?: string;
  installationDate: Date;
  warrantyExpiryDate?: Date;
  lastCalibrationDate?: Date;
  nextCalibrationDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  calibrationStatus: 'PASSED' | 'FAILED' | 'PENDING' | 'OVERDUE';
  maintenanceProvider?: string;
  supportingDocuments: {
    title: string;
    documentUrl: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const LabInstrumentSchema = new Schema<ILabInstrumentDocument>(
  {
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    instrumentIdentifier: { type: String, required: true, trim: true, uppercase: true },
    instrumentName: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    serialNumber: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'ANALYZER',
        'CENTRIFUGE',
        'MICROSCOPE',
        'INCUBATOR',
        'REFRIGERATOR',
        'SPECTROPHOTOMETER',
        'PCR_MACHINE',
        'ELECTROPHORESIS',
        'OTHER',
      ],
      required: true,
      default: 'ANALYZER',
    },
    department: { type: String, trim: true },
    associatedTestCodes: [{ type: String, uppercase: true, trim: true }],
    operatingStatus: {
      type: String,
      enum: ['ACTIVE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED'],
      required: true,
      default: 'ACTIVE',
      index: true,
    },
    statusReason: { type: String, trim: true },
    installationDate: { type: Date, required: true },
    warrantyExpiryDate: { type: Date },
    lastCalibrationDate: { type: Date },
    nextCalibrationDate: { type: Date, index: true },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date, index: true },
    calibrationStatus: {
      type: String,
      enum: ['PASSED', 'FAILED', 'PENDING', 'OVERDUE'],
      required: true,
      default: 'PENDING',
      index: true,
    },
    maintenanceProvider: { type: String, trim: true },
    supportingDocuments: [
      {
        title: { type: String, required: true, trim: true },
        documentUrl: { type: String, required: true, trim: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

LabInstrumentSchema.index({ laboratoryId: 1, instrumentIdentifier: 1 }, { unique: true });
LabInstrumentSchema.index({ laboratoryId: 1, operatingStatus: 1 });
LabInstrumentSchema.index({ laboratoryId: 1, associatedTestCodes: 1 });

export const LabInstrumentModel: Model<ILabInstrumentDocument> =
  mongoose.models.LabInstrument ||
  mongoose.model<ILabInstrumentDocument>('LabInstrument', LabInstrumentSchema);
