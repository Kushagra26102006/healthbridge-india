/**
 * HealthBridge India — ABDM Health Information Request Model (Day 7 Task 04)
 *
 * Represents both inbound HIP Health Information Requests (`/api/v3/hip/health-information/request`)
 * and outbound HIU Health Information Requests (`/api/hiecm/data-flow/v3/health-information/request`),
 * kept strictly separated by `role: 'HIP' | 'HIU'`.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmEnvironment,
  AbdmExternalSessionStatus,
  AbdmFideliusKeyMaterialDto,
  AbdmHealthInfoType,
  AbdmHieParticipantRole,
  AbdmHieTransferState,
  AbdmPurposeCode,
} from '@healthbridge/shared-types';

export interface IAbdmHealthInformationRequestDocument extends Document {
  internalRequestRef: string;
  externalTransactionId?: string;
  role: AbdmHieParticipantRole;
  patientId: Types.ObjectId;
  requesterId: Types.ObjectId;
  requesterRole: string;
  participantId: string;
  consentArtefactId: string;
  externalConsentId: string;
  purposeCode: AbdmPurposeCode;
  hiTypes: AbdmHealthInfoType[];
  dateRange: {
    from: Date;
    to: Date;
  };
  dataPushUrl?: string;
  peerKeyMaterial?: AbdmFideliusKeyMaterialDto;
  status: AbdmHieTransferState;
  externalSessionStatus?: AbdmExternalSessionStatus;
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  failureCode?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmHealthInformationRequestSchema = new Schema<IAbdmHealthInformationRequestDocument>(
  {
    internalRequestRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
    },
    externalTransactionId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['HIP', 'HIU'],
      required: true,
      index: true,
      immutable: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterRole: {
      type: String,
      required: true,
      trim: true,
    },
    participantId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    consentArtefactId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    externalConsentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    purposeCode: {
      type: String,
      required: true,
      trim: true,
    },
    hiTypes: {
      type: [String],
      required: true,
      default: [],
    },
    dateRange: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    dataPushUrl: {
      type: String,
      trim: true,
    },
    peerKeyMaterial: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'DISCOVERY_PENDING',
        'DISCOVERY_COMPLETED',
        'LINKING_PENDING',
        'CONSENT_PENDING',
        'AUTHORIZED',
        'REQUEST_SUBMITTED',
        'TRANSFER_PENDING',
        'TRANSFER_RECEIVED',
        'VALIDATION_PENDING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
        'REQUIRES_REVIEW',
      ],
      required: true,
      default: 'DRAFT',
      index: true,
    },
    externalSessionStatus: {
      type: String,
      enum: [
        'REQUESTED',
        'ACKNOWLEDGED',
        'TRANSFERRED',
        'PARTIAL_TRANSFERRED',
        'RECEIVED',
        'FAILED',
        'EXPIRED',
        'UNKNOWN',
      ],
    },
    correlationId: {
      type: String,
      required: true,
      index: true,
    },
    environment: {
      type: String,
      enum: ['disabled', 'development', 'sandbox', 'production'],
      required: true,
      default: 'development',
      index: true,
    },
    isMocked: {
      type: Boolean,
      required: true,
      default: true,
    },
    failureCode: { type: String, trim: true },
    failureReason: { type: String, trim: true },
  },
  {
    timestamps: true,
    collection: 'abdm_health_information_requests',
  }
);

AbdmHealthInformationRequestSchema.index({ role: 1, patientId: 1, status: 1, createdAt: -1 });
AbdmHealthInformationRequestSchema.index(
  { role: 1, externalTransactionId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalTransactionId: { $exists: true, $type: 'string' } },
  }
);

export const AbdmHealthInformationRequestModel: Model<IAbdmHealthInformationRequestDocument> =
  mongoose.models.AbdmHealthInformationRequest ||
  mongoose.model<IAbdmHealthInformationRequestDocument>(
    'AbdmHealthInformationRequest',
    AbdmHealthInformationRequestSchema
  );
