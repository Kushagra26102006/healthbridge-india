import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { PurchaseOrderStatus } from '@healthbridge/shared-types';

export interface IPurchaseOrderItem {
  _id?: Types.ObjectId;
  medicationCatalogId: Types.ObjectId;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  itemSubtotal: number;
  itemTax: number;
  itemTotal: number;
  packSize?: string;
  supplierProductCode?: string;
  notes?: string;
}

export interface IPurchaseOrderApprovalDetails {
  approvedBy: Types.ObjectId;
  approverName: string;
  approvedAt: Date;
  comments?: string;
  rejectedReason?: string;
}

export interface IPurchaseOrderCancellationDetails {
  cancelledBy: Types.ObjectId;
  cancelledByName: string;
  cancelledAt: Date;
  reason: string;
}

export interface IPurchaseOrderDocument extends Document {
  poNumber: string;
  pharmacyId: Types.ObjectId;
  requisitionId?: Types.ObjectId;
  requisitionNumber?: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  supplierCode: string;
  supplierGstin?: string;
  supplierDrugLicense?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  paymentTermsDays: number;
  deliveryAddress: {
    line1?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: IPurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  notes?: string;
  termsAndConditions?: string;
  approvalDetails?: IPurchaseOrderApprovalDetails;
  cancellationDetails?: IPurchaseOrderCancellationDetails;
  sentToSupplierAt?: Date;
  createdBy: Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    medicationCatalogId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicationCatalog',
      required: true,
    },
    medicationName: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    brandName: { type: String, trim: true },
    dosageForm: { type: String, required: true, trim: true },
    strength: { type: String, required: true, trim: true },
    orderedQuantity: { type: Number, required: true, min: 1 },
    receivedQuantity: { type: Number, default: 0, min: 0 },
    remainingQuantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    itemSubtotal: { type: Number, required: true, min: 0 },
    itemTax: { type: Number, required: true, min: 0 },
    itemTotal: { type: Number, required: true, min: 0 },
    packSize: { type: String, trim: true },
    supplierProductCode: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true }
);

const PurchaseOrderApprovalSchema = new Schema<IPurchaseOrderApprovalDetails>(
  {
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approverName: { type: String, required: true, trim: true },
    approvedAt: { type: Date, required: true },
    comments: { type: String, trim: true },
    rejectedReason: { type: String, trim: true },
  },
  { _id: false }
);

const PurchaseOrderCancellationSchema = new Schema<IPurchaseOrderCancellationDetails>(
  {
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cancelledByName: { type: String, required: true, trim: true },
    cancelledAt: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrderDocument>(
  {
    poNumber: {
      type: String,
      required: [true, 'Purchase order number is required'],
      trim: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pharmacy ID is required'],
      index: true,
    },
    requisitionId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseRequisition',
      index: true,
    },
    requisitionNumber: {
      type: String,
      trim: true,
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
    supplierCode: {
      type: String,
      required: true,
      trim: true,
    },
    supplierGstin: {
      type: String,
      trim: true,
    },
    supplierDrugLicense: {
      type: String,
      trim: true,
    },
    supplierEmail: {
      type: String,
      trim: true,
    },
    supplierPhone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'SENT_TO_SUPPLIER',
        'PARTIALLY_RECEIVED',
        'FULLY_RECEIVED',
        'CANCELLED',
        'REJECTED',
      ],
      default: 'DRAFT',
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    paymentTermsDays: {
      type: Number,
      default: 30,
      min: 0,
    },
    deliveryAddress: {
      line1: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    items: {
      type: [PurchaseOrderItemSchema],
      required: true,
      validate: [(v: IPurchaseOrderItem[]) => v.length > 0, 'At least one item is required'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    termsAndConditions: {
      type: String,
      trim: true,
    },
    approvalDetails: {
      type: PurchaseOrderApprovalSchema,
    },
    cancellationDetails: {
      type: PurchaseOrderCancellationSchema,
    },
    sentToSupplierAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseOrderSchema.index({ pharmacyId: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ pharmacyId: 1, status: 1 });
PurchaseOrderSchema.index({ pharmacyId: 1, supplierId: 1 });
PurchaseOrderSchema.index({ pharmacyId: 1, createdAt: -1 });

export const PurchaseOrderModel: Model<IPurchaseOrderDocument> =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrderDocument>('PurchaseOrder', PurchaseOrderSchema);
