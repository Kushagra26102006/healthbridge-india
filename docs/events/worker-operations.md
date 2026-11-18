# HealthBridge India — Background Event Worker Operations (Day 8 Task 03)

## 1. Worker Lifecycle (`apps/api/src/modules/events/event.processor.ts`)

- **Startup:** Registered in `apps/api/src/server.ts` via `registerDefaultEventHandlers()` followed by `defaultEventWorker.start()` (automatically disabled in `NODE_ENV=test` so unit/integration tests control execution deterministically via `processBatchOnce()`).
- **Polling & Batching:** Polls MongoDB every `2,000 ms` (configurable) claiming up to `20` due events per cycle using atomic `findOneAndUpdate`.
- **Leases & Crash Recovery:** Each claimed event receives a `30,000 ms` lease (`leaseOwner`, `leaseExpiresAt`). If a worker crashes mid-flight or an API container restarts abruptly, any healthy worker automatically reclaims expired leases once `leaseExpiresAt <= now`.
- **Restart Durability:** Because all pending/retrying events reside in MongoDB (`outbox_events`), pending events survive full API server restarts with zero in-memory queue loss.
- **Heartbeats:** Every `10,000 ms`, active workers upsert a liveness record in `event_worker_heartbeats` (`workerId`, `status`, `processedCount`, `failedCount`, `activeLeaseCount`, `lastHeartbeatAt`). Workers silent for > 60 seconds are flagged `STALE` in `/api/v1/events/health`.
- **Graceful Shutdown:** On `SIGTERM` / `SIGINT`, `server.ts` calls `await defaultEventWorker.stop(5000)`:
  1. Clears polling and heartbeat timers.
  2. Waits up to 5 seconds for any active in-flight batch item to finish.
  3. Releases any remaining leases owned by that worker back to `RETRYING` (`nextRetryAt: now`).
  4. Persists final `STOPPED` heartbeat.
