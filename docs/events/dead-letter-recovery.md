# HealthBridge India — Dead-Letter Queue & Controlled Recovery Procedures (Day 8 Task 03)

## 1. Dead-Letter Quarantine Rules

An event moves to `DEAD_LETTER` when:
- Transient failures exhaust `maxRetries` (default `5`), OR
- A permanent / non-retryable error occurs (`AUTHENTICITY_ERROR`, `VALIDATION_ERROR`, `AUTHORIZATION_ERROR`, `PERMANENT_ERROR`).

Upon dead-lettering, the dispatcher records `deadLetteredAt`, sanitized `lastErrorSummary`, `errorCategory`, and writes a `DOMAIN_EVENT_DEAD_LETTERED` audit record.

## 2. Controlled Replay Safety Rules (`event.retry.ts` & `event.dead-letter.ts`)

Administrators CANNOT arbitrarily replay unsafe events. `isReplayEligible()` enforces:
- Only `FAILED` and `DEAD_LETTER` events may be replayed.
- `PROCESSED`, `PENDING`, `PROCESSING`, and `RETRYING` events are rejected (`400 Bad Request`).
- `AUTHENTICITY_ERROR` events (HMAC mismatch / suspected tampering) are permanently blocked from replay.
- Events older than 30 days are blocked as obsolete.
- Original `eventId` and `correlationId` are preserved so `EventHandlerExecutionModel` skips any handler that already completed before failure.
- Every replay requires an explicit `reason` (5–240 chars), is restricted to `ADMIN` role + `adminEventRateLimiter`, appends to `replayHistory`, and writes a `DOMAIN_EVENT_REPLAYED` audit log.

## 3. Manual Recovery Runbook

1. Sign in as an authorized `ADMIN` and open `/admin/platform/events`.
2. Switch to the **Dead-Letter Review** tab (`GET /api/v1/events/dead-letter`).
3. Click **Inspect** (`GET /api/v1/events/:eventId`) to review the `errorCategory`, sanitized `lastErrorSummary`, and per-handler execution ledger (`EventHandlerExecutionModel`).
4. Confirm the underlying downstream issue (e.g., database outage, misconfiguration) is resolved.
5. For eligible events, click **Retry**, enter a clear operational audit reason, and submit `POST /api/v1/events/:eventId/retry`.
6. Verify the event transitions `DEAD_LETTER -> PENDING -> PROCESSING -> PROCESSED` without duplicating side effects.
