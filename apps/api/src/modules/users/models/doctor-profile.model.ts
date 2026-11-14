import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { VerificationStatus } from '@healthbridge/shared-types';

export interface IDoctorCredentialDocument {
  id?: string;
  _id?: Types.ObjectId;
  documentType: 'MEDICAL_REGISTRATION' | 'QUALIFICATION' | 'IDENTITY' | 'EXPERIENCE_CERTIFICATE' | 'OTHER';
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: VerificationStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface IDoctorProfileDocument extends Document {
  userId: Types.ObjectId;
  registrationNumber: string;
  specialization: string[];
  qualifications: string[];
  experience: number;
  verificationStatus: VerificationStatus;
  facilityId?: Types.ObjectId;
  consultationModes: ('IN_PERSON' | 'TELECONSULTATION')[];
  bio?: string;
  languages?: string[];
  consultationFee?: number;
  profileImage?: string;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  slotDurationMinutes?: number;
  blockedSlots?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }>;
  professionalInterests?: string[];
  documents?: IDoctorCredentialDocument[];
  notificationPreferences?: {
    newAppointmentRequests: { inApp: boolean; email: boolean; sms: boolean };
    appointmentChanges: { inApp: boolean; email: boolean; sms: boolean };
    patientCheckIns: { inApp: boolean; email: boolean; sms: boolean };
    consultationReminders: { inApp: boolean; email: boolean; sms: boolean };
    clinicalWorkflowAlerts: { inApp: boolean; email: boolean; sms: boolean };
    securityAlerts: { inApp: boolean; email: boolean; sms: boolean };
  };
  practiceSettings?: {
    autoConfirmAppointments: boolean;
    maxDailyPatients?: number;
    teleconsultationLink?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DoctorProfileSchema = new Schema<IDoctorProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for doctor profile'],
      unique: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Medical Council Registration Number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    specialization: {
      type: [String],
      required: [true, 'At least one medical specialization is required'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'At least one medical specialization is required',
      },
      index: true,
    },
    qualifications: {
      type: [String],
      required: [true, 'At least one medical qualification is required'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'At least one qualification is required',
      },
    },
    experience: {
      type: Number,
      required: [true, 'Years of clinical experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    consultationModes: {
      type: [String],
      enum: ['IN_PERSON', 'TELECONSULTATION'],
      default: ['IN_PERSON', 'TELECONSULTATION'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [2000, 'Bio cannot exceed 2000 characters'],
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    consultationFee: {
      type: Number,
      min: [0, 'Consultation fee cannot be negative'],
      default: 500,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    workingDays: {
      type: [String],
      default: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: 10,
      max: 120,
    },
    blockedSlots: [
      {
        date: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        reason: { type: String, trim: true },
      },
    ],
    professionalInterests: {
      type: [String],
      default: [],
    },
    documents: [
      {
        documentType: {
          type: String,
          enum: ['MEDICAL_REGISTRATION', 'QUALIFICATION', 'IDENTITY', 'EXPERIENCE_CERTIFICATE', 'OTHER'],
          required: true,
        },
        title: { type: String, required: true, trim: true },
        fileName: { type: String, required: true, trim: true },
        fileUrl: { type: String, required: true, trim: true },
        mimeType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        verificationStatus: {
          type: String,
          enum: ['PENDING', 'VERIFIED', 'REJECTED'],
          default: 'PENDING',
        },
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: { type: Date },
        rejectionReason: { type: String, trim: true },
      },
    ],
    notificationPreferences: {
      newAppointmentRequests: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      appointmentChanges: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      patientCheckIns: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      },
      consultationReminders: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      clinicalWorkflowAlerts: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      },
      securityAlerts: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
    },
    practiceSettings: {
      autoConfirmAppointments: { type: Boolean, default: false },
      maxDailyPatients: { type: Number, default: 30 },
      teleconsultationLink: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    collection: 'doctorProfiles',
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

DoctorProfileSchema.index({ specialization: 1, verificationStatus: 1 });

export const DoctorProfileModel: Model<IDoctorProfileDocument> =
  (mongoose.models.DoctorProfile as Model<IDoctorProfileDocument>) ||
  mongoose.model<IDoctorProfileDocument>('DoctorProfile', DoctorProfileSchema);

export default DoctorProfileModel;
