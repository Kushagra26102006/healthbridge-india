import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IDispensingRecordItem {
  _id?: Types.ObjectId;
  prescriptionMedicationId: string;
  medicationCatalogId?: Types.ObjectId;
  inventoryId: Types.ObjectId;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  batchNumber: string;
  prescribedQuantity: number;
  previouslyDispensedQuantity: number;
  quantityDispensed: number;
  remainingQuantity: number;
  dispensedUnit: string;
  batchExpiryDate: Date;
  sellingPriceSnapshot: number;
  itemTotal: number;
  dosageInstructions?: string;
}

export interface IDispensingRecordDocument extends Document {
  dispensingNumber: string;
  pharmacyId: Types.ObjectId;
  pharmacyName: string;
  pharmacyLicenseNumber?: string;
  pharmacyGstin?: string;
  pharmacyAddress?: {
    line1?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  prescriptionId: Types.ObjectId;
  prescriptionNumber: string;
  patientId: Types.ObjectId;
  patientName: string;
  patientPhone?: string;
  patientGender?: string;
  patientAge?: number;
  doctorId: Types.ObjectId;
  doctorName: string;
  doctorSpecialization?: string;
  facilityName?: string;
  dispensedBy: Types.ObjectId;
  dispenserName: string;
  dispensedAt: Date;
  dispensingStatus: 'PARTIALLY_DISPENSED' | 'FULLY_DISPENSED' | 'CANCELLED';
  items: IDispensingRecordItem[];
  totalItems: number;
  totalQuantityDispensed: number;
  totalAmount: number;
  notes?: string;
  idempotencyKey?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancelledByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DispensingRecordItemSchema = new Schema<IDispensingRecordItem>(
  {
    prescriptionMedicationId: {
      type: String,
      required: true,
      trim: true,
    },
    medicationCatalogId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicationCatalog',
    },
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: 'PharmacyInventory',
      required: true,
    },
    medicationName: {
      type: String,
      required: true,
      trim: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    strength: {
      type: String,
      required: true,
      trim: true,
    },
    dosageForm: {
      type: String,
      required: true,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    prescribedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    previouslyDispensedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    quantityDispensed: {
      type: Number,
      required: true,
      min: 1,
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    dispensedUnit: {
      type: String,
      default: 'Units',
      trim: true,
    },
    batchExpiryDate: {
      type: Date,
      required: true,
    },
    sellingPriceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    itemTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    dosageInstructions: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const DispensingRecordSchema = new Schema<IDispensingRecordDocument>(
  {
    dispensingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pharmacyName: {
      type: String,
      required: true,
      trim: true,
    },
    pharmacyLicenseNumber: {
      type: String,
      trim: true,
    },
    pharmacyGstin: {
      type: String,
      trim: true,
    },
    pharmacyAddress: {
      line1: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      index: true,
    },
    prescriptionNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientPhone: {
      type: String,
      trim: true,
    },
    patientGender: {
      type: String,
      trim: true,
    },
    patientAge: {
      type: Number,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    doctorSpecialization: {
      type: String,
      trim: true,
    },
    facilityName: {
      type: String,
      trim: true,
    },
    dispensedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dispenserName: {
      type: String,
      required: true,
      trim: true,
    },
    dispensedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dispensingStatus: {
      type: String,
      enum: ['PARTIALLY_DISPENSED', 'FULLY_DISPENSED', 'CANCELLED'],
      default: 'FULLY_DISPENSED',
      index: true,
    },
    items: {
      type: [DispensingRecordItemSchema],
      required: true,
      validate: [(val: IDispensingRecordItem[]) => val.length > 0, 'At least one item must be dispensed'],
    },
    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },
    totalQuantityDispensed: {
      type: Number,
      required: true,
      min: 1,
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
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes
DispensingRecordSchema.index({ pharmacyId: 1, dispensedAt: -1 });
DispensingRecordSchema.index({ prescriptionId: 1, dispensedAt: -1 });
DispensingRecordSchema.index({ patientId: 1, dispensedAt: -1 });
DispensingRecordSchema.index({ pharmacyId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const DispensingRecordModel: Model<IDispensingRecordDocument> =
  mongoose.models.DispensingRecord ||
  mongoose.model<IDispensingRecordDocument>('DispensingRecord', DispensingRecordSchema);

