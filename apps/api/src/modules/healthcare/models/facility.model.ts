import mongoose, { Document, Model, Schema } from 'mongoose';
import { FacilityType, Address } from '@healthbridge/shared-types';

export interface IFacilityDocument extends Document {
  name: string;
  facilityType: FacilityType;
  hfrId?: string;
  address: Address;
  contactPhone: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<Address>(
  {
    line1: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const FacilitySchema = new Schema<IFacilityDocument>(
  {
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
      index: true,
    },
    facilityType: {
      type: String,
      enum: ['HOSPITAL', 'CLINIC', 'DIAGNOSTIC_CENTRE', 'PHARMACY'],
      required: [true, 'Facility type is required'],
      index: true,
    },
    hfrId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    address: {
      type: AddressSchema,
      required: [true, 'Facility physical address is required'],
    },
    contactPhone: {
      type: String,
      required: [true, 'Facility contact phone is required'],
      trim: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'facilities',
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

export const FacilityModel: Model<IFacilityDocument> =
  (mongoose.models.Facility as Model<IFacilityDocument>) ||
  mongoose.model<IFacilityDocument>('Facility', FacilitySchema);

export default FacilityModel;
