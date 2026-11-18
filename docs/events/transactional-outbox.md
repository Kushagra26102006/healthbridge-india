# HealthBridge India — Transactional Outbox Design & Limitations (Day 8 Task 03)

## 1. Outbox Document Structure (`outbox_events`)

Implemented in `apps/api/src/modules/events/models/outbox-event.model.ts`:

- `eventId` (unique index): Stable UUID identifying the domain event across retries and replays.
- `idempotencyKey` (unique sparse index): Prevents duplicate outbox records for identical business transitions.
- `eventType`, `schemaVersion`, `sourceModule`, `aggregateId`, `aggregateType`, `correlationId`.
- `payload`: Strict identifier-only payload validated against Zod contracts.
- `metadata`: `transactionMode`, server-side HMAC-SHA256 `signature`, `replayCount`, audit replay metadata.
- Lifecycle state machine: `PENDING -> PROCESSING -> PROCESSED` (or `RETRYING -> DEAD_LETTER` / `FAILED`).
- Lease fields: `leaseOwner`, `leaseExpiresAt`, `processingStartedAt`, `processedAt`, `processingDurationMs`.

## 2. MongoDB Topology Detection & Honest Atomicity Semantics

`EventRepository.detectTransactionSupport()` inspects the active MongoDB topology:

1. **Replica Set / Sharded Cluster (MongoDB Atlas — `SUPPORTED`):**
   `executeWithOutbox()` opens a `mongoose.startSession()` and wraps BOTH the business state mutation and `OutboxEventModel.create([doc], { session })` inside `session.withTransaction(...)`. Both writes commit atomically or roll back together. Events are tagged `metadata.transactionMode = 'MONGODB_TRANSACTION'`.
2. **Standalone Local MongoDB / Disconnected Unit Test Mock (`UNAVAILABLE_FALLBACK`):**
   MongoDB standalone servers do not support multi-document ACID transactions. Rather than silently pretending atomicity exists:
   - Events are explicitly tagged `metadata.transactionMode = 'COMPENSATED_FALLBACK'`.
   - A structured operational warning is logged once.
   - If outbox persistence fails after the business write, `executeWithOutbox()` invokes the caller's explicit `compensate(businessResult, error)` rollback hook and rethrows the error.
   - The admin `/api/v1/events/health` endpoint reports `topologyTransactionSupport` transparently.

## 3. Outbox Database Indexes

- `{ eventId: 1 }` (`unique: true`)
- `{ idempotencyKey: 1 }` (`unique: true, sparse: true`)
- `{ status: 1, nextRetryAt: 1, createdAt: 1 }` (hot worker polling index)
- `{ status: 1, leaseExpiresAt: 1 }` (stale lease recovery index)
- `{ aggregateType: 1, aggregateId: 1, createdAt: -1 }`
- `{ eventType: 1, status: 1, createdAt: -1 }`
- `{ correlationId: 1 }`
