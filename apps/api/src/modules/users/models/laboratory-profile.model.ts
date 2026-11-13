import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { VerificationStatus } from '@healthbridge/shared-types';

export interface ILaboratoryProfileDocument extends Document {
  userId: Types.ObjectId;
  laboratoryLicenseNumber: string;
  facilityId?: Types.ObjectId;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratoryProfileSchema = new Schema<ILaboratoryProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for laboratory profile'],
      unique: true,
      index: true,
    },
    laboratoryLicenseNumber: {
      type: String,
      required: [true, 'Diagnostic laboratory license number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
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
