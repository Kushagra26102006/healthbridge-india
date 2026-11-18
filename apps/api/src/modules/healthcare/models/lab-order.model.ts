import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  LabOrderStatus,
  LabOrderPriority,
  SpecimenType,
  TestAssignmentStatus,
  OrderRejectionReason,
} from '@healthbridge/shared-types';

export interface ILabOrderItemDocument {
  testCode: string;
  testName: string;
  category?: string;
  specimenType?: SpecimenType;
  instructions?: string;
}

export interface ITestAssignmentDocument {
  testCode: string;
  testName: string;
  testId?: Types.ObjectId;
  department?: string;
  facilityId?: Types.ObjectId;
  specimenType: SpecimenType;
  collectionMethod?: string;
  collectionInstructions?: string;
  priority?: LabOrderPriority;
  status: TestAssignmentStatus;
  assignedTechnicianId?: Types.ObjectId;
  assignedTechnicianName?: string;
  assignedAt?: Date;
  assignedBy?: Types.ObjectId;
}

export interface ILabOrderStatusHistoryDocument {
  status: string;
  changedBy: Types.ObjectId;
  changedByName?: string;
  timestamp: Date;
  reason?: string;
}

export interface ILaboratoryOrderDocument extends Document {
  orderNumber: string;
  patientId: Types.ObjectId;
  orderedBy: Types.ObjectId;
  encounterId?: Types.ObjectId;
  laboratoryId?: Types.ObjectId;
  facilityId?: Types.ObjectId;
  idempotencyKey?: string;
  tests: ILabOrderItemDocument[];
  testAssignments?: ITestAssignmentDocument[];
  status: LabOrderStatus;
  priority?: LabOrderPriority;
  collectionStatus?: string;
  orderedAt: Date;
  requestedCollectionDate?: Date;
  acceptedAt?: Date;
  rejectionReasonCode?: OrderRejectionReason;
  rejectionReason?: string;
  clarificationNotes?: string;
  reportId?: Types.ObjectId;
  clinicalNotes?: string;
  statusHistory?: ILabOrderStatusHistoryDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const LabTestItemSchema = new Schema<ILabOrderItemDocument>(
  {
    testCode: { type: String, required: true, trim: true },
    testName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    specimenType: { type: String, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const TestAssignmentSchema = new Schema<ITestAssignmentDocument>(
  {
    testCode: { type: String, required: true, trim: true },
    testName: { type: String, required: true, trim: true },
    testId: { type: Schema.Types.ObjectId, ref: 'LabTest' },
    department: { type: String, trim: true },
    facilityId: { type: Schema.Types.ObjectId, ref: 'Facility' },
    specimenType: { type: String, required: true, trim: true },
    collectionMethod: { type: String, trim: true },
    collectionInstructions: { type: String, trim: true },
    priority: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'STAT', 'EMERGENCY'],
      default: 'ROUTINE',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROCESSING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    assignedTechnicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedTechnicianName: { type: String, trim: true },
    assignedAt: { type: Date },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const LabOrderStatusHistorySchema = new Schema<ILabOrderStatusHistoryDocument>(
  {
    status: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedByName: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
    reason: { type: String, trim: true },
  },
  { _id: false }
);

const LaboratoryOrderSchema = new Schema<ILaboratoryOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order reference number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    orderedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ordering physician ID reference is required'],
      index: true,
    },
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: 'Encounter',
      index: true,
    },
    laboratoryId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      index: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    tests: {
      type: [LabTestItemSchema],
      required: [true, 'At least one diagnostic test is required'],
      validate: {
        validator: (tests: ILabOrderItemDocument[]) => tests.length > 0,
        message: 'Order must contain at least one test item',
      },
    },
    testAssignments: [TestAssignmentSchema],
    status: {
      type: String,
      enum: [
        'ORDERED',
        'ACCEPTED',
        'SAMPLE_COLLECTED',
        'IN_ANALYSIS',
        'COMPLETED',
        'CANCELLED',
        'REJECTED',
        'CLARIFICATION_REQUESTED',
      ],
      default: 'ORDERED',
      index: true,
    },
    priority: {
      type: String,
      enum: ['ROUTINE', 'URGENT', 'STAT', 'EMERGENCY'],
      default: 'ROUTINE',
      index: true,
    },
    collectionStatus: {
      type: String,
      enum: [
        'PENDING',
        'COLLECTED',
        'RECEIVED',
        'ACCESSIONED',
        'REJECTED',
        'NOT_REQUIRED',
      ],
      default: 'PENDING',
      index: true,
    },
    orderedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    requestedCollectionDate: { type: Date },
    acceptedAt: { type: Date },
    rejectionReasonCode: {
      type: String,
      enum: [
        'TEST_NOT_AVAILABLE',
        'INVALID_ORDER',
        'INSUFFICIENT_INFORMATION',
        'FACILITY_UNAVAILABLE',
        'SPECIMEN_REQUIREMENT_UNSUPPORTED',
        'OTHER',
      ],
    },
    rejectionReason: { type: String, trim: true },
    clarificationNotes: { type: String, trim: true },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'LaboratoryReport',
      index: true,
    },
    clinicalNotes: {
      type: String,
      trim: true,
    },
    statusHistory: [LabOrderStatusHistorySchema],
  },
  {
    timestamps: true,
    collection: 'labOrders',
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

LaboratoryOrderSchema.index({ laboratoryId: 1, status: 1 });
LaboratoryOrderSchema.index({ laboratoryId: 1, orderedAt: -1 });
LaboratoryOrderSchema.index({ patientId: 1, orderedAt: -1 });
LaboratoryOrderSchema.index({ patientId: 1, status: 1 });

export const LaboratoryOrderModel: Model<ILaboratoryOrderDocument> =
  (mongoose.models.LaboratoryOrder as Model<ILaboratoryOrderDocument>) ||
  mongoose.model<ILaboratoryOrderDocument>('LaboratoryOrder', LaboratoryOrderSchema);

export default LaboratoryOrderModel;
