/**
 * HealthBridge India — Durable Idempotent Timeline Event Projection Model (Day 8 Task 03)
 *
 * Complements — NEVER replaces — original authoritative clinical records.
 * Unique `sourceEventId` guarantees zero duplicate timeline entries across retries or replays.
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import type {
  DomainEventSourceModule,
  DomainEventType,
  TimelineEventVisibilityPolicy,
} from '@healthbridge/shared-types';
import {
  DOMAIN_EVENT_SOURCE_MODULES,
  DOMAIN_EVENT_TYPES,
} from '@healthbridge/validation';

export interface ITimelineEventDocument extends Document {
  sourceEventId: string;
  patientId: Types.ObjectId;
  eventType: DomainEventType;
  sourceModule: DomainEventSourceModule;
  sourceEntityType: string;
  sourceEntityId: string;
  eventTimestamp: Date;
  displaySummary: string;
  visibilityPolicy: TimelineEventVisibilityPolicy;
  provenance: 'INTERNAL_HEALTHBRIDGE' | 'ABDM_EXTERNAL_IMPORT';
  isPublishedClinical: boolean;
  correlationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEventDocument>(
  {
    sourceEventId: { type: String, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventType: { type: String, enum: DOMAIN_EVENT_TYPES, required: true },
    sourceModule: { type: String, enum: DOMAIN_EVENT_SOURCE_MODULES, required: true },
    sourceEntityType: { type: String, required: true },
    sourceEntityId: { type: String, required: true },
    eventTimestamp: { type: Date, required: true, default: Date.now },
    displaySummary: { type: String, required: true, maxlength: 240 },
    visibilityPolicy: {
      type: String,
      enum: ['PATIENT_AND_AUTHORIZED_DOCTOR', 'PATIENT_ONLY', 'AUTHORIZED_CARE_TEAM'],
      required: true,
      default: 'PATIENT_AND_AUTHORIZED_DOCTOR',
    },
    provenance: {
      type: String,
      enum: ['INTERNAL_HEALTHBRIDGE', 'ABDM_EXTERNAL_IMPORT'],
      required: true,
      default: 'INTERNAL_HEALTHBRIDGE',
    },
    isPublishedClinical: { type: Boolean, required: true, default: true },
    correlationId: { type: String, required: false },
  },
  {
    timestamps: true,
    collection: 'timeline_events',
  }
);

TimelineEventSchema.index({ sourceEventId: 1 }, { unique: true });
TimelineEventSchema.index({ patientId: 1, eventTimestamp: -1 });
TimelineEventSchema.index({ patientId: 1, sourceEntityType: 1, sourceEntityId: 1 });

export const TimelineEventModel: Model<ITimelineEventDocument> =
  (mongoose.models.TimelineEvent as Model<ITimelineEventDocument>) ||
  mongoose.model<ITimelineEventDocument>('TimelineEvent', TimelineEventSchema);
