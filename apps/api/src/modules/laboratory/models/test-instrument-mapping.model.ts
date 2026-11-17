import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IReagentRequirement {
  reagentId: Types.ObjectId;
  requiredQuantityPerTest: number;
}

export interface ITestInstrumentMappingDocument extends Document {
  laboratoryId: Types.ObjectId;
  testCode: string;
  instrumentId: Types.ObjectId;
  isPrimary: boolean;
  reagentRequirements: IReagentRequirement[];
  qcProfileId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReagentRequirementSchema = new Schema<IReagentRequirement>(
  {
    reagentId: { type: Schema.Types.ObjectId, ref: 'Reagent', required: true },
    requiredQuantityPerTest: { type: Number, required: true, positive: true },
  },
  { _id: false }
);

const TestInstrumentMappingSchema = new Schema<ITestInstrumentMappingDocument>(
  {
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    testCode: { type: String, required: true, uppercase: true, trim: true },
    instrumentId: { type: Schema.Types.ObjectId, ref: 'LabInstrument', required: true, index: true },
    isPrimary: { type: Boolean, default: false },
    reagentRequirements: [ReagentRequirementSchema],
    qcProfileId: { type: Schema.Types.ObjectId, ref: 'QCProfile' },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

TestInstrumentMappingSchema.index(
  { laboratoryId: 1, testCode: 1, instrumentId: 1 },
  { unique: true }
);

export const TestInstrumentMappingModel: Model<ITestInstrumentMappingDocument> =
  mongoose.models.TestInstrumentMapping ||
  mongoose.model<ITestInstrumentMappingDocument>(
    'TestInstrumentMapping',
    TestInstrumentMappingSchema
  );
