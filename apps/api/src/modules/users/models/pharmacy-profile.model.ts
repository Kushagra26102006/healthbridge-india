import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { VerificationStatus } from '@healthbridge/shared-types';

export interface IPharmacyProfileDocument extends Document {
  userId: Types.ObjectId;
  pharmacyLicenseNumber: string;
  facilityId?: Types.ObjectId;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyProfileSchema = new Schema<IPharmacyProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for pharmacy profile'],
      unique: true,
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
