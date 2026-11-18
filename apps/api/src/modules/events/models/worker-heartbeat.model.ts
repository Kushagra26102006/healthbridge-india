/**
 * HealthBridge India — Event Worker Heartbeat & Liveness Model (Day 8 Task 03)
 */

import mongoose, { Document, Model, Schema } from 'mongoose';

export type WorkerStatus = 'RUNNING' | 'STOPPING' | 'STOPPED';

export interface IWorkerHeartbeatDocument extends Document {
  workerId: string;
  status: WorkerStatus;
  hostname: string;
  pid: number;
  startedAt: Date;
  lastHeartbeatAt: Date;
  processedCount: number;
  failedCount: number;
  activeLeaseCount: number;
  pollIntervalMs: number;
  batchSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkerHeartbeatSchema = new Schema<IWorkerHeartbeatDocument>(
  {
    workerId: { type: String, required: true },
    status: {
      type: String,
      enum: ['RUNNING', 'STOPPING', 'STOPPED'],
      required: true,
      default: 'RUNNING',
    },
    hostname: { type: String, required: true },
    pid: { type: Number, required: true },
    startedAt: { type: Date, required: true, default: Date.now },
    lastHeartbeatAt: { type: Date, required: true, default: Date.now },
    processedCount: { type: Number, required: true, default: 0 },
    failedCount: { type: Number, required: true, default: 0 },
    activeLeaseCount: { type: Number, required: true, default: 0 },
    pollIntervalMs: { type: Number, required: true, default: 2000 },
    batchSize: { type: Number, required: true, default: 20 },
  },
  {
    timestamps: true,
    collection: 'event_worker_heartbeats',
  }
);

WorkerHeartbeatSchema.index({ workerId: 1 }, { unique: true });
WorkerHeartbeatSchema.index({ lastHeartbeatAt: -1 });

export const WorkerHeartbeatModel: Model<IWorkerHeartbeatDocument> =
  (mongoose.models.WorkerHeartbeat as Model<IWorkerHeartbeatDocument>) ||
  mongoose.model<IWorkerHeartbeatDocument>('WorkerHeartbeat', WorkerHeartbeatSchema);
