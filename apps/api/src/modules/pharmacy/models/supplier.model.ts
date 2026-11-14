import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  SupplierStatus,
  SupplierType,
  SupplierVerificationStatus,
} from '@healthbridge/shared-types';

export interface ISupplierContact {
  name: string;
  email: string;
  phone: string;
  designation?: string;
  isPrimary?: boolean;
}

export interface ISupplierBankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
}

export interface ISupplierDocument extends Document {
  pharmacyId: Types.ObjectId;
  supplierCode: string;
  name: string;
  legalName?: string;
  supplierType: SupplierType;
  status: SupplierStatus;
  verificationStatus: SupplierVerificationStatus;
  taxId?: string;
  panNumber?: string;
  drugLicenseNumber?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: {
    line1?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPersons: ISupplierContact[];
  paymentTermsDays: number;
  leadTimeDays: number;
  rating: number;
  bankDetails?: ISupplierBankDetails;
  notes?: string;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierContactSchema = new Schema<ISupplierContact>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    designation: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const SupplierBankDetailsSchema = new Schema<ISupplierBankDetails>(
  {
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ifscCode: { type: String, required: true, trim: true, uppercase: true },
    branchName: { type: String, trim: true },
  },
  { _id: false }
);

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pharmacy ID is required'],
      index: true,
    },
    supplierCode: {
      type: String,
      required: [true, 'Supplier code is required'],
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      index: true,
    },
    legalName: {
      type: String,
      trim: true,
    },
    supplierType: {
      type: String,
      enum: ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'IMPORTER', 'OTHER'],
      default: 'DISTRIBUTOR',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
      default: 'ACTIVE',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'VERIFIED', 'REJECTED'],
      default: 'UNVERIFIED',
      index: true,
    },
    taxId: {
      type: String,
      trim: true,
      index: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    drugLicenseNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    address: {
      line1: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    contactPersons: {
      type: [SupplierContactSchema],
      default: [],
    },
    paymentTermsDays: {
      type: Number,
      default: 30,
      min: 0,
    },
    leadTimeDays: {
      type: Number,
      default: 7,
      min: 0,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    bankDetails: {
      type: SupplierBankDetailsSchema,
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
SupplierSchema.index({ pharmacyId: 1, supplierCode: 1 }, { unique: true });
SupplierSchema.index({ pharmacyId: 1, name: 1 });
SupplierSchema.index({ pharmacyId: 1, status: 1 });

export const SupplierModel: Model<ISupplierDocument> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplierDocument>('Supplier', SupplierSchema);
