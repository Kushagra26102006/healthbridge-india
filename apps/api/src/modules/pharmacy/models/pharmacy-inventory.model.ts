import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { InventoryStockStatus } from '@healthbridge/shared-types';

export interface IPharmacyInventoryDocument extends Document {
  pharmacyId: Types.ObjectId;
  medicationCatalogId?: Types.ObjectId;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  manufacturer?: string;
  supplier?: string;
  invoiceNumber?: string;
  batchNumber: string;
  receivedQuantity?: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number;
  manufacturingDate?: Date;
  expiryDate: Date;
  status: InventoryStockStatus;
  rackLocation?: string;
  isQuarantined?: boolean;
  quarantineReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyInventorySchema = new Schema<IPharmacyInventoryDocument>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pharmacy reference ID is required'],
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
    genericName: {
      type: String,
      trim: true,
      index: true,
    },
    brandName: {
      type: String,
      trim: true,
      index: true,
    },
    dosageForm: {
      type: String,
      required: [true, 'Dosage form is required'],
      default: 'TABLET',
      trim: true,
    },
    strength: {
      type: String,
      required: [true, 'Medication strength is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    supplier: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch reference number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    receivedQuantity: {
      type: Number,
      min: [0, 'Received quantity cannot be negative'],
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      min: [0, 'Reorder level cannot be negative'],
      default: 20,
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
    },
    manufacturingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Batch expiration date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: [
        'ACTIVE',
        'IN_STOCK',
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'NEAR_EXPIRY',
        'EXPIRED',
        'QUARANTINED',
        'DISCONTINUED',
      ],
      default: 'IN_STOCK',
      index: true,
    },
    rackLocation: {
      type: String,
      trim: true,
    },
    isQuarantined: {
      type: Boolean,
      default: false,
      index: true,
    },
    quarantineReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'pharmacyInventory',
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

// Compound Indexes for fast pharmacy inventory querying and batch uniqueness
PharmacyInventorySchema.index({ pharmacyId: 1, batchNumber: 1, medicationName: 1 }, { unique: true });
PharmacyInventorySchema.index({ pharmacyId: 1, status: 1 });
PharmacyInventorySchema.index({ pharmacyId: 1, expiryDate: 1 });
PharmacyInventorySchema.index({ pharmacyId: 1, medicationCatalogId: 1 });

export const PharmacyInventoryModel: Model<IPharmacyInventoryDocument> =
  (mongoose.models.PharmacyInventory as Model<IPharmacyInventoryDocument>) ||
  mongoose.model<IPharmacyInventoryDocument>('PharmacyInventory', PharmacyInventorySchema);

export default PharmacyInventoryModel;

