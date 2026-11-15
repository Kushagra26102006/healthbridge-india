import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  VerificationStatus,
  LabDocumentSubmissionStatus,
  LabFacilityType,
  LaboratoryDocumentType,
} from '@healthbridge/shared-types';

export interface ILaboratoryDocumentSubdocument {
  documentId: string;
  documentType: LaboratoryDocumentType;
  documentNumber: string;
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
}

export interface ILaboratoryOperatingHoursSubdocument {
  dayOfWeek: string;
  isOpen: boolean;
  is24Hours: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface ILaboratoryProfileDocument extends Document {
  userId: Types.ObjectId;
  laboratoryName: string;
  laboratoryLicenseNumber: string;
  registrationNumber?: string;
  facilityId?: Types.ObjectId;
  logo?: string;
  description?: string;
  contactEmail?: string;
  contactPhone: string;
  websiteUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  licenseIssueDate?: Date;
  licenseExpiryDate?: Date;
  issuingAuthority?: string;
  accreditationInfo?: {
    nablAccredited: boolean;
    nablCertificateNumber?: string;
    nablExpiryDate?: Date;
    capAccredited?: boolean;
    icmrApproved?: boolean;
    isoCertified?: boolean;
  };
  facilityName: string;
  facilityType: LabFacilityType;
  collectionCenterDetails?: {
    name: string;
    address: string;
    phone: string;
    contactPerson?: string;
    operatingHours?: string;
  }[];
  operatingHours?: ILaboratoryOperatingHoursSubdocument[];
  supportedDiagnosticServices: string[];
  verificationStatus: VerificationStatus;
  documentSubmissionStatus: LabDocumentSubmissionStatus;
  documents: ILaboratoryDocumentSubdocument[];
  createdAt: Date;
  updatedAt: Date;
}

const LaboratoryDocumentSchema = new Schema<ILaboratoryDocumentSubdocument>(
  {
    documentId: { type: String, required: true },
    documentType: {
      type: String,
      enum: [
        'REGISTRATION_CERTIFICATE',
        'CLINICAL_ESTABLISHMENT_LICENSE',
        'NABL_ACCREDITATION',
        'ICMR_APPROVAL',
        'POLLUTION_CONTROL_NOC',
        'BIO_MEDICAL_WASTE_CERTIFICATE',
        'OTHER',
      ],
      required: true,
    },
    documentNumber: { type: String, required: true, trim: true },
    documentUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String },
  },
  { _id: false }
);

const LaboratoryOperatingHoursSchema = new Schema<ILaboratoryOperatingHoursSubdocument>(
  {
    dayOfWeek: { type: String, required: true },
    isOpen: { type: Boolean, default: true },
    is24Hours: { type: Boolean, default: false },
    openTime: { type: String },
    closeTime: { type: String },
  },
  { _id: false }
);

const LaboratoryProfileSchema = new Schema<ILaboratoryProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for laboratory profile'],
      unique: true,
      index: true,
    },
    laboratoryName: {
      type: String,
      required: [true, 'Diagnostic laboratory trading name is required'],
      trim: true,
      default: 'HealthBridge Diagnostic Laboratory',
    },
    laboratoryLicenseNumber: {
      type: String,
      required: [true, 'Diagnostic laboratory license number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    logo: { type: String },
    description: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      default: '9999999999',
    },
    websiteUrl: { type: String },
    address: {
      street: { type: String, default: 'Medical Enclave' },
      city: { type: String, default: 'New Delhi' },
      state: { type: String, default: 'Delhi' },
      postalCode: { type: String, default: '110001' },
      country: { type: String, default: 'India' },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    licenseIssueDate: { type: Date },
    licenseExpiryDate: { type: Date },
    issuingAuthority: { type: String, trim: true },
    accreditationInfo: {
      nablAccredited: { type: Boolean, default: false },
      nablCertificateNumber: { type: String, trim: true },
      nablExpiryDate: { type: Date },
      capAccredited: { type: Boolean, default: false },
      icmrApproved: { type: Boolean, default: false },
      isoCertified: { type: Boolean, default: false },
    },
    facilityName: {
      type: String,
      required: [true, 'Facility name is required'],
      default: 'Central Diagnostic Laboratory',
    },
    facilityType: {
      type: String,
      enum: [
        'CLINICAL_LAB',
        'PATHOLOGY_LAB',
        'DIAGNOSTIC_CENTER',
        'HOSPITAL_LAB',
        'COLLECTION_CENTER',
      ],
      default: 'DIAGNOSTIC_CENTER',
    },
    collectionCenterDetails: [
      {
        name: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        contactPerson: { type: String },
        operatingHours: { type: String },
      },
    ],
    operatingHours: [LaboratoryOperatingHoursSchema],
    supportedDiagnosticServices: {
      type: [String],
      default: [
        'HEMATOLOGY',
        'BIOCHEMISTRY',
        'CLINICAL_PATHOLOGY',
        'MICROBIOLOGY',
        'SEROLOGY',
      ],
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    documentSubmissionStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
      default: 'NOT_SUBMITTED',
      index: true,
    },
    documents: [LaboratoryDocumentSchema],
  },
  {
    timestamps: true,
    collection: 'laboratoryProfiles',
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

export const LaboratoryProfileModel: Model<ILaboratoryProfileDocument> =
  (mongoose.models.LaboratoryProfile as Model<ILaboratoryProfileDocument>) ||
  mongoose.model<ILaboratoryProfileDocument>('LaboratoryProfile', LaboratoryProfileSchema);

export default LaboratoryProfileModel;
