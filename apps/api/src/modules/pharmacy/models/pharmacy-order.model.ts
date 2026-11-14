import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { PharmacyOrderStatus, FulfillmentType } from '@healthbridge/shared-types';

export interface IPharmacyOrderItem {
  _id?: Types.ObjectId;
  prescriptionMedicationId?: string;
  inventoryId?: Types.ObjectId;
  medicationCatalogId?: Types.ObjectId;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  requestedQuantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  fulfillmentStatus: 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED';
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
  dispensingRecordId?: Types.ObjectId;
  instructions?: string;
}

export interface IOrderStatusEvent {
  _id?: Types.ObjectId;
  previousStatus?: PharmacyOrderStatus;
  newStatus: PharmacyOrderStatus;
  actorId?: Types.ObjectId;
  actorName: string;
  actorRole: string;
  reason?: string;
  timestamp: Date;
}

export interface IPickupRecord {
  pickupReference?: string;
  pickupCodeHash?: string;
  pickupInstructions?: string;
  expiresAt?: Date;
  verificationAttempts: number;
  maxAttempts: number;
  isVerified: boolean;
  verifiedAt?: Date;
  handedOverBy?: Types.ObjectId;
  handedOverByName?: string;
  collectedAt?: Date;
  handoverNotes?: string;
}

export interface IPharmacyOrderDocument extends Document {
  orderNumber: string;
  pharmacyId: Types.ObjectId;
  pharmacyName?: string;
  patientId: Types.ObjectId;
  patientName?: string;
  patientPhone?: string;
  prescriptionId?: Types.ObjectId;
  prescriptionNumber?: string;
  doctorId?: Types.ObjectId;
  doctorName?: string;
  facilityId?: Types.ObjectId;
  facilityName?: string;
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
  notes?: string;
  internalOperationalNotes?: string;
  clarificationRequested?: boolean;
  clarificationNotes?: string;
  rejectionReason?: string;
  rejectionReasonCode?: string;
  rejectedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectedByName?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancelledByName?: string;
  statusHistory: IOrderStatusEvent[];
  pickupDetails?: IPickupRecord;
  dispensingRecordIds: Types.ObjectId[];
  estimatedReadiness?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyOrderItemSchema = new Schema<IPharmacyOrderItem>(
  {
    prescriptionMedicationId: { type: String, trim: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: 'PharmacyInventory' },
    medicationCatalogId: { type: Schema.Types.ObjectId, ref: 'MedicationCatalog' },
    medicationName: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    brandName: { type: String, trim: true },
    strength: { type: String, required: true, trim: true },
    dosageForm: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    requestedQuantity: { type: Number, required: true, default: 1 },
    fulfilledQuantity: { type: Number, required: true, default: 0 },
    remainingQuantity: { type: Number, required: true, default: 1 },
    fulfillmentStatus: {
      type: String,
      enum: ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED'],
      default: 'UNFULFILLED',
    },
    unitPrice: { type: Number, required: true, min: [0, 'Unit price cannot be negative'] },
    totalPrice: { type: Number, required: true, min: [0, 'Total price cannot be negative'] },
    batchNumber: { type: String, trim: true, uppercase: true },
    dispensingRecordId: { type: Schema.Types.ObjectId, ref: 'DispensingRecord' },
    instructions: { type: String, trim: true },
  },
  { _id: true }
);

const OrderStatusEventSchema = new Schema<IOrderStatusEvent>(
  {
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, required: true, trim: true },
    actorRole: { type: String, required: true, trim: true },
    reason: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PickupRecordSchema = new Schema<IPickupRecord>(
  {
    pickupReference: { type: String, trim: true },
    pickupCodeHash: { type: String, trim: true },
    pickupInstructions: { type: String, trim: true },
    expiresAt: { type: Date },
    verificationAttempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    handedOverBy: { type: Schema.Types.ObjectId, ref: 'User' },
    handedOverByName: { type: String, trim: true },
    collectedAt: { type: Date },
    handoverNotes: { type: String, trim: true },
  },
  { _id: false }
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
    pharmacyName: { type: String, trim: true },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference ID is required'],
      index: true,
    },
    patientName: { type: String, trim: true },
    patientPhone: { type: String, trim: true },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      index: true,
    },
    prescriptionNumber: { type: String, trim: true },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    doctorName: { type: String, trim: true },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    facilityName: { type: String, trim: true },
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
        'UNDER_REVIEW',
        'ACCEPTED',
        'PROCESSING',
        'PARTIALLY_FULFILLED',
        'READY_FOR_PICKUP',
        'DISPATCHED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
      ],
      default: 'PENDING',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    internalOperationalNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Internal notes cannot exceed 1000 characters'],
    },
    clarificationRequested: {
      type: Boolean,
      default: false,
    },
    clarificationNotes: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    rejectionReasonCode: {
      type: String,
      trim: true,
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedByName: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledByName: {
      type: String,
      trim: true,
    },
    statusHistory: {
      type: [OrderStatusEventSchema],
      default: [],
    },
    pickupDetails: {
      type: PickupRecordSchema,
    },
    dispensingRecordIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'DispensingRecord' }],
      default: [],
    },
    estimatedReadiness: {
      type: Date,
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

