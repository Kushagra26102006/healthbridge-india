/**
 * HealthBridge India — ABDM FHIR Mapping & Validation Telemetry Model (Day 7 Task 04)
 *
 * Records FHIR R4 bundle generation / validation outcomes, unmapped fields, and warning/error
 * counts for operational observability without storing plaintext patient health information.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  AbdmEnvironment,
  AbdmHealthInfoType,
  AbdmHieParticipantRole,
  AbdmImportedRecordValidationStatus,
} from '@healthbridge/shared-types';

export interface IAbdmFhirMappingResultDocument extends Document {
  bundleId: string;
  role: AbdmHieParticipantRole;
  patientId?: Types.ObjectId;
  transferId?: Types.ObjectId;
  hiType: AbdmHealthInfoType;
  profileUrl: string;
  mappingVersion: string;
  bundleSha256: string;
  validationStatus: AbdmImportedRecordValidationStatus;
  errorCount: number;
  warningCount: number;
  errorCodes: string[];
  warningCodes: string[];
  unmappedFields: string[];
  resourceCounts: Record<string, number>;
  officialIgConformanceClaimed: boolean;
  correlationId: string;
  environment: AbdmEnvironment;
  createdAt: Date;
  updatedAt: Date;
}

const AbdmFhirMappingResultSchema = new Schema<IAbdmFhirMappingResultDocument>(
  {
    bundleId: { type: String, required: true, index: true },
    role: { type: String, enum: ['HIP', 'HIU'], required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    transferId: { type: Schema.Types.ObjectId, ref: 'AbdmHealthInformationTransfer', index: true },
    hiType: { type: String, required: true, index: true },
    profileUrl: { type: String, required: true },
    mappingVersion: { type: String, required: true },
    bundleSha256: { type: String, required: true },
    validationStatus: {
      type: String,
      enum: ['VALID', 'VALID_WITH_WARNINGS', 'INVALID'],
      required: true,
      index: true,
    },
    errorCount: { type: Number, default: 0, min: 0 },
    warningCount: { type: Number, default: 0, min: 0 },
    errorCodes: { type: [String], default: [] },
    warningCodes: { type: [String], default: [] },
    unmappedFields: { type: [String], default: [] },
    resourceCounts: { type: Schema.Types.Mixed, default: {} },
    officialIgConformanceClaimed: { type: Boolean, default: false, immutable: true },
    correlationId: { type: String, required: true, index: true },
    environment: {
      type: String,
      enum: ['disabled', 'development', 'sandbox', 'production'],
      required: true,
      default: 'development',
    },
  },
  {
    timestamps: true,
    collection: 'abdm_fhir_mapping_results',
  }
);

AbdmFhirMappingResultSchema.index({ role: 1, validationStatus: 1, createdAt: -1 });

export const AbdmFhirMappingResultModel: Model<IAbdmFhirMappingResultDocument> =
  mongoose.models.AbdmFhirMappingResult ||
  mongoose.model<IAbdmFhirMappingResultDocument>(
    'AbdmFhirMappingResult',
    AbdmFhirMappingResultSchema
  );
