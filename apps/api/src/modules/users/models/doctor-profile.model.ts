import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { VerificationStatus } from '@healthbridge/shared-types';

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
