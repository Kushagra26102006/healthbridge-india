import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { ReagentTransactionType } from '@healthbridge/shared-types';

export interface IReagentInventoryTransactionDocument extends Document {
  transactionReference: string;
  reagentId: Types.ObjectId;
  reagentName: string;
  lotId: Types.ObjectId;
  lotNumber: string;
  laboratoryId: Types.ObjectId;
  transactionType: ReagentTransactionType;
  quantity: number; // positive or negative
  balanceAfter: number;
  unit: string;
  performedById: Types.ObjectId;
  performedByName: string;
  reason: string;
  batchTestRunId?: string;
  orderId?: Types.ObjectId;
  authorizedById?: Types.ObjectId;
  authorizedByName?: string;
  createdAt: Date;
}

const ReagentInventoryTransactionSchema = new Schema<IReagentInventoryTransactionDocument>(
  {
    transactionReference: { type: String, required: true, unique: true, index: true },
    reagentId: { type: Schema.Types.ObjectId, ref: 'Reagent', required: true, index: true },
    reagentName: { type: String, required: true, trim: true },
    lotId: { type: Schema.Types.ObjectId, ref: 'ReagentLot', required: true, index: true },
    lotNumber: { type: String, required: true, trim: true },
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    transactionType: {
      type: String,
      enum: ['RECEIPT', 'CONSUMPTION', 'ADJUSTMENT', 'DISPOSAL', 'REVERSAL'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    performedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    batchTestRunId: { type: String, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'LabOrder' },
    authorizedById: { type: Schema.Types.ObjectId, ref: 'User' },
    authorizedByName: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ReagentInventoryTransactionSchema.index({ laboratoryId: 1, reagentId: 1, createdAt: -1 });
ReagentInventoryTransactionSchema.index({ laboratoryId: 1, lotId: 1, createdAt: -1 });

export const ReagentInventoryTransactionModel: Model<IReagentInventoryTransactionDocument> =
  mongoose.models.ReagentInventoryTransaction ||
  mongoose.model<IReagentInventoryTransactionDocument>(
    'ReagentInventoryTransaction',
    ReagentInventoryTransactionSchema
  );
