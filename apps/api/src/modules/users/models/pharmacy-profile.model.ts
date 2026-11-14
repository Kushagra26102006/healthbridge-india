import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { VerificationStatus, PharmacyDocumentType } from '@healthbridge/shared-types';

export interface IPharmacyDocument {
  documentType: PharmacyDocumentType;
  documentNumber?: string;
  documentUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: Date;
  verificationStatus: VerificationStatus;
}

export interface IPharmacyProfileDocument extends Document {
  userId: Types.ObjectId;
  pharmacyName: string;
  pharmacyLicenseNumber: string;
  gstin?: string;
  issuingAuthority?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  logoUrl?: string;
  address?: {
    line1?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  facilityId?: Types.ObjectId;
  verificationStatus: VerificationStatus;
  documentSubmissionStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  documents: IPharmacyDocument[];
  openingTime: string;
  closingTime: string;
  is24Hours: boolean;
  weeklyAvailability: string[];
  supportedServices: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyDocumentSchema = new Schema<IPharmacyDocument>(
  {
    documentType: {
      type: String,
      enum: ['DRUG_LICENSE', 'GST_CERTIFICATE', 'PHARMACIST_REGISTRATION', 'SHOP_ESTABLISHMENT'],
      required: true,
    },
    documentNumber: { type: String, trim: true },
    documentUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    mimeType: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { _id: true }
);

const PharmacyProfileSchema = new Schema<IPharmacyProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for pharmacy profile'],
      unique: true,
      index: true,
    },
    pharmacyName: {
      type: String,
      trim: true,
      default: 'HealthBridge Pharmacy Partner',
      index: true,
    },
    pharmacyLicenseNumber: {
      type: String,
      required: [true, 'Pharmacy drug license number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    issuingAuthority: {
      type: String,
      trim: true,
      default: 'State Drugs Standard Control Organization',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    address: {
      line1: { type: String, trim: true },
      city: { type: String, trim: true, default: 'New Delhi' },
      state: { type: String, trim: true, default: 'Delhi' },
      postalCode: { type: String, trim: true, default: '110001' },
      country: { type: String, trim: true, default: 'India' },
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    documentSubmissionStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'VERIFIED', 'REJECTED'],
      default: 'NOT_SUBMITTED',
      index: true,
    },
    documents: {
      type: [PharmacyDocumentSchema],
      default: [],
    },
    openingTime: {
      type: String,
      default: '08:00',
    },
    closingTime: {
      type: String,
      default: '22:00',
    },
    is24Hours: {
      type: Boolean,
      default: false,
    },
    weeklyAvailability: {
      type: [String],
      default: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    },
    supportedServices: {
      type: [String],
      default: ['IN_STORE_PICKUP', 'PRESCRIPTION_REFILL'],
    },
  },
  {
    timestamps: true,
    collection: 'pharmacyProfiles',
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

export const PharmacyProfileModel: Model<IPharmacyProfileDocument> =
  (mongoose.models.PharmacyProfile as Model<IPharmacyProfileDocument>) ||
  mongoose.model<IPharmacyProfileDocument>('PharmacyProfile', PharmacyProfileSchema);

export default PharmacyProfileModel;
