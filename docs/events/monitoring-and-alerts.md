# HealthBridge India — Event Monitoring, Observability & Alerts (Day 8 Task 03)

## 1. Admin-Only Observability APIs (`/api/v1/events`)

Protected by `authenticate` + `authorize(['ADMIN'])` + `adminEventRateLimiter` (60 req/min/admin):

| Endpoint | Purpose | Redaction |
| --- | --- | --- |
| `GET /api/v1/events/health` | Queue counts (`pending`, `processing`, `processed`, `retrying`, `failed`, `deadLetter`), `averageProcessingDurationMs`, `totalRetries`, `handlerFailureRate`, `topologyTransactionSupport`, worker heartbeats | Aggregate operational counts only — zero PII |
| `GET /api/v1/events` | Paginated search & filter (`search`, `status`, `eventType`, `sourceModule`, `from`, `to`) | Masks `patientId`, `doctorId`, `requesterId` as `***xxxxxx`; strips non-allowlisted keys |
| `GET /api/v1/events/dead-letter` | Dedicated dead-letter inspection queue | Strictly redacted DTOs |
| `GET /api/v1/events/:eventId` | Event detail + per-handler `EventHandlerExecution` ledger + `replayHistory` | Strictly redacted DTOs |
| `POST /api/v1/events/:eventId/retry` | Controlled replay for eligible `FAILED` / `DEAD_LETTER` events with mandatory `reason` | Audited in `AuditLogModel` |

## 2. Admin UI (`/admin/platform/events`)

- Accessible exclusively inside `<ProtectedRoute allowedRoles={['ADMIN']}>`.
- Displays queue counters, MongoDB outbox atomicity mode, worker heartbeat status, search, status/module/date filters, pagination, redacted inspection modal, dead-letter review tab, and controlled retry modal.

## 3. Recommended Production Alert Thresholds

- `counts.deadLetter > 0`: Page on-call operator to inspect `/admin/platform/events` Dead-Letter Review.
- `workers[].status === 'STALE'` (no heartbeat > 60s): Alert container orchestration / restart worker pod.
- `counts.pending > 500` or `averageProcessingDurationMs > 2000`: Scale worker concurrency or inspect MongoDB query latency.
- `errorCategory === 'AUTHENTICITY_ERROR'`: Immediate security incident investigation (possible outbox tampering).
