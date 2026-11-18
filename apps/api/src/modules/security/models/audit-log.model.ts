import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { AuditOutcome } from '@healthbridge/shared-types';

export interface IAuditLogDocument extends Document {
  actorId?: Types.ObjectId;
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: Date;
  requestId: string;
  correlationId?: string;
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
    actorRole: {
      type: String,
      trim: true,
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
    correlationId: {
      type: String,
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
          const forbiddenKeys = new Set([
            'password',
            'passwordhash',
            'token',
            'accesstoken',
            'refreshtoken',
            'secret',
            'privatekey',
            'encryptionkey',
            'keymaterial',
            'otp',
            'abhanumber',
            'aadhaar',
            'filedata',
            'diagnosis',
            'clinicalnotes',
          ]);
          const inspect = (node: unknown, depth = 0): boolean => {
            if (depth > 8 || !node || typeof node !== 'object') return true;
            if (Array.isArray(node)) {
              return node.every((item) => inspect(item, depth + 1));
            }
            for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
              if (forbiddenKeys.has(k.toLowerCase()) && v !== '[REDACTED]') {
                return false;
              }
              if (!inspect(v, depth + 1)) return false;
            }
            return true;
          };
          return inspect(val);
        },
        message:
          'Security violation: Audit metadata must never contain unredacted credentials, tokens, secrets, or clinical PHI',
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

AuditLogSchema.pre('deleteMany', function () {
  throw new Error('AuditLog entries cannot be deleted');
});

AuditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('AuditLog entries cannot be deleted');
});

// Composite index for audit compliance queries
AuditLogSchema.index({ timestamp: -1, actorId: 1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

export const AuditLogModel: Model<IAuditLogDocument> =
  (mongoose.models.AuditLog as Model<IAuditLogDocument>) ||
  mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

export default AuditLogModel;
