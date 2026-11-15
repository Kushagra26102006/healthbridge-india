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
  registrationNumber?: string;
  gstin?: string;
  issuingAuthority?: string;
  licenseIssueDate?: Date;
  licenseExpiryDate?: Date;
  timezone: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
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
  operatingHoursSchedule?: Array<{
    dayOfWeek: string;
    isOpen: boolean;
    is24Hours: boolean;
    openTime: string;
    closeTime: string;
    breaks: Array<{ breakName?: string; startTime: string; endTime: string }>;
  }>;
  temporaryClosure?: {
    isTemporarilyClosed: boolean;
    reason?: string;
    closureStartDate?: Date;
    closureEndDate?: Date;
    reopenDate?: Date;
  };
  holidays?: Array<{
    id: string;
    name: string;
    date: string;
    isClosed: boolean;
    customOpenTime?: string;
    customCloseTime?: string;
  }>;
  serviceSettings?: {
    dispensingEnabled: boolean;
    inStorePickupEnabled: boolean;
    deliveryReady: boolean;
    emergencyPrescriptionSupport: boolean;
    scheduleHDispensingEnabled: boolean;
    scheduleXDispensingEnabled: boolean;
    chronicRefillProgramEnabled: boolean;
    compoundingAvailable: boolean;
    homeDeliveryRadiusKm?: number;
    minimumOrderValueForDelivery?: number;
    deliveryFee?: number;
    freeDeliveryAbove?: number;
    estimatedPickupReadyMinutes?: number;
  };
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
    registrationNumber: {
      type: String,
      trim: true,
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
    licenseIssueDate: {
      type: Date,
    },
    licenseExpiryDate: {
      type: Date,
    },
    timezone: {
      type: String,
      trim: true,
      default: 'Asia/Kolkata',
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
    websiteUrl: {
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
    operatingHoursSchedule: {
      type: [
        {
          dayOfWeek: {
            type: String,
            enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
            required: true,
          },
          isOpen: { type: Boolean, default: true },
          is24Hours: { type: Boolean, default: false },
          openTime: { type: String, default: '08:00' },
          closeTime: { type: String, default: '22:00' },
          breaks: [
            {
              breakName: { type: String, trim: true },
              startTime: { type: String, required: true },
              endTime: { type: String, required: true },
            },
          ],
        },
      ],
      default: [
        { dayOfWeek: 'MONDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
        { dayOfWeek: 'TUESDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
        { dayOfWeek: 'WEDNESDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
        { dayOfWeek: 'THURSDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
        { dayOfWeek: 'FRIDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
        { dayOfWeek: 'SATURDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
        { dayOfWeek: 'SUNDAY', isOpen: false, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
      ],
    },
    temporaryClosure: {
      isTemporarilyClosed: { type: Boolean, default: false },
      reason: { type: String, trim: true },
      closureStartDate: { type: Date },
      closureEndDate: { type: Date },
      reopenDate: { type: Date },
    },
    holidays: {
      type: [
        {
          id: { type: String, default: () => new Types.ObjectId().toString() },
          name: { type: String, required: true, trim: true },
          date: { type: String, required: true },
          isClosed: { type: Boolean, default: true },
          customOpenTime: { type: String },
          customCloseTime: { type: String },
        },
      ],
      default: [],
    },
    serviceSettings: {
      dispensingEnabled: { type: Boolean, default: true },
      inStorePickupEnabled: { type: Boolean, default: true },
      deliveryReady: { type: Boolean, default: false },
      emergencyPrescriptionSupport: { type: Boolean, default: true },
      scheduleHDispensingEnabled: { type: Boolean, default: true },
      scheduleXDispensingEnabled: { type: Boolean, default: false },
      chronicRefillProgramEnabled: { type: Boolean, default: true },
      compoundingAvailable: { type: Boolean, default: false },
      homeDeliveryRadiusKm: { type: Number, default: 5 },
      minimumOrderValueForDelivery: { type: Number, default: 200 },
      deliveryFee: { type: Number, default: 30 },
      freeDeliveryAbove: { type: Number, default: 500 },
      estimatedPickupReadyMinutes: { type: Number, default: 30 },
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
