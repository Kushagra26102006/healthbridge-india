import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { PrescriptionStatus, PrescribedMedication } from '@healthbridge/shared-types';

export interface IPrescriptionAmendment {
  amendedAt: Date;
  amendedBy: Types.ObjectId;
  reason: string;
  note?: string;
}

export interface IPrescriptionDocument extends Document {
  prescriptionNumber: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  encounterId?: Types.ObjectId;
  facilityId?: Types.ObjectId;
  diagnosis?: string;
  medications: PrescribedMedication[];
  instructions: string;
  followUpInstructions?: string;
  issuedAt?: Date;
  issuedBy?: Types.ObjectId;
  validUntil: Date;
  status: PrescriptionStatus;
  isDraft: boolean;
  version: number;
  refillEligible: boolean;
  refillsAllowed: number;
  refillsRemaining: number;
  documentUrl?: string;
  discontinuedAt?: Date;
  discontinuedBy?: Types.ObjectId;
  discontinuationReason?: string;
  amendments: IPrescriptionAmendment[];
  createdAt: Date;
  updatedAt: Date;
}

const PrescribedMedicationSchema = new Schema<PrescribedMedication>(
  {
    medicationCatalogId: { type: Schema.Types.ObjectId, ref: 'MedicationCatalog' },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    brandName: { type: String, trim: true },
    strength: { type: String, trim: true },
    dosage: { type: String, required: true, trim: true },
    route: { type: String, trim: true, default: 'Oral' },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 10, min: 1 },
    instructions: { type: String, trim: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'DISCONTINUED'],
      default: 'ACTIVE',
    },
  },
  { _id: true }
);

const PrescriptionAmendmentSchema = new Schema<IPrescriptionAmendment>(
  {
    amendedAt: { type: Date, default: Date.now },
    amendedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    note: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: true }
);

const PrescriptionSchema = new Schema<IPrescriptionDocument>(
  {
    prescriptionNumber: {
      type: String,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Prescribing doctor ID reference is required'],
      index: true,
    },
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: 'Encounter',
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    medications: {
      type: [PrescribedMedicationSchema],
      required: [true, 'At least one medication is required'],
      validate: {
        validator: (meds: PrescribedMedication[]) => meds && meds.length > 0,
        message: 'Prescription must contain at least one medication',
      },
    },
    instructions: {
      type: String,
      required: [true, 'Clinical instructions are required'],
      trim: true,
    },
    followUpInstructions: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    issuedAt: {
      type: Date,
      index: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    validUntil: {
      type: Date,
      required: [true, 'Prescription validity date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'DISPENSED', 'CANCELLED', 'DISCONTINUED', 'EXPIRED'],
      default: 'DRAFT',
      index: true,
    },
    isDraft: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    refillEligible: {
      type: Boolean,
      default: false,
    },
    refillsAllowed: {
      type: Number,
      default: 0,
    },
    refillsRemaining: {
      type: Number,
      default: 0,
    },
    documentUrl: {
      type: String,
      trim: true,
    },
    discontinuedAt: {
      type: Date,
    },
    discontinuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    discontinuationReason: {
      type: String,
      trim: true,
    },
    amendments: {
      type: [PrescriptionAmendmentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'prescriptions',
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

PrescriptionSchema.index({ patientId: 1, status: 1 });
PrescriptionSchema.index({ patientId: 1, issuedAt: -1 });
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });
PrescriptionSchema.index({ doctorId: 1, status: 1 });
PrescriptionSchema.index({ doctorId: 1, isDraft: 1 });

export const PrescriptionModel: Model<IPrescriptionDocument> =
  (mongoose.models.Prescription as Model<IPrescriptionDocument>) ||
  mongoose.model<IPrescriptionDocument>('Prescription', PrescriptionSchema);

export default PrescriptionModel;