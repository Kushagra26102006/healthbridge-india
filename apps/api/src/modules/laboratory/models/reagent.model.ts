import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  ReagentStorageCondition,
  ReagentLotStatus,
} from '@healthbridge/shared-types';

export interface IReagentDocument extends Document {
  laboratoryId: Types.ObjectId;
  reagentCode: string;
  name: string;
  manufacturer: string;
  catalogNumber: string;
  category: 'REAGENT' | 'CALIBRATOR' | 'CONTROL' | 'BUFFER' | 'STAIN' | 'CONSUMABLE';
  storageConditions: ReagentStorageCondition;
  unit: string;
  minimumStockLevel: number;
  currentStock: number;
  associatedTestCodes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReagentSchema = new Schema<IReagentDocument>(
  {
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    reagentCode: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    catalogNumber: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['REAGENT', 'CALIBRATOR', 'CONTROL', 'BUFFER', 'STAIN', 'CONSUMABLE'],
      required: true,
      default: 'REAGENT',
    },
    storageConditions: {
      type: String,
      enum: [
        'ROOM_TEMPERATURE',
        'REFRIGERATED_2_8C',
        'FROZEN_MINUS_20C',
        'DEEP_FREEZE_MINUS_80C',
      ],
      required: true,
      default: 'REFRIGERATED_2_8C',
    },
    unit: { type: String, required: true, trim: true },
    minimumStockLevel: { type: Number, required: true, min: 0, default: 5 },
    currentStock: { type: Number, required: true, min: 0, default: 0 },
    associatedTestCodes: [{ type: String, uppercase: true, trim: true }],
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

ReagentSchema.index({ laboratoryId: 1, reagentCode: 1 }, { unique: true });
ReagentSchema.index({ laboratoryId: 1, currentStock: 1 });
ReagentSchema.index({ laboratoryId: 1, associatedTestCodes: 1 });

export const ReagentModel: Model<IReagentDocument> =
  mongoose.models.Reagent || mongoose.model<IReagentDocument>('Reagent', ReagentSchema);

export interface IReagentLotDocument extends Document {
  reagentId: Types.ObjectId;
  reagentName: string;
  laboratoryId: Types.ObjectId;
  lotNumber: string;
  manufacturer: string;
  receivedDate: Date;
  expiryDate: Date;
  openedDate?: Date;
  initialQuantity: number;
  availableQuantity: number;
  unit: string;
  storageLocation: string;
  status: ReagentLotStatus;
  supplierName?: string;
  quarantineReason?: string;
  recalledAt?: Date;
  recalledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReagentLotSchema = new Schema<IReagentLotDocument>(
  {
    reagentId: { type: Schema.Types.ObjectId, ref: 'Reagent', required: true, index: true },
    reagentName: { type: String, required: true, trim: true },
    laboratoryId: { type: Schema.Types.ObjectId, ref: 'Facility', required: true, index: true },
    lotNumber: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    receivedDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true, index: true },
    openedDate: { type: Date },
    initialQuantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    storageLocation: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'QUARANTINED', 'RECALLED', 'DEPLETED'],
      required: true,
      default: 'ACTIVE',
      index: true,
    },
    supplierName: { type: String, trim: true },
    quarantineReason: { type: String, trim: true },
    recalledAt: { type: Date },
    recalledReason: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

ReagentLotSchema.index({ laboratoryId: 1, reagentId: 1, lotNumber: 1 }, { unique: true });
ReagentLotSchema.index({ laboratoryId: 1, status: 1, expiryDate: 1 });

export const ReagentLotModel: Model<IReagentLotDocument> =
  mongoose.models.ReagentLot ||
  mongoose.model<IReagentLotDocument>('ReagentLot', ReagentLotSchema);
