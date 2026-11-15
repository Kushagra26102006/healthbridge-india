import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ICollectionCenterDocument extends Document {
  laboratoryId: Types.ObjectId;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPhone: string;
  contactEmail?: string;
  contactPerson?: string;
  operatingHours?: string;
  collectionServices?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionCenterSchema = new Schema<ICollectionCenterDocument>(
  {
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: [true, 'Laboratory reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Collection center name is required'],
      trim: true,
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPerson: { type: String, trim: true },
    operatingHours: { type: String, trim: true },
    collectionServices: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'collectionCenters',
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

CollectionCenterSchema.index({ laboratoryId: 1, name: 1 }, { unique: true });

export const CollectionCenterModel: Model<ICollectionCenterDocument> =
  (mongoose.models.CollectionCenter as Model<ICollectionCenterDocument>) ||
  mongoose.model<ICollectionCenterDocument>('CollectionCenter', CollectionCenterSchema);

export default CollectionCenterModel;
