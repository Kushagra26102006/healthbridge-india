import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { RequisitionPriority, RequisitionStatus } from '@healthbridge/shared-types';

export interface IRequisitionItem {
  _id?: Types.ObjectId;
  medicationCatalogId: Types.ObjectId;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  unitOfMeasure?: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  preferredSupplierId?: Types.ObjectId;
  preferredSupplierName?: string;
  reasonForRequest?: string;
  notes?: string;
}

export interface IPurchaseRequisitionDocument extends Document {
  requisitionNumber: string;
  pharmacyId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  requestedByName: string;
  status: RequisitionStatus;
  priority: RequisitionPriority;
  items: IRequisitionItem[];
  totalEstimatedAmount: number;
  requiredByDate?: Date;
  notes?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  approvedBy?: Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  convertedPurchaseOrderId?: Types.ObjectId;
  convertedPurchaseOrderNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequisitionItemSchema = new Schema<IRequisitionItem>(
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
    requestedQuantity: { type: Number, required: true, min: 1 },
    approvedQuantity: { type: Number, min: 0 },
    unitOfMeasure: { type: String, default: 'Units', trim: true },
    estimatedUnitPrice: { type: Number, required: true, min: 0 },
    estimatedTotalPrice: { type: Number, required: true, min: 0 },
    preferredSupplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    preferredSupplierName: { type: String, trim: true },
    reasonForRequest: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: true }
);

const PurchaseRequisitionSchema = new Schema<IPurchaseRequisitionDocument>(
  {
    requisitionNumber: {
      type: String,
      required: [true, 'Requisition number is required'],
      trim: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pharmacy ID is required'],
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedByName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PURCHASE_ORDER', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    items: {
      type: [RequisitionItemSchema],
      required: true,
      validate: [(v: IRequisitionItem[]) => v.length > 0, 'At least one item is required'],
    },
    totalEstimatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    requiredByDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    approvalNotes: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedByName: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
    convertedPurchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
    },
    convertedPurchaseOrderNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseRequisitionSchema.index({ pharmacyId: 1, requisitionNumber: 1 }, { unique: true });
PurchaseRequisitionSchema.index({ pharmacyId: 1, status: 1 });
PurchaseRequisitionSchema.index({ pharmacyId: 1, createdAt: -1 });

export const PurchaseRequisitionModel: Model<IPurchaseRequisitionDocument> =
  mongoose.models.PurchaseRequisition ||
  mongoose.model<IPurchaseRequisitionDocument>('PurchaseRequisition', PurchaseRequisitionSchema);
