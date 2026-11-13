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

