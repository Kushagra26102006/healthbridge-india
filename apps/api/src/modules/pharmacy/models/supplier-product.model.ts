import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISupplierProductDocument extends Document {
  pharmacyId: Types.ObjectId;
  supplierId: Types.ObjectId;
  supplierName: string;
  medicationCatalogId: Types.ObjectId;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  supplierProductCode?: string;
  purchasePrice: number;
  mrp?: number;
  minimumOrderQuantity: number;
  packSize?: string;
  leadTimeDays?: number;
  isAvailable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierProductSchema = new Schema<ISupplierProductDocument>(
  {
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
    medicationCatalogId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicationCatalog',
      required: [true, 'Medication catalog reference is required'],
      index: true,
    },
    medicationName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    dosageForm: {
      type: String,
      required: true,
      trim: true,
    },
    strength: {
      type: String,
      required: true,
      trim: true,
    },
    supplierProductCode: {
      type: String,
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: 0,
    },
    mrp: {
      type: Number,
      min: 0,
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    packSize: {
      type: String,
      trim: true,
    },
    leadTimeDays: {
      type: Number,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
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

SupplierProductSchema.index({ pharmacyId: 1, supplierId: 1, medicationCatalogId: 1 }, { unique: true });
SupplierProductSchema.index({ pharmacyId: 1, medicationCatalogId: 1 });

export const SupplierProductModel: Model<ISupplierProductDocument> =
  mongoose.models.SupplierProduct ||
  mongoose.model<ISupplierProductDocument>('SupplierProduct', SupplierProductSchema);

