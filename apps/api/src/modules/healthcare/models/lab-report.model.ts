import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  LabResultInterpretation,
  LabTestCategory,
  LabReportStatus,
  ReportReviewDecision,
} from '@healthbridge/shared-types';

export interface ILabObservationDocument {
  parameterCode?: string;
  testName: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  interpretation: LabResultInterpretation | 'ABNORMAL' | 'CRITICAL';
  flag?: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
  method?: string;
  observationDate?: Date;
  notes?: string;
}

export interface ILaboratoryReportDocument extends Document {
  reportNumber: string;
  patientId: Types.ObjectId;
  laboratoryId: Types.ObjectId;
  orderId?: Types.ObjectId;
  doctorId?: Types.ObjectId;
  facilityId?: Types.ObjectId;
  testName: string;
  category: LabTestCategory;
  testDate: Date;
  publishedAt?: Date;
  status: LabReportStatus;
  currentVersion: number;
  tests: {
    testCode: string;
    testName: string;
    specimenType?: string;
    category?: string;
  }[];
  observations: ILabObservationDocument[];
  reportUrl: string;
  documentHash?: string;
  documentMimeType?: string;
  documentFileSize?: number;
  documentBuffer?: Buffer;
  verificationStatus?: string;
  clinicalNotes?: string;
  interpretation?: string;
  reviewDetails?: {
    reviewerId: Types.ObjectId;
    reviewerName: string;
    reviewerRole?: string;
    reviewedAt: Date;
    decision: ReportReviewDecision;
    comments: string;
  };
  approvalDetails?: {
    approvedById: Types.ObjectId;
    approvedByName: string;
    approvedByDesignation?: string;
    approvedByRegistrationNumber?: string;
    approvedAt: Date;
    comments?: string;
  };
  publicationDetails?: {
    publishedById: Types.ObjectId;
    publishedByName: string;
    publishedAt: Date;
    publicationMethod?: string;
  };
  signatureMetadata?: {
    signerId: Types.ObjectId;
    signerName: string;
    signerRole: string;
    signingMethod: 'INTERNAL_CRYPTOGRAPHIC_HASH' | 'METADATA_ATTESTATION';
    signedAt: Date;
    documentHash: string;
    versionHash: string;
    verificationStatus: 'VERIFIED_INTERNAL' | 'PENDING' | 'REJECTED';
  };
  amendmentDetails?: {
    isAmended: boolean;
    amendedAt?: Date;
    amendedById?: Types.ObjectId;
    amendedByName?: string;
    amendmentReason?: string;
    supersedesReportId?: Types.ObjectId;
    supersededVersion?: number;
    changedFields?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const LabObservationSchema = new Schema<ILabObservationDocument>(
  {
    parameterCode: { type: String, trim: true, uppercase: true },
    testName: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    numericValue: { type: Number },
    unit: { type: String, required: true, trim: true },
    referenceRange: { type: String, required: true, trim: true },
    interpretation: {
      type: String,
      enum: ['NORMAL', 'ABOVE_RANGE', 'BELOW_RANGE', 'NOT_AVAILABLE', 'ABNORMAL', 'CRITICAL'],
      default: 'NORMAL',
      required: true,
    },
    flag: { type: String, default: 'NORMAL' },
    isAbnormal: { type: Boolean, default: false },
    isCritical: { type: Boolean, default: false },
    method: { type: String, trim: true },
    observationDate: {
      type: Date,
      default: Date.now,
    },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const LaboratoryReportSchema = new Schema<ILaboratoryReportDocument>(
  {
    reportNumber: {
      type: String,
      required: [true, 'Report reference number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Laboratory ID reference is required'],
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryOrder',
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    testName: {
      type: String,
      required: [true, 'Diagnostic test name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'HEMATOLOGY',
        'BIOCHEMISTRY',
        'CLINICAL_PATHOLOGY',
        'MICROBIOLOGY',
        'SEROLOGY',
        'IMMUNOLOGY',
        'MOLECULAR_DIAGNOSTICS',
        'RADIOLOGY',
        'BLOOD_TESTS',
        'URINE_TESTS',
        'IMAGING',
        'OTHER',
      ],
      default: 'BIOCHEMISTRY',
      required: true,
      index: true,
    },
    testDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'GENERATED',
        'PENDING_REVIEW',
        'UNDER_REVIEW',
        'APPROVED',
        'PUBLISHED',
        'AMENDED',
        'CANCELLED',
        'COMPLETED',
        'PENDING',
        'PRELIMINARY',
      ],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },
    tests: [
      {
        testCode: { type: String, required: true, uppercase: true },
        testName: { type: String, required: true },
        specimenType: { type: String },
        category: { type: String },
      },
    ],
    observations: {
      type: [LabObservationSchema],
      default: [],
    },
    reportUrl: {
      type: String,
      required: [true, 'Diagnostic report URL/storage reference is required'],
      trim: true,
    },
    documentHash: {
      type: String,
      trim: true,
    },
    documentMimeType: {
      type: String,
      default: 'application/pdf',
      trim: true,
    },
    documentFileSize: {
      type: Number,
      default: 524288,
    },
    documentBuffer: {
      type: Buffer,
      select: false, // Don't return heavy buffer in standard queries
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'PRELIMINARY'],
      default: 'VERIFIED',
    },
    clinicalNotes: {
      type: String,
      trim: true,
    },
    interpretation: {
      type: String,
      trim: true,
    },
    reviewDetails: {
      reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewerName: { type: String },
      reviewerRole: { type: String },
      reviewedAt: { type: Date },
      decision: { type: String, enum: ['APPROVED', 'REJECTED', 'CORRECTION_REQUESTED'] },
      comments: { type: String },
    },
    approvalDetails: {
      approvedById: { type: Schema.Types.ObjectId, ref: 'User' },
      approvedByName: { type: String },
      approvedByDesignation: { type: String },
      approvedByRegistrationNumber: { type: String },
      approvedAt: { type: Date },
      comments: { type: String },
    },
    publicationDetails: {
      publishedById: { type: Schema.Types.ObjectId, ref: 'User' },
      publishedByName: { type: String },
      publishedAt: { type: Date },
      publicationMethod: { type: String, default: 'INTERNAL_LIMS' },
    },
    signatureMetadata: {
      signerId: { type: Schema.Types.ObjectId, ref: 'User' },
      signerName: { type: String },
      signerRole: { type: String },
      signingMethod: {
        type: String,
        enum: ['INTERNAL_CRYPTOGRAPHIC_HASH', 'METADATA_ATTESTATION'],
        default: 'INTERNAL_CRYPTOGRAPHIC_HASH',
      },
      signedAt: { type: Date },
      documentHash: { type: String },
      versionHash: { type: String },
      verificationStatus: {
        type: String,
        enum: ['VERIFIED_INTERNAL', 'PENDING', 'REJECTED'],
        default: 'VERIFIED_INTERNAL',
      },
    },
    amendmentDetails: {
      isAmended: { type: Boolean, default: false },
      amendedAt: { type: Date },
      amendedById: { type: Schema.Types.ObjectId, ref: 'User' },
      amendedByName: { type: String },
      amendmentReason: { type: String },
      supersedesReportId: { type: Schema.Types.ObjectId, ref: 'LaboratoryReport' },
      supersededVersion: { type: Number },
      changedFields: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
    collection: 'labReports',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        delete ret.documentBuffer;
        return ret;
      },
    },
  }
);

// Compound indexes for queries and multi-tenant security
LaboratoryReportSchema.index({ patientId: 1, publishedAt: -1 });
LaboratoryReportSchema.index({ patientId: 1, status: 1 });
LaboratoryReportSchema.index({ laboratoryId: 1, status: 1 });
LaboratoryReportSchema.index({ laboratoryId: 1, orderId: 1 });
LaboratoryReportSchema.index({ doctorId: 1, status: 1 });

export const LaboratoryReportModel: Model<ILaboratoryReportDocument> =
  (mongoose.models.LaboratoryReport as Model<ILaboratoryReportDocument>) ||
  mongoose.model<ILaboratoryReportDocument>('LaboratoryReport', LaboratoryReportSchema);

export default LaboratoryReportModel;
