import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { EncounterType, EncounterStatus } from '@healthbridge/shared-types';

export interface IEncounterDocument extends Document {
  patientId: Types.ObjectId;
  practitionerId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  encounterType: EncounterType;
  startTime: Date;
  endTime?: Date;
  status: EncounterStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EncounterSchema = new Schema<IEncounterDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    practitionerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Practitioner ID reference is required'],
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    encounterType: {
      type: String,
      enum: ['AMBULATORY', 'EMERGENCY', 'INPATIENT', 'HOME', 'VIRTUAL'],
      required: [true, 'Encounter type is required'],
      default: 'AMBULATORY',
    },
    startTime: {
      type: Date,
      required: [true, 'Encounter start time is required'],
      default: Date.now,
      index: true,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [4000, 'Notes cannot exceed 4000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'encounters',
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

EncounterSchema.index({ patientId: 1, startTime: -1 });
EncounterSchema.index({ practitionerId: 1, startTime: -1 });

export const EncounterModel: Model<IEncounterDocument> =
  (mongoose.models.Encounter as Model<IEncounterDocument>) ||
  mongoose.model<IEncounterDocument>('Encounter', EncounterSchema);

export default EncounterModel;
