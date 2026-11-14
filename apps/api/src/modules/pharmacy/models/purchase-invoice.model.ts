import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { PurchaseInvoiceStatus } from '@healthbridge/shared-types';

export interface IPurchaseInvoiceDocument extends Document {
  invoiceNumber: string;
  pharmacyId: Types.ObjectId;
  supplierId: Types.ObjectId;
  supplierName: string;
  purchaseOrderId: Types.ObjectId;
  poNumber: string;
  goodsReceiptIds: Types.ObjectId[];
  grnNumbers: string[];
  invoiceDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: PurchaseInvoiceStatus;
  notes?: string;
  reconciliationNotes?: string;
  disputedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseInvoiceSchema = new Schema<IPurchaseInvoiceDocument>(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pharmacy ID is required'],
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
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
    goodsReceiptIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'GoodsReceipt' }],
      default: [],
    },
    grnNumbers: {
      type: [String],
      default: [],
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIALLY_RECONCILED', 'RECONCILED', 'DISPUTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    reconciliationNotes: {
      type: String,
      trim: true,
    },
    disputedReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseInvoiceSchema.index({ pharmacyId: 1, invoiceNumber: 1, supplierId: 1 }, { unique: true });
PurchaseInvoiceSchema.index({ pharmacyId: 1, status: 1 });
PurchaseInvoiceSchema.index({ pharmacyId: 1, purchaseOrderId: 1 });

export const PurchaseInvoiceModel: Model<IPurchaseInvoiceDocument> =
  mongoose.models.PurchaseInvoice ||
  mongoose.model<IPurchaseInvoiceDocument>('PurchaseInvoice', PurchaseInvoiceSchema);
