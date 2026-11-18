/**
 * HealthBridge India — Security Monitoring Mongoose Models (Day 9 Task 04)
 *
 * Keeps security operational telemetry separate from ordinary application debug logs
 * without duplicating the existing AuditLogModel collection.
 */

import mongoose, { Document, Model, Schema } from 'mongoose';
import {
  ALERT_STATUSES,
  INCIDENT_STATUSES,
  SECURITY_EVENT_CATEGORIES,
  SECURITY_EVENT_TYPES,
  SECURITY_SEVERITIES,
  VULNERABILITY_STATUSES,
  type SecurityAlertStatus,
  type SecurityEventCategory,
  type SecurityEventType,
  type SecurityIncidentStatus,
  type SecuritySeverity,
  type VulnerabilityStatus,
} from '../security-event.types';

// 1. SecurityEvent
export interface ISecurityEventDocument extends Document {
  eventId: string;
  dedupeKey?: string;
  eventType: SecurityEventType;
  category: SecurityEventCategory;
  severity: SecuritySeverity;
  actorId?: string;
  actorRole?: string;
  sourceIp?: string;
  sourceModule: string;
  requestId: string;
  correlationId?: string;
  resourceCategory?: string;
  resourceReference?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  detectionRuleId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const SecurityEventSchema = new Schema<ISecurityEventDocument>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    dedupeKey: { type: String, index: true, sparse: true },
    eventType: { type: String, enum: SECURITY_EVENT_TYPES, required: true, index: true },
    category: { type: String, enum: SECURITY_EVENT_CATEGORIES, required: true, index: true },
    severity: { type: String, enum: SECURITY_SEVERITIES, required: true, index: true },
    actorId: { type: String, index: true },
    actorRole: { type: String },
    sourceIp: { type: String, index: true },
    sourceModule: { type: String, required: true, index: true },
    requestId: { type: String, required: true, index: true },
    correlationId: { type: String },
    resourceCategory: { type: String },
    resourceReference: { type: String },
    outcome: { type: String, enum: ['SUCCESS', 'FAILURE', 'BLOCKED'], required: true },
    detectionRuleId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, required: true, index: true },
  },
  { timestamps: false, collection: 'securityEvents' }
);
SecurityEventSchema.index({ eventType: 1, actorId: 1, timestamp: -1 });
SecurityEventSchema.index({ category: 1, severity: 1, timestamp: -1 });

export const SecurityEventModel: Model<ISecurityEventDocument> =
  (mongoose.models.SecurityEvent as Model<ISecurityEventDocument>) ||
  mongoose.model<ISecurityEventDocument>('SecurityEvent', SecurityEventSchema);

