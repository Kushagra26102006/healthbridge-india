import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { GoodsReceiptStatus } from '@healthbridge/shared-types';

export interface IGoodsReceiptItem {
  _id?: Types.ObjectId;
  purchaseOrderItemId: Types.ObjectId;
  medicationCatalogId: Types.ObjectId;
  medicationName: string;
  dosageForm: string;
  strength: string;
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  orderedQuantity: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  acceptedQuantity: number;
  unitPurchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  taxPercent: number;
  itemTotal: number;
  storageLocation?: string;
  remarks?: string;
}

export interface IGoodsReceiptDocument extends Document {
  grnNumber: string;
  pharmacyId: Types.ObjectId;
  purchaseOrderId: Types.ObjectId;
  poNumber: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: Date;
  receivedDate: Date;
  receivedBy: Types.ObjectId;
  receiverName: string;
  status: GoodsReceiptStatus;
  items: IGoodsReceiptItem[];
  totalItemsCount: number;
  totalReceivedQuantity: number;
  totalAcceptedQuantity: number;
  totalRejectedQuantity: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoodsReceiptItemSchema = new Schema<IGoodsReceiptItem>(
  {
    purchaseOrderItemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    medicationCatalogId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicationCatalog',
      required: true,
    },
    medicationName: { type: String, required: true, trim: true },
    dosageForm: { type: String, required: true, trim: true },
    strength: { type: String, required: true, trim: true },
    batchNumber: { type: String, required: true, trim: true },
    manufacturingDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    orderedQuantity: { type: Number, required: true, min: 1 },
    receivedQuantity: { type: Number, required: true, min: 1 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    acceptedQuantity: { type: Number, required: true, min: 0 },
    unitPurchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    itemTotal: { type: Number, required: true, min: 0 },
    storageLocation: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const GoodsReceiptSchema = new Schema<IGoodsReceiptDocument>(
  {
    grnNumber: {
      type: String,
      required: [true, 'GRN number is required'],
      trim: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pharmacy ID is required'],
      index: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase order reference is required'],
      index: true,
    },
    poNumber: {
      type: String,
      required: true,
      trim: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    supplierInvoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    supplierInvoiceDate: {
      type: Date,
      required: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'ADJUSTED', 'CANCELLED'],
      default: 'CONFIRMED',
      index: true,
    },
    items: {
      type: [GoodsReceiptItemSchema],
      required: true,
      validate: [(v: IGoodsReceiptItem[]) => v.length > 0, 'At least one item is required'],
    },
    totalItemsCount: {
      type: Number,
      required: true,
      min: 1,
    },
    totalReceivedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAcceptedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    totalRejectedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

GoodsReceiptSchema.index({ pharmacyId: 1, grnNumber: 1 }, { unique: true });
GoodsReceiptSchema.index({ pharmacyId: 1, purchaseOrderId: 1 });
GoodsReceiptSchema.index({ pharmacyId: 1, receivedDate: -1 });

export const GoodsReceiptModel: Model<IGoodsReceiptDocument> =
  mongoose.models.GoodsReceipt ||
  mongoose.model<IGoodsReceiptDocument>('GoodsReceipt', GoodsReceiptSchema);
