import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  SpecimenType,
  LabSampleStatus,
  SampleRejectionReason,
} from '@healthbridge/shared-types';

export interface ISampleTimelineEventDocument {
  eventType: string;
  previousStatus?: string;
  newStatus: string;
  actorId: Types.ObjectId;
  actorName: string;
  timestamp: Date;
  reason?: string;
  notes?: string;
}

export interface ILabSampleDocument extends Document {
  sampleNumber: string;
  barcode: string;
  orderId: Types.ObjectId;
  orderNumber: string;
  laboratoryId: Types.ObjectId;
  patientId: Types.ObjectId;
  testCodes: string[];
  specimenType: SpecimenType;
  collectionMethod?: string;
  containerType?: string;
  status: LabSampleStatus;
  collectionCenterId?: Types.ObjectId;
  collectedAt?: Date;
  collectedById?: Types.ObjectId;
  collectedByName?: string;
  receivedAt?: Date;
  receivedById?: Types.ObjectId;
  receivedByName?: string;
  accessionedAt?: Date;
  accessionedById?: Types.ObjectId;
  accessionedByName?: string;
  rejectionReasonCode?: SampleRejectionReason;
  rejectionReason?: string;
  recollectionRequested?: boolean;
  notes?: string;
  events: ISampleTimelineEventDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const SampleTimelineEventSchema = new Schema<ISampleTimelineEventDocument>(
  {
    eventType: { type: String, required: true },
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true }
);

const LabSampleSchema = new Schema<ILabSampleDocument>(
  {
    sampleNumber: {
      type: String,
      required: [true, 'Sample number reference is required'],
      unique: true,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      required: [true, 'Sample barcode is required'],
      unique: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryOrder',
      required: [true, 'Laboratory order reference is required'],
      index: true,
    },
    orderNumber: {
      type: String,
      required: [true, 'Order reference number is required'],
      trim: true,
    },
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: [true, 'Laboratory reference is required'],
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    testCodes: {
      type: [String],
      required: [true, 'At least one test code is required for the sample'],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Sample must be mapped to at least one test code',
      },
    },
    specimenType: {
      type: String,
      required: [true, 'Specimen type is required'],
      index: true,
    },
    collectionMethod: { type: String, trim: true },
    containerType: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        'COLLECTION_PENDING',
        'COLLECTED',
        'IN_TRANSIT',
        'RECEIVED',
        'ACCESSIONED',
        'REJECTED',
        'PROCESSING',
        'COMPLETED',
      ],
      default: 'COLLECTION_PENDING',
      index: true,
    },
    collectionCenterId: {
      type: Schema.Types.ObjectId,
      ref: 'CollectionCenter',
    },
    collectedAt: { type: Date },
    collectedById: { type: Schema.Types.ObjectId, ref: 'User' },
    collectedByName: { type: String, trim: true },
    receivedAt: { type: Date },
    receivedById: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedByName: { type: String, trim: true },
    accessionedAt: { type: Date },
    accessionedById: { type: Schema.Types.ObjectId, ref: 'User' },
    accessionedByName: { type: String, trim: true },
    rejectionReasonCode: {
      type: String,
      enum: [
        'UNLABELLED_SAMPLE',
        'INCORRECT_SPECIMEN',
        'INSUFFICIENT_QUANTITY',
        'DAMAGED_CONTAINER',
        'LEAKAGE',
        'EXPIRED_STABILITY_WINDOW',
        'DUPLICATE_SAMPLE',
        'TRANSPORT_CONDITION_FAILURE',
        'OTHER',
      ],
    },
    rejectionReason: { type: String, trim: true },
    recollectionRequested: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    events: [SampleTimelineEventSchema],
  },
  {
    timestamps: true,
    collection: 'labSamples',
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

LabSampleSchema.index({ laboratoryId: 1, status: 1 });
LabSampleSchema.index({ laboratoryId: 1, createdAt: -1 });
LabSampleSchema.index({ orderId: 1, specimenType: 1 });

export const LabSampleModel: Model<ILabSampleDocument> =
  (mongoose.models.LabSample as Model<ILabSampleDocument>) ||
  mongoose.model<ILabSampleDocument>('LabSample', LabSampleSchema);

export default LabSampleModel;