// 2. SecurityAlert
export interface ISecurityAlertDocument extends Document {
  alertId: string;
  fingerprint: string;
  detectionRuleId: string;
  category: SecurityEventCategory;
  severity: SecuritySeverity;
  title: string;
  safeDescription: string;
  relatedEventIds: string[];
  firstDetectedAt: Date;
  lastDetectedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  occurrenceCount: number;
  status: SecurityAlertStatus;
  assignedReviewerId?: string;
  incidentId?: string;
  resolutionNotes?: string;
  auditHistory: Array<{
    timestamp: Date;
    actorId: string;
    action: string;
    fromStatus: string;
    toStatus: string;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SecurityAlertSchema = new Schema<ISecurityAlertDocument>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    fingerprint: { type: String, required: true, index: true },
    detectionRuleId: { type: String, required: true, index: true },
    category: { type: String, enum: SECURITY_EVENT_CATEGORIES, required: true, index: true },
    severity: { type: String, enum: SECURITY_SEVERITIES, required: true, index: true },
    title: { type: String, required: true },
    safeDescription: { type: String, required: true },
    relatedEventIds: { type: [String], default: [] },
    firstDetectedAt: { type: Date, default: Date.now, required: true },
    lastDetectedAt: { type: Date, default: Date.now, required: true, index: true },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    occurrenceCount: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ALERT_STATUSES, default: 'OPEN', index: true },
    assignedReviewerId: { type: String, index: true },
    incidentId: { type: String, index: true },
    resolutionNotes: { type: String },
    auditHistory: {
      type: [
        new Schema(
          {
            timestamp: { type: Date, required: true },
            actorId: { type: String, required: true },
            action: { type: String, required: true },
            fromStatus: { type: String, required: true },
            toStatus: { type: String, required: true },
            note: { type: String },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true, collection: 'securityAlerts' }
);
SecurityAlertSchema.index({ status: 1, severity: 1, lastDetectedAt: -1 });

export const SecurityAlertModel: Model<ISecurityAlertDocument> =
  (mongoose.models.SecurityAlert as Model<ISecurityAlertDocument>) ||
  mongoose.model<ISecurityAlertDocument>('SecurityAlert', SecurityAlertSchema);

// 3. SecurityIncident
export interface ISecurityIncidentDocument extends Document {
  incidentId: string;
  title: string;
  category: SecurityEventCategory;
  severity: SecuritySeverity;
  status: SecurityIncidentStatus;
  description: string;
  relatedAlertIds: string[];
  affectedModules: string[];
  affectedSystems: string[];
  assignedResponderId?: string;
  evidenceReferences: string[];
  containmentActions: Array<{ timestamp: Date; actorId: string; action: string }>;
  resolution?: string;
  lessonsLearned?: string;
  timeline: Array<{
    timestamp: Date;
    actorId: string;
    fromStatus: string;
    toStatus: string;
    note: string;
  }>;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SecurityIncidentSchema = new Schema<ISecurityIncidentDocument>(
  {
    incidentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, enum: SECURITY_EVENT_CATEGORIES, required: true, index: true },
    severity: { type: String, enum: SECURITY_SEVERITIES, required: true, index: true },
    status: { type: String, enum: INCIDENT_STATUSES, default: 'DETECTED', index: true },
    description: { type: String, required: true },
    relatedAlertIds: { type: [String], default: [] },
    affectedModules: { type: [String], default: [] },
    affectedSystems: { type: [String], default: [] },
    assignedResponderId: { type: String, index: true },
    evidenceReferences: { type: [String], default: [] },
    containmentActions: {
      type: [
        new Schema(
          {
            timestamp: { type: Date, required: true },
            actorId: { type: String, required: true },
            action: { type: String, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    resolution: { type: String },
    lessonsLearned: { type: String },
    timeline: {
      type: [
        new Schema(
          {
            timestamp: { type: Date, required: true },
            actorId: { type: String, required: true },
            fromStatus: { type: String, required: true },
            toStatus: { type: String, required: true },
            note: { type: String, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true, collection: 'securityIncidents' }
);

export const SecurityIncidentModel: Model<ISecurityIncidentDocument> =
  (mongoose.models.SecurityIncident as Model<ISecurityIncidentDocument>) ||
  mongoose.model<ISecurityIncidentDocument>('SecurityIncident', SecurityIncidentSchema);

// 4. VulnerabilityRecord
export interface IVulnerabilityRecordDocument extends Document {
  vulnerabilityId: string;
  component: string;
  advisoryReference: string;
  severity: SecuritySeverity;
  affectedVersion: string;
  fixedVersion?: string;
  exploitability?: string;
  remediation: string;
  owner: string;
  status: VulnerabilityStatus;
  acceptedRiskJustification?: string;
  verificationResult?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VulnerabilityRecordSchema = new Schema<IVulnerabilityRecordDocument>(
  {
    vulnerabilityId: { type: String, required: true, unique: true, index: true },
    component: { type: String, required: true, index: true },
    advisoryReference: { type: String, required: true },
    severity: { type: String, enum: SECURITY_SEVERITIES, required: true, index: true },
    affectedVersion: { type: String, required: true },
    fixedVersion: { type: String },
    exploitability: { type: String },
    remediation: { type: String, required: true },
    owner: { type: String, required: true },
    status: { type: String, enum: VULNERABILITY_STATUSES, default: 'OPEN', index: true },
    acceptedRiskJustification: { type: String },
    verificationResult: { type: String },
  },
  { timestamps: true, collection: 'vulnerabilityRecords' }
);

export const VulnerabilityRecordModel: Model<IVulnerabilityRecordDocument> =
  (mongoose.models.VulnerabilityRecord as Model<IVulnerabilityRecordDocument>) ||
  mongoose.model<IVulnerabilityRecordDocument>('VulnerabilityRecord', VulnerabilityRecordSchema);
