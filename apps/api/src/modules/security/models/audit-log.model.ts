import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { AuditOutcome } from '@healthbridge/shared-types';

export interface IAuditLogDocument extends Document {
  actorId?: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: Date;
  requestId: string;
  outcome: AuditOutcome;
  metadata?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    requestId: {
      type: String,
      required: [true, 'Request tracing ID is required'],
      trim: true,
      index: true,
    },
    outcome: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'BLOCKED'],
      required: [true, 'Audit outcome is required'],
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      validate: {
        validator: function (val: Record<string, unknown> | undefined) {
          if (!val) return true;
          // Security filter: Ensure no sensitive keys exist in metadata
          const forbiddenKeys = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken', 'secret'];
          const keys = Object.keys(val).map((k) => k.toLowerCase());
          return !forbiddenKeys.some((f) => keys.includes(f.toLowerCase()));
        },
        message: 'Security violation: Audit metadata must never contain credentials, passwords, or tokens',
      },
    },
  },
  {
    timestamps: false, // Audit records use immutable timestamp field
    collection: 'auditLogs',
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

// Enforce append-only immutability at the schema middleware level
AuditLogSchema.pre('updateOne', function () {
  throw new Error('AuditLog entries are immutable and cannot be updated');
});

AuditLogSchema.pre('updateMany', function () {
  throw new Error('AuditLog entries are immutable and cannot be updated');
});

AuditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog entries are immutable and cannot be updated');
});

AuditLogSchema.pre('deleteOne', function () {
  throw new Error('AuditLog entries cannot be deleted');
});

// Composite index for audit compliance queries
AuditLogSchema.index({ timestamp: -1, actorId: 1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

export const AuditLogModel: Model<IAuditLogDocument> =
  (mongoose.models.AuditLog as Model<IAuditLogDocument>) ||
  mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

export default AuditLogModel;
