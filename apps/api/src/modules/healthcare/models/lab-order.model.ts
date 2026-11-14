import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type { LabOrderStatus } from '@healthbridge/shared-types';

export interface ILabOrderItemDocument {
  testCode: string;
  testName: string;
  category?: string;
  instructions?: string;
}

export interface ILaboratoryOrderDocument extends Document {
  orderNumber: string;
  patientId: Types.ObjectId;
  orderedBy: Types.ObjectId;
  laboratoryId?: Types.ObjectId;
  tests: ILabOrderItemDocument[];
  status: LabOrderStatus;
  collectionStatus?: string;
  orderedAt: Date;
  reportId?: Types.ObjectId;
  clinicalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabTestItemSchema = new Schema<ILabOrderItemDocument>(
  {
    testCode: { type: String, required: true, trim: true },
    testName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const LaboratoryOrderSchema = new Schema<ILaboratoryOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order reference number is required'],
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
    orderedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ordering physician ID reference is required'],
      index: true,
    },
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tests: {
      type: [LabTestItemSchema],
      required: [true, 'At least one diagnostic test is required'],
      validate: {
        validator: (tests: ILabOrderItemDocument[]) => tests.length > 0,
        message: 'Order must contain at least one test item',
      },
    },
    status: {
      type: String,
      enum: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED'],
      default: 'ORDERED',
      index: true,
    },
    collectionStatus: {
      type: String,
      enum: ['PENDING', 'COLLECTED', 'NOT_REQUIRED'],
      default: 'PENDING',
    },
    orderedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryReport',
      index: true,
    },
    clinicalNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'labOrders',
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

LaboratoryOrderSchema.index({ patientId: 1, orderedAt: -1 });
LaboratoryOrderSchema.index({ patientId: 1, status: 1 });

export const LaboratoryOrderModel: Model<ILaboratoryOrderDocument> =
  (mongoose.models.LaboratoryOrder as Model<ILaboratoryOrderDocument>) ||
  mongoose.model<ILaboratoryOrderDocument>('LaboratoryOrder', LaboratoryOrderSchema);

export default LaboratoryOrderModel;
