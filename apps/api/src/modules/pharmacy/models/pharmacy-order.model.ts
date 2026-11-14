import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { PharmacyOrderStatus, FulfillmentType } from '@healthbridge/shared-types';

export interface IPharmacyOrderItem {
  inventoryId?: Types.ObjectId;
  medicationCatalogId?: Types.ObjectId;
  medicationName: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
}

export interface IPharmacyOrderDocument extends Document {
  orderNumber: string;
  pharmacyId: Types.ObjectId;
  patientId: Types.ObjectId;
  prescriptionId?: Types.ObjectId;
  facilityId?: Types.ObjectId;
  items: IPharmacyOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  status: PharmacyOrderStatus;
  cancellationReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyOrderItemSchema = new Schema<IPharmacyOrderItem>(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: 'PharmacyInventory' },
    medicationCatalogId: { type: Schema.Types.ObjectId, ref: 'MedicationCatalog' },
    medicationName: { type: String, required: true, trim: true },
    strength: { type: String, required: true, trim: true },
    dosageForm: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    unitPrice: { type: Number, required: true, min: [0, 'Unit price cannot be negative'] },
    totalPrice: { type: Number, required: true, min: [0, 'Total price cannot be negative'] },
    batchNumber: { type: String, trim: true, uppercase: true },
  },
  { _id: true }
);

const PharmacyOrderSchema = new Schema<IPharmacyOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order reference number is required'],
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
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference ID is required'],
      index: true,
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    items: {
      type: [PharmacyOrderItemSchema],
      required: [true, 'Order must contain items'],
      validate: {
        validator: (v: IPharmacyOrderItem[]) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    fulfillmentType: {
      type: String,
      enum: ['IN_STORE_PICKUP', 'HOME_DELIVERY'],
      default: 'IN_STORE_PICKUP',
      index: true,
    },
    deliveryAddress: {
      line1: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'ACCEPTED',
        'PROCESSING',
        'READY_FOR_PICKUP',
        'DISPATCHED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'pharmacyOrders',
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

PharmacyOrderSchema.index({ pharmacyId: 1, status: 1, createdAt: -1 });
PharmacyOrderSchema.index({ patientId: 1, createdAt: -1 });

export const PharmacyOrderModel: Model<IPharmacyOrderDocument> =
  (mongoose.models.PharmacyOrder as Model<IPharmacyOrderDocument>) ||
  mongoose.model<IPharmacyOrderDocument>('PharmacyOrder', PharmacyOrderSchema);

export default PharmacyOrderModel;

