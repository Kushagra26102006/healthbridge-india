import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  LabTestCategory,
  SpecimenType,
  ParameterDataType,
} from '@healthbridge/shared-types';

export interface IReferenceRangeSubdocument {
  gender?: 'ALL' | 'MALE' | 'FEMALE';
  ageMinYears?: number;
  ageMaxYears?: number;
  normalMin?: number;
  normalMax?: number;
  criticalLow?: number;
  criticalHigh?: number;
  unit: string;
  textualInterpretation?: string;
  version: number;
  effectiveDate?: Date;
  source?: string;
  isActive: boolean;
}

export interface ITestParameterSubdocument {
  parameterName: string;
  parameterCode: string;
  dataType: ParameterDataType;
  unit?: string;
  decimalPrecision?: number;
  qualitativeOptions?: string[];
  referenceRanges: IReferenceRangeSubdocument[];
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface ILabTestDocument extends Document {
  laboratoryId: Types.ObjectId;
  facilityId?: Types.ObjectId;
  testName: string;
  testCode: string;
  category: LabTestCategory;
  description?: string;
  specimenType: SpecimenType;
  collectionMethod?: string;
  preparationInstructions?: string;
  containerRequirements?: string;
  fastingRequirement: boolean;
  fastingDurationHours?: number;
  expectedTurnaroundTime: string;
  price: number;
  isActive: boolean;
  performingDepartment?: string;
  parameters: ITestParameterSubdocument[];
  referenceRanges: IReferenceRangeSubdocument[];
  createdAt: Date;
  updatedAt: Date;
}

const ReferenceRangeSchema = new Schema<IReferenceRangeSubdocument>(
  {
    gender: {
      type: String,
      enum: ['ALL', 'MALE', 'FEMALE'],
      default: 'ALL',
    },
    ageMinYears: { type: Number, min: 0 },
    ageMaxYears: { type: Number, max: 150 },
    normalMin: { type: Number },
    normalMax: { type: Number },
    criticalLow: { type: Number },
    criticalHigh: { type: Number },
    unit: { type: String, required: true, trim: true },
    textualInterpretation: { type: String, trim: true },
    version: { type: Number, default: 1 },
    effectiveDate: { type: Date, default: Date.now },
    source: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const TestParameterSchema = new Schema<ITestParameterSubdocument>(
  {
    parameterName: { type: String, required: true, trim: true },
    parameterCode: { type: String, required: true, trim: true, uppercase: true },
    dataType: {
      type: String,
      enum: ['NUMERIC', 'TEXT', 'BOOLEAN', 'QUALITATIVE', 'DATE'],
      required: true,
    },
    unit: { type: String, trim: true },
    decimalPrecision: { type: Number, default: 2 },
    qualitativeOptions: [{ type: String, trim: true }],
    referenceRanges: [ReferenceRangeSchema],
    isRequired: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const LabTestSchema = new Schema<ILabTestDocument>(
  {
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryProfile',
      required: [true, 'Laboratory reference is required'],
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
      index: true,
    },
    testCode: {
      type: String,
      required: [true, 'Unique test code is required'],
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Test category is required'],
      index: true,
    },
    description: { type: String, trim: true },
    specimenType: {
      type: String,
      required: [true, 'Specimen type is required'],
      index: true,
    },
    collectionMethod: { type: String, trim: true },
    preparationInstructions: { type: String, trim: true },
    containerRequirements: { type: String, trim: true },
    fastingRequirement: { type: Boolean, default: false },
    fastingDurationHours: { type: Number, min: 0 },
    expectedTurnaroundTime: {
      type: String,
      required: [true, 'Expected turnaround time is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Test price is required'],
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    performingDepartment: { type: String, trim: true },
    parameters: [TestParameterSchema],
    referenceRanges: [ReferenceRangeSchema],
  },
  {
    timestamps: true,
    collection: 'labTests',
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

// Compound Unique Index: Test code must be unique within a laboratory scope
LabTestSchema.index({ laboratoryId: 1, testCode: 1 }, { unique: true });
LabTestSchema.index({ laboratoryId: 1, category: 1 });
LabTestSchema.index({ laboratoryId: 1, isActive: 1 });
LabTestSchema.index({ testName: 'text', testCode: 'text', description: 'text' });

export const LabTestModel: Model<ILabTestDocument> =
  (mongoose.models.LabTest as Model<ILabTestDocument>) ||
  mongoose.model<ILabTestDocument>('LabTest', LabTestSchema);

export default LabTestModel;
