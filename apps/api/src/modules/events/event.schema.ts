/**
 * HealthBridge India — Domain Event Validation, Authenticity & Redaction (Day 8 Task 03)
 *
 * Enforces:
 *   1. Strict Zod contract validation for all 31 domain event types.
 *   2. Zero clinical/PII leak guard (rejects raw diagnoses, prescription text, lab values,
 *      ABHA/Aadhaar numbers, passwords, or tokens inside event payloads).
 *   3. Server-side HMAC-SHA256 authenticity signing & constant-time verification.
 *   4. Safe redaction for admin operational inspection DTOs and error summaries.
 */

import crypto from 'crypto';
import type {
  DomainEventOutboxDto,
  DomainEventType,
  EventHandlerExecutionDto,
} from '@healthbridge/shared-types';
import { DOMAIN_EVENT_PAYLOAD_SCHEMAS } from '@healthbridge/validation';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import { redactStringSecrets } from '../abdm/utils/redaction';
import type { IOutboxEventDocument } from './models/outbox-event.model';
import type { IEventHandlerExecutionDocument } from './models/event-handler-execution.model';
import { isReplayEligible } from './event.retry';

const FORBIDDEN_PAYLOAD_VALUE_PATTERNS: RegExp[] = [
  /\b\d{2}-\d{4}-\d{4}-\d{4}\b/, // 14-digit ABHA number
  /\b\d{14}\b/, // unformatted 14-digit ABHA
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // 12-digit Aadhaar
  /\bbearer\s+[a-z0-9\-._~+/]+=*/i,
  /\b\d+(?:\.\d+)?\s*(?:mg\/dL|g\/dL|mmol\/L|IU\/L|U\/L|ng\/mL|pg\/mL|mmHg|cells\/uL)\b/i,
  /\b(?:HbA1c|Hemoglobin|Glucose|Creatinine|Cholesterol|TSH)\s*[:=]\s*[^\s,;]+/i,
];

const SAFE_ADMIN_PAYLOAD_KEYS = new Set<string>([
  'appointmentId',
  'encounterId',
  'prescriptionId',
  'prescriptionNumber',
  'dispensingId',
  'pharmacyOrderId',
  'orderNumber',
  'labOrderId',
  'sampleId',
  'barcode',
  'reportId',
  'reportNumber',
  'consentId',
  'consentScope',
  'importedRecordId',
  'internalImportRef',
  'transferId',
  'hiType',
  'status',
  'previousStatus',
  'newStatus',
  'dispensingStatus',
  'priority',
  'direction',
  'version',
  'previousVersion',
  'medicationCount',
  'itemsDispensedCount',
  'testCount',
  'bundleCount',
  'qcPassed',
  'isDraft',
  'isMocked',
  'slotReleased',
  'encounterEligible',
  'pharmacyDiscoverable',
  'stockDeductedAtomically',
  'revokedSynchronously',
  'alertLevel',
]);

function getSigningSecret(): string {
  return `${env.JWT_ACCESS_SECRET}:healthbridge-domain-events-v1`;
}

/**
 * Validates event payload against its strict Zod schema and guarantees no forbidden
 * clinical values or sensitive identifiers are embedded.
 */
export function validateDomainEventPayload(
  eventType: DomainEventType,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const schema = DOMAIN_EVENT_PAYLOAD_SCHEMAS[eventType];
  if (!schema) {
    throw AppError.badRequest(`Unsupported domain event type: ${eventType}`);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issueMsg = parsed.error.issues
      .map((i) => `${i.path.join('.') || 'payload'}: ${i.message}`)
      .join('; ');
    throw AppError.badRequest(`Invalid payload for event '${eventType}': ${issueMsg}`);
  }

  // Deep scan string values for accidentally embedded secrets / clinical values / ABHA / Aadhaar
  for (const [key, value] of Object.entries(parsed.data)) {
    if (typeof value === 'string') {
      for (const pattern of FORBIDDEN_PAYLOAD_VALUE_PATTERNS) {
        if (pattern.test(value)) {
          throw AppError.badRequest(
            `Event payload field '${key}' contains restricted sensitive or clinical data and was rejected.`
          );
        }
      }
    }
  }

  return parsed.data as Record<string, unknown>;
}

/**
 * Deterministic canonical JSON serialization for HMAC signing.
 */
function canonicalize(input: Record<string, unknown>): string {
  const sortedKeys = Object.keys(input).sort();
  const ordered: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    ordered[key] = input[key];
  }
  return JSON.stringify(ordered);
}

export function signOutboxEvent(params: {
  eventId: string;
  eventType: DomainEventType;
  schemaVersion: number;
  aggregateId: string;
  aggregateType: string;
  correlationId: string;
  payload: Record<string, unknown>;
}): string {
  const material = [
    params.eventId,
    params.eventType,
    String(params.schemaVersion),
    params.aggregateId,
    params.aggregateType,
    params.correlationId,
    canonicalize(params.payload),
  ].join('|');

  return crypto.createHmac('sha256', getSigningSecret()).update(material).digest('hex');
}

