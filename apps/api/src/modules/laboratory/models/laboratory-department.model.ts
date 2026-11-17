import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ILaboratoryDepartmentDocument extends Document {
  laboratoryId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  headOfDepartmentId?: Types.ObjectId;
  isActive: boolean;
  contactExtension?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratoryDepartmentSchema = new Schema<ILaboratoryDepartmentDocument>(
  {
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: [true, 'Associated laboratory profile ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    headOfDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryStaff',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    contactExtension: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'laboratoryDepartments',
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

LaboratoryDepartmentSchema.index({ laboratoryId: 1, code: 1 }, { unique: true });

export const LaboratoryDepartmentModel: Model<ILaboratoryDepartmentDocument> =
  (mongoose.models.LaboratoryDepartment as Model<ILaboratoryDepartmentDocument>) ||
  mongoose.model<ILaboratoryDepartmentDocument>('LaboratoryDepartment', LaboratoryDepartmentSchema);

export default LaboratoryDepartmentModel;
