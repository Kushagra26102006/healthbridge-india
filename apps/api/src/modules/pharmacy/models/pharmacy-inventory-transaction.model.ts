import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { InventoryTransactionType } from '@healthbridge/shared-types';

export interface IPharmacyInventoryTransactionDocument extends Document {
  transactionReference: string;
  pharmacyId: Types.ObjectId;
  inventoryId: Types.ObjectId;
  medicationCatalogId?: Types.ObjectId;
  medicationName: string;
  batchNumber: string;
  transactionType: InventoryTransactionType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceEntity?: string;
  referenceId?: string;
  performedBy: Types.ObjectId;
  performedByName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyInventoryTransactionSchema = new Schema<IPharmacyInventoryTransactionDocument>(
  {
    transactionReference: {
      type: String,
      required: [true, 'Transaction reference is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pharmacy reference ID is required'],
      index: true,
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'PharmacyInventory',
      required: [true, 'Inventory batch reference ID is required'],
      index: true,
    },
    medicationCatalogId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicationCatalog',
      index: true,
    },
    medicationName: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    transactionType: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: [
        'STOCK_RECEIVED',
        'STOCK_DISPENSED',
        'STOCK_ADJUSTED',
        'STOCK_DAMAGED',
        'STOCK_EXPIRED',
        'STOCK_QUARANTINED',
        'STOCK_RELEASED',
        'STOCK_TRANSFERRED',
      ],
      index: true,
    },
    quantityChange: {
      type: Number,
      required: [true, 'Quantity change delta is required'],
    },
    previousQuantity: {
      type: Number,
      required: [true, 'Previous stock quantity is required'],
      min: [0, 'Previous quantity cannot be negative'],
    },
    newQuantity: {
      type: Number,
      required: [true, 'New stock quantity is required'],
      min: [0, 'New quantity cannot be negative'],
    },
    reason: {
      type: String,
      trim: true,
    },
    referenceEntity: {
      type: String,
      trim: true,
    },
    referenceId: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID who performed this transaction is required'],
      index: true,
    },
    performedByName: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'pharmacyInventoryTransactions',
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

// Indexes for append-only audit ledger and fast scoping
PharmacyInventoryTransactionSchema.index({ pharmacyId: 1, createdAt: -1 });
PharmacyInventoryTransactionSchema.index({ pharmacyId: 1, inventoryId: 1, createdAt: -1 });
PharmacyInventoryTransactionSchema.index({ pharmacyId: 1, transactionType: 1 });
PharmacyInventoryTransactionSchema.index({ pharmacyId: 1, batchNumber: 1 });

export const PharmacyInventoryTransactionModel: Model<IPharmacyInventoryTransactionDocument> =
  (mongoose.models.PharmacyInventoryTransaction as Model<IPharmacyInventoryTransactionDocument>) ||
  mongoose.model<IPharmacyInventoryTransactionDocument>(
    'PharmacyInventoryTransaction',
    PharmacyInventoryTransactionSchema
  );

export default PharmacyInventoryTransactionModel;