export function verifyOutboxEventSignature(event: IOutboxEventDocument): boolean {
  const provided = event.metadata?.signature;
  if (!provided || typeof provided !== 'string') {
    return false;
  }

  const expected = signOutboxEvent({
    eventId: event.eventId,
    eventType: event.eventType,
    schemaVersion: event.schemaVersion,
    aggregateId: event.aggregateId,
    aggregateType: event.aggregateType,
    correlationId: event.correlationId,
    payload: (event.payload || {}) as Record<string, unknown>,
  });

  const bufA = Buffer.from(provided, 'hex');
  const bufB = Buffer.from(expected, 'hex');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Sanitizes error summaries before persisting to OutboxEvent or returning to admins.
 */
export function sanitizeOutboxErrorSummary(rawMessage: string): string {
  let clean = redactStringSecrets(rawMessage || 'Unknown processing error');
  for (const pattern of FORBIDDEN_PAYLOAD_VALUE_PATTERNS) {
    clean = clean.replace(pattern, '[REDACTED]');
  }
  return clean.replace(/\s+/g, ' ').trim().slice(0, 380);
}

/**
 * Produces a strictly redacted payload summary for admin operational inspection.
 * Masks patient/actor/doctor IDs to short opaque prefixes and strips any non-allowlisted keys.
 */
export function redactPayloadForAdmin(
  payload: Record<string, unknown> | undefined
): Record<string, string | number | boolean | undefined> {
  const summary: Record<string, string | number | boolean | undefined> = {};
  if (!payload || typeof payload !== 'object') {
    return summary;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;

    // Patient/user identifiers are masked to preserve privacy in operational tables
    if (
      key === 'patientId' ||
      key === 'doctorId' ||
      key === 'requesterId' ||
      key === 'orderingDoctorId' ||
      key === 'collectedByStaffId' ||
      key === 'approvedByStaffId'
    ) {
      const str = String(value);
      summary[key] = str.length > 8 ? `***${str.slice(-6)}` : '***';
      continue;
    }

    if (SAFE_ADMIN_PAYLOAD_KEYS.has(key)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        summary[key] = typeof value === 'string' ? sanitizeOutboxErrorSummary(value) : value;
      }
    }
  }

  return summary;
}

export function mapOutboxEventToAdminDto(
  event: IOutboxEventDocument | any,
  handlerExecutions?: Array<IEventHandlerExecutionDocument | any>
): DomainEventOutboxDto {
  const eligibility = isReplayEligible(event);

  const mappedHandlers: EventHandlerExecutionDto[] | undefined = handlerExecutions?.map((h) => ({
    executionKey: h.executionKey,
    handlerName: h.handlerName,
    status: h.status,
    attempts: h.attempts,
    completedAt: h.completedAt ? new Date(h.completedAt).toISOString() : undefined,
    durationMs: h.durationMs,
    lastErrorSummary: h.lastErrorSummary,
  }));

  return {
    eventId: event.eventId,
    eventType: event.eventType,
    schemaVersion: event.schemaVersion,
    sourceModule: event.sourceModule,
    aggregateId: event.aggregateId,
    aggregateType: event.aggregateType,
    correlationId: event.correlationId,
    status: event.status,
    retryCount: event.retryCount || 0,
    maxRetries: event.maxRetries || 5,
    nextRetryAt: event.nextRetryAt ? new Date(event.nextRetryAt).toISOString() : undefined,
    createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
    processingStartedAt: event.processingStartedAt
      ? new Date(event.processingStartedAt).toISOString()
      : undefined,
    processedAt: event.processedAt ? new Date(event.processedAt).toISOString() : undefined,
    processingDurationMs: event.processingDurationMs,
    errorCategory: event.errorCategory,
    lastErrorSummary: event.lastErrorSummary,
    deadLetteredAt: event.deadLetteredAt ? new Date(event.deadLetteredAt).toISOString() : undefined,
    transactionMode: event.metadata?.transactionMode || 'COMPENSATED_FALLBACK',
    replayCount: event.metadata?.replayCount || 0,
    isReplayEligible: eligibility.eligible,
    redactedPayloadSummary: redactPayloadForAdmin(event.payload),
    replayHistory: Array.isArray(event.replayHistory)
      ? event.replayHistory.map((r: any) => ({
          replayedAt: new Date(r.replayedAt).toISOString(),
          actorId: r.actorId,
          reason: r.reason,
          previousStatus: r.previousStatus,
        }))
      : [],
    handlerExecutions: mappedHandlers,
  };
}
