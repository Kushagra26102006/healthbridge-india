import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { PrescriptionStatus, PrescribedMedication } from '@healthbridge/shared-types';

export interface IPrescriptionDocument extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  encounterId?: Types.ObjectId;
  medications: PrescribedMedication[];
  instructions: string;
  issuedAt: Date;
  validUntil: Date;
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PrescribedMedicationSchema = new Schema<PrescribedMedication>(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescriptionDocument>(
  {
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
    medications: {
      type: [PrescribedMedicationSchema],
      required: [true, 'At least one medication is required'],
      validate: {
        validator: (meds: PrescribedMedication[]) => meds.length > 0,
        message: 'Prescription must contain at least one medication',
      },
    },
    instructions: {
      type: String,
      required: [true, 'Clinical instructions are required'],
      trim: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    validUntil: {
      type: Date,
      required: [true, 'Prescription validity date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISPENSED', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
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
PrescriptionSchema.index({ doctorId: 1, createdAt: -1 });

export const PrescriptionModel: Model<IPrescriptionDocument> =
  (mongoose.models.Prescription as Model<IPrescriptionDocument>) ||
  mongoose.model<IPrescriptionDocument>('Prescription', PrescriptionSchema);

export default PrescriptionModel;
