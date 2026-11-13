import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { LabOrderStatus, LabTestItem } from '@healthbridge/shared-types';

export interface ILaboratoryOrderDocument extends Document {
  patientId: Types.ObjectId;
  orderedBy: Types.ObjectId;
  tests: LabTestItem[];
  status: LabOrderStatus;
  orderedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LabTestItemSchema = new Schema<LabTestItem>(
  {
    testCode: { type: String, required: true, trim: true },
    testName: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const LaboratoryOrderSchema = new Schema<ILaboratoryOrderDocument>(
  {
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
    tests: {
      type: [LabTestItemSchema],
      required: [true, 'At least one diagnostic test is required'],
      validate: {
        validator: (tests: LabTestItem[]) => tests.length > 0,
        message: 'Order must contain at least one test item',
      },
    },
    status: {
      type: String,
      enum: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED'],
      default: 'ORDERED',
      index: true,
    },
    orderedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

LaboratoryOrderSchema.index({ patientId: 1, status: 1 });

export const LaboratoryOrderModel: Model<ILaboratoryOrderDocument> =
  (mongoose.models.LaboratoryOrder as Model<ILaboratoryOrderDocument>) ||
  mongoose.model<ILaboratoryOrderDocument>('LaboratoryOrder', LaboratoryOrderSchema);

export default LaboratoryOrderModel;

