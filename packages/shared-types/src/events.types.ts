/**
 * HealthBridge India — Cross-Module Workflow Automation & Event Processing Contracts (Day 8 Task 03)
 *
 * SECURITY & PRIVACY INVARIANTS:
 *   1. Event payloads carry ONLY identifiers and safe operational metadata — NEVER diagnoses,
 *      prescription contents, numeric lab test results, ABHA/Aadhaar numbers, or raw medical text.
 *   2. Operational DTOs returned to ADMIN endpoints redact payloads and sensitive fields.
 *   3. Transaction mode explicitly reports `MONGODB_TRANSACTION` vs `COMPENSATED_FALLBACK` —
 *      never silently pretends ACID multi-document atomicity on standalone MongoDB instances.
 */

export type DomainEventType =
  // Appointment events
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_COMPLETED'
  // Encounter events
  | 'ENCOUNTER_STARTED'
  | 'ENCOUNTER_FINALIZED'
  | 'ENCOUNTER_AMENDED'
  // Prescription events
  | 'PRESCRIPTION_CREATED'
  | 'PRESCRIPTION_ISSUED'
  | 'PRESCRIPTION_CANCELLED'
  | 'PRESCRIPTION_DISPENSED'
  | 'PRESCRIPTION_PARTIALLY_DISPENSED'
  // Pharmacy events
  | 'STOCK_LOW'
  | 'STOCK_EXPIRED'
  | 'DISPENSING_COMPLETED'
  | 'PHARMACY_ORDER_UPDATED'
  // Laboratory events
  | 'LAB_ORDER_CREATED'
  | 'LAB_ORDER_ACCEPTED'
  | 'SAMPLE_COLLECTED'
  | 'SAMPLE_REJECTED'
  | 'TEST_PROCESSING_STARTED'
  | 'TEST_COMPLETED'
  | 'REPORT_APPROVED'
  | 'REPORT_PUBLISHED'
  | 'REPORT_AMENDED'
  // Consent & ABDM events
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'ABHA_LINKED'
  | 'EXTERNAL_RECORD_IMPORTED'
  | 'ABDM_TRANSFER_COMPLETED';

export type DomainEventStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'RETRYING'
  | 'FAILED'
  | 'DEAD_LETTER';

export type DomainEventSourceModule =
  | 'APPOINTMENTS'
  | 'ENCOUNTERS'
  | 'PRESCRIPTIONS'
  | 'PHARMACY'
  | 'LABORATORY'
  | 'CONSENT'
  | 'ABDM'
  | 'PLATFORM'
  | 'SYSTEM';

export type OutboxTransactionMode = 'MONGODB_TRANSACTION' | 'COMPENSATED_FALLBACK';

export type EventErrorCategory =
  | 'TRANSIENT_IO'
  | 'VALIDATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'HANDLER_ERROR'
  | 'AUTHENTICITY_ERROR'
  | 'PERMANENT_ERROR';

export interface EventReplayRecordDto {
  replayedAt: string;
  actorId: string;
  reason: string;
  previousStatus: DomainEventStatus;
}

export interface EventHandlerExecutionDto {
  executionKey: string;
  handlerName: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  completedAt?: string;
  durationMs?: number;
  lastErrorSummary?: string;
}

export interface DomainEventOutboxDto {
  eventId: string;
  eventType: DomainEventType;
  schemaVersion: number;
  sourceModule: DomainEventSourceModule;
  aggregateId: string;
  aggregateType: string;
  correlationId: string;
  status: DomainEventStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  createdAt: string;
  processingStartedAt?: string;
  processedAt?: string;
  processingDurationMs?: number;
  errorCategory?: EventErrorCategory;
  lastErrorSummary?: string;
  deadLetteredAt?: string;
  transactionMode: OutboxTransactionMode;
  replayCount: number;
  isReplayEligible: boolean;
  redactedPayloadSummary: Record<string, string | number | boolean | undefined>;
  replayHistory?: EventReplayRecordDto[];
  handlerExecutions?: EventHandlerExecutionDto[];
}

export interface EventWorkerHeartbeatDto {
  workerId: string;
  status: 'RUNNING' | 'STOPPING' | 'STOPPED' | 'STALE';
  startedAt: string;
  lastHeartbeatAt: string;
  processedCount: number;
  failedCount: number;
  activeLeaseCount: number;
  pollIntervalMs: number;
  batchSize: number;
}

export interface EventHealthMetricsDto {
  counts: {
    pending: number;
    processing: number;
    processed: number;
    retrying: number;
    failed: number;
    deadLetter: number;
    total: number;
  };
  averageProcessingDurationMs: number;
  totalRetries: number;
  handlerFailureRate: number; // 0..100 percentage
  topologyTransactionSupport: 'SUPPORTED' | 'UNAVAILABLE_FALLBACK' | 'UNKNOWN';
  workers: EventWorkerHeartbeatDto[];
  generatedAt: string;
}

export interface EventAdminListResponseDto {
  events: DomainEventOutboxDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface EventReplayResponseDto {
  eventId: string;
  previousStatus: DomainEventStatus;
  newStatus: DomainEventStatus;
  replayCount: number;
  replayedAt: string;
  message: string;
}

export type TimelineEventVisibilityPolicy =
  | 'PATIENT_AND_AUTHORIZED_DOCTOR'
  | 'PATIENT_ONLY'
  | 'AUTHORIZED_CARE_TEAM';

export interface ProjectedTimelineEventDto {
  id: string;
  sourceEventId: string;
  patientId: string;
  eventType: DomainEventType;
  sourceModule: DomainEventSourceModule;
  sourceEntityType: string;
  sourceEntityId: string;
  eventTimestamp: string;
  displaySummary: string;
  visibilityPolicy: TimelineEventVisibilityPolicy;
  provenance: 'INTERNAL_HEALTHBRIDGE' | 'ABDM_EXTERNAL_IMPORT';
  isPublishedClinical: boolean;
}
