import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  EncounterType,
  EncounterStatus,
  DiagnosisClassification,
  DiagnosisClinicalStatus,
} from '@healthbridge/shared-types';

export interface IEncounterVitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  recordedAt?: Date;
}

export interface IEncounterDiagnosis {
  name: string;
  code?: string;
  type: DiagnosisClassification;
  clinicalStatus: DiagnosisClinicalStatus;
  notes?: string;
}

export interface IEncounterExamination {
  general?: string;
  systemic?: string;
}

export interface IEncounterAmendment {
  amendedAt: Date;
  amendedBy: Types.ObjectId;
  reason: string;
  previousContent: Record<string, unknown>;
}

export interface IEncounterDocument extends Document {
  patientId: Types.ObjectId;
  practitionerId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  encounterType: EncounterType;
  startTime: Date;
  endTime?: Date;
  status: EncounterStatus;
  isDraft: boolean;
  notes?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  medicalHistory?: string;
  vitals?: IEncounterVitals;
  examination?: IEncounterExamination;
  diagnoses: IEncounterDiagnosis[];
  assessment?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  followUpDate?: Date;
  linkedRecordIds: Types.ObjectId[];
  linkedPrescriptionIds: Types.ObjectId[];
  version: number;
  finalizedAt?: Date;
  finalizedBy?: Types.ObjectId;
  amendments: IEncounterAmendment[];
  createdAt: Date;
  updatedAt: Date;
}

const EncounterVitalsSchema = new Schema<IEncounterVitals>(
  {
    bloodPressureSystolic: { type: Number, min: 40, max: 300 },
    bloodPressureDiastolic: { type: Number, min: 20, max: 200 },
    heartRate: { type: Number, min: 30, max: 250 },
    respiratoryRate: { type: Number, min: 5, max: 60 },
    temperature: { type: Number, min: 30, max: 45 },
    oxygenSaturation: { type: Number, min: 50, max: 100 },
    height: { type: Number, min: 20, max: 300 },
    weight: { type: Number, min: 0.5, max: 500 },
    bmi: { type: Number, min: 5, max: 100 },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const EncounterDiagnosisSchema = new Schema<IEncounterDiagnosis>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    code: { type: String, trim: true, maxlength: 50 },
    type: { type: String, enum: ['PRIMARY', 'SECONDARY'], default: 'PRIMARY' },
    clinicalStatus: {
      type: String,
      enum: ['ACTIVE', 'RECURRENCE', 'RELAPSE', 'REMISSION', 'RESOLVED'],
      default: 'ACTIVE',
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: true }
);

const EncounterExaminationSchema = new Schema<IEncounterExamination>(
  {
    general: { type: String, trim: true, maxlength: 2000 },
    systemic: { type: String, trim: true, maxlength: 4000 },
  },
  { _id: false }
);

const EncounterAmendmentSchema = new Schema<IEncounterAmendment>(
  {
    amendedAt: { type: Date, default: Date.now },
    amendedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    previousContent: { type: Schema.Types.Mixed },
  },
  { _id: true }
);

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
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
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
    isDraft: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [4000, 'Notes cannot exceed 4000 characters'],
    },
    chiefComplaint: {
      type: String,
      trim: true,
      maxlength: [2000, 'Chief complaint cannot exceed 2000 characters'],
    },
    historyOfPresentIllness: {
      type: String,
      trim: true,
      maxlength: [4000, 'HPI cannot exceed 4000 characters'],
    },
    medicalHistory: {
      type: String,
      trim: true,
      maxlength: [4000, 'Medical history cannot exceed 4000 characters'],
    },
    vitals: {
      type: EncounterVitalsSchema,
    },
    examination: {
      type: EncounterExaminationSchema,
    },
    diagnoses: {
      type: [EncounterDiagnosisSchema],
      default: [],
    },
    assessment: {
      type: String,
      trim: true,
      maxlength: [4000, 'Assessment cannot exceed 4000 characters'],
    },
    treatmentPlan: {
      type: String,
      trim: true,
      maxlength: [4000, 'Treatment plan cannot exceed 4000 characters'],
    },
    followUpInstructions: {
      type: String,
      trim: true,
      maxlength: [2000, 'Follow-up instructions cannot exceed 2000 characters'],
    },
    followUpDate: {
      type: Date,
    },
    linkedRecordIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'MedicalRecord' }],
      default: [],
    },
    linkedPrescriptionIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Prescription' }],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    finalizedAt: {
      type: Date,
      index: true,
    },
    finalizedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    amendments: {
      type: [EncounterAmendmentSchema],
      default: [],
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
EncounterSchema.index({ practitionerId: 1, status: 1 });
EncounterSchema.index({ practitionerId: 1, isDraft: 1 });

export const EncounterModel: Model<IEncounterDocument> =
  (mongoose.models.Encounter as Model<IEncounterDocument>) ||
  mongoose.model<IEncounterDocument>('Encounter', EncounterSchema);

export default EncounterModel;
