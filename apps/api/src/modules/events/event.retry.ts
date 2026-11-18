/**
 * HealthBridge India — Retry Backoff, Error Classification & Replay Safety Rules (Day 8 Task 03)
 */

import type {
  DomainEventStatus,
  DomainEventType,
  EventErrorCategory,
} from '@healthbridge/shared-types';

export const DEFAULT_BASE_RETRY_DELAY_MS = 1_000;
export const DEFAULT_MAX_RETRY_DELAY_MS = 300_000; // 5 minutes
export const DEFAULT_MAX_RETRIES = 5;
export const MAX_REPLAY_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Events that carry time-sensitive or irreversible operational semantics should not be blindly replayed if stale
const NON_REPLAYABLE_WHEN_PROCESSED_TYPES = new Set<DomainEventType>([
  'DISPENSING_COMPLETED',
  'PRESCRIPTION_DISPENSED',
  'PRESCRIPTION_PARTIALLY_DISPENSED',
  'CONSENT_REVOKED',
]);

export interface ErrorClassificationResult {
  category: EventErrorCategory;
  retryable: boolean;
}

/**
 * Exponential backoff with decorrelated/full jitter to prevent thundering-herd retry storms.
 *   delay = min(maxDelayMs, baseDelayMs * 2^attempt)
 *   jittered = random in [delay * 0.5, delay]
 */
export function computeBackoffDelayMs(
  retryCount: number,
  options?: {
    baseDelayMs?: number;
    maxDelayMs?: number;
    randomFn?: () => number;
  }
): number {
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_RETRY_DELAY_MS;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
  const randomFn = options?.randomFn ?? Math.random;

  const exponent = Math.max(0, Math.min(retryCount, 12));
  const ceiling = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, exponent));
  const half = ceiling * 0.5;
  const jitter = half + Math.floor(randomFn() * (ceiling - half + 1));
  return Math.max(100, Math.min(maxDelayMs, Math.round(jitter)));
}

export function computeNextRetryDate(
  retryCount: number,
  nowMs: number = Date.now(),
  options?: { baseDelayMs?: number; maxDelayMs?: number; randomFn?: () => number }
): Date {
  return new Date(nowMs + computeBackoffDelayMs(retryCount, options));
}

/**
 * Classifies handler/dispatch failures into operational categories and determines whether
 * the failure is transient (retryable) or permanent (immediate dead-letter).
 */
export function classifyEventError(error: unknown): ErrorClassificationResult {
  const err = error as any;
  const code = String(err?.code || err?.errorCode || '').toUpperCase();
  const statusCode = Number(err?.statusCode || 0);
  const message = String(err?.message || '').toLowerCase();

  if (code === 'AUTHENTICITY_ERROR' || message.includes('signature mismatch') || message.includes('tampered')) {
    return { category: 'AUTHENTICITY_ERROR', retryable: false };
  }

  if (
    code === 'VALIDATION_ERROR' ||
    statusCode === 400 ||
    message.includes('invalid payload') ||
    message.includes('schema validation')
  ) {
    return { category: 'VALIDATION_ERROR', retryable: false };
  }

  if (code === 'FORBIDDEN' || code === 'UNAUTHORIZED' || statusCode === 401 || statusCode === 403) {
    return { category: 'AUTHORIZATION_ERROR', retryable: false };
  }

  if (err?.nonRetryable === true || code === 'PERMANENT_ERROR') {
    return { category: 'PERMANENT_ERROR', retryable: false };
  }

  if (
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('network') ||
    message.includes('mongo') ||
    message.includes('temporarily unavailable') ||
    statusCode === 503 ||
    statusCode === 429
  ) {
    return { category: 'TRANSIENT_IO', retryable: true };
  }

  return { category: 'HANDLER_ERROR', retryable: true };
}

export interface ReplayEligibilityCheck {
  eligible: boolean;
  reason?: string;
}

/**
 * Enforces strict safety rules before allowing an administrator to replay an event:
 *   - Only `FAILED` or `DEAD_LETTER` events may be replayed (NEVER `PENDING`, `PROCESSING`, or `PROCESSED`).
 *   - Events older than 30 days are considered obsolete and blocked from automatic replay.
 *   - Events with `AUTHENTICITY_ERROR` (signature mismatch) are permanently blocked from replay.
 */
export function isReplayEligible(event: {
  status: DomainEventStatus;
  eventType: DomainEventType;
  errorCategory?: EventErrorCategory;
  createdAt?: Date | string;
}): ReplayEligibilityCheck {
  if (event.errorCategory === 'AUTHENTICITY_ERROR') {
    return {
      eligible: false,
      reason: 'Events that failed authenticity verification cannot be replayed.',
    };
  }

  if (event.status === 'PROCESSED') {
    if (NON_REPLAYABLE_WHEN_PROCESSED_TYPES.has(event.eventType)) {
      return {
        eligible: false,
        reason: `Processed '${event.eventType}' events are irreversible and cannot be replayed.`,
      };
    }
    return {
      eligible: false,
      reason: 'Already processed events cannot be replayed.',
    };
  }

  if (event.status === 'PENDING' || event.status === 'PROCESSING' || event.status === 'RETRYING') {
    return {
      eligible: false,
      reason: `Event is currently '${event.status}' and already scheduled for processing.`,
    };
  }

  if (event.createdAt) {
    const ageMs = Date.now() - new Date(event.createdAt).getTime();
    if (ageMs > MAX_REPLAY_AGE_MS) {
      return {
        eligible: false,
        reason: 'Event exceeds the 30-day replay retention window and is obsolete.',
      };
    }
  }

  return { eligible: true };
}
