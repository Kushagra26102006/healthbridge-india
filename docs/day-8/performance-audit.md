# HealthBridge India — Performance & Scalability Audit (Day 8 Task 06)

**Audit Date:** 2026-11-18  
**Scope:** Backend query patterns, Global Search bounding, Event Outbox polling, SSE stream resource bounds, and Next.js production bundle footprint.

---

## 1. Frontend Production Bundle Metrics (`next build`)

Measured directly from `pnpm build` (`Next.js 14.2.35`):

- **First Load JS shared by all routes:** **`87.5 kB`**
  - `chunks/2749-*.js`: `31.9 kB`
  - `chunks/fd9d1056-*.js` / framework chunk: `53.7 kB`
  - Other shared chunks: `1.95 kB`
- **Build Time:** `apps/api` (`tsc`): `6.4s`; `apps/web` (`next build`, 196 routes): `20.3s`.
- **Client Request Efficiency:**
  - `<GlobalSearchCommand />` enforces `300ms` input debounce plus `AbortController` cancellation on every keystroke, preventing stale autocomplete pileups.
  - `NotificationSyncProvider` maintains a single SSE connection per browser tab with exponential backoff + jitter and cross-tab `BroadcastChannel` sync, avoiding redundant polling loops across open tabs.
  - TanStack Query invalidation targets only impacted domain keys (`notifications`, `appointments`, `prescriptions`, `lab-reports`, `consent`, `timeline`) instead of clearing the global cache.

---

## 2. Backend Performance & Query Controls

| Subsystem | Safeguard Implemented | Observed Audit Status |
|---|---|---|
| **Global Search (`/api/v1/search`)** | Per-user sliding-window rate limiter (`90 req/min/user`), `max 100 char` query cap, `escapeRegexSpecialChars` (prevents ReDoS CPU spikes), bounded `.limit(...)` per resource bucket, `.lean()` + narrow `.select(...)` projections, `>= 500ms` slow-query operational telemetry (`logger.warn` without raw query text). | Verified in code & unit/integration tests |
| **Notifications & SSE (`/api/v1/notifications/stream`)** | Per-user connection caps and heartbeat timers with automatic cleanup on `req.on('close')`; bounded `Last-Event-ID` catch-up window; paginated inbox queries (`page`, `limit`). | Verified in code & integration tests |
| **Event Outbox Worker (`apps/api/src/modules/events/`)** | Batch-bounded polling (`batchSize`), lease expiry locks (`leaseDurationMs`), exponential retry backoff, dead-letter isolation (`DEAD_LETTER`) so poison events never starve healthy queues. | Verified in unit & integration tests (`event-processing.test.ts`, `event-workflows.test.ts`) |
| **HTTP Payload & Abuse Controls (`apps/api/src/app.ts`)** | `express.json({ limit: '10mb' })`, tiered rate limiters (`authLimiter`, `apiLimiter`, `searchRateLimiter`). | Verified in code & `rate-limit.test.ts` |

---

## 3. Benchmarking Limitations (Honest Disclosure)

- **No Live Load/Stress Testing Performed:** No k6, Artillery, or Locust throughput/p95 latency benchmarks were executed against a live MongoDB Atlas cluster in this offline environment.
- **Recommended Staging Performance Tasks:**
  1. Run `explain('executionStats')` on high-traffic MongoDB queries (global search buckets, patient timeline aggregation, outbox polling, notification inbox) with >= 100k synthetic documents.
  2. Validate SSE fan-out memory & file-descriptor limits under >= 1,000 concurrent connections and introduce a Redis pub/sub adapter when scaling `apps/api` beyond a single Node.js instance.
