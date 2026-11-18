# HealthBridge India — Monitoring, Observability & Alerting

## 1. Built-In Health & Readiness Endpoints (`apps/api`)

| Endpoint | Purpose | Expected `200` Condition | Degraded / Unhealthy Response |
| --- | --- | --- | --- |
| `GET /api/v1/health/live` | Container / orchestrator liveness probe | Express event loop responsive | Non-200 / timeout triggers container restart |
| `GET /api/v1/health/ready` | Load-balancer traffic readiness probe | MongoDB `ping()` succeeds (`ready: true`) | `503 Service Unavailable` (`ready: false`) removes pod from traffic pool |
| `GET /api/v1/health` | Operational health summary | Returns uptime, environment, DB status & latency (`latencyMs`) | `status: "degraded"` when DB is disconnected |
| `GET /api/v1/admin/security/events` | SecOps detection telemetry (`ADMIN` only) | Authenticated Admin RBAC | `401` / `403` for unauthorized callers |
| `GET /api/v1/audit/summary` | Immutable audit log summary (`ADMIN` only) | 24h totals, blocked attempts, failure counts | `401` / `403` for unauthorized callers |
| `GET /api/v1/abdm/status` | ABDM integration & webhook telemetry (`ADMIN` only) | Gateway mode, circuit/webhook metrics (zero PII) | `401` / `403` for unauthorized callers |

---

## 2. Structured Logging & Zero-PHI Telemetry Guarantee

- **Backend Logging:** Pino JSON structured logs (`requestId`, `method`, `path`, `statusCode`, `durationMs`, `errorCategory`) with recursive redaction preventing credentials, JWTs, Aadhaar, ABHA numbers, OTPs, diagnoses, or file payloads from entering logs.
- **Frontend Error Boundaries:** Global & route-level error boundaries (`apps/web/src/app/error.tsx`, `global-error.tsx`) render plain-language recovery UI without exposing raw stack traces.
- **Recommended Production Telemetry Stack:**
  - Ship container `stdout` Pino JSON logs to CloudWatch / Datadog / Grafana Loki with PII scrubbing rules enabled.
  - Configure external uptime synthetic probes hitting `/api/v1/health/ready` and `/` every 60 seconds from Mumbai (`ap-south-1`) and Singapore probes.
  - Integrate Sentry (with `sendDefaultPii: false` and request body scrubbing) for frontend & backend exception alerting before public launch.

---

## 3. Recommended Alerting Thresholds & Incident Response

| Alert | Severity | Trigger Condition | First-Line Action |
| --- | --- | --- | --- |
| **API Readiness Down** | **P1 (Critical)** | `/api/v1/health/ready` returns non-200 for > 2 minutes | Inspect MongoDB Atlas status, container logs, and recent release; execute rollback if regression |
| **Elevated 5xx Error Rate** | **P1 (Critical)** | HTTP 5xx > 2% over 5 minutes | Check Pino `errorCategory` logs & recent deployment SHA; rollback if post-deploy spike |
| **Elevated Latency** | **P2 (High)** | p95 API latency > 800 ms for 10 minutes | Inspect MongoDB Atlas slow-query profiler & pool saturation |
| **Security Anomaly Spike** | **P1/P2** | Sudden surge in `401`/`403` or `PERMISSION_DENIED` / `OWNERSHIP_VIOLATION` audit events | Inspect `/admin/audit-logs` & `/admin/security/alerts`; rotate affected sessions/keys |
| **Outbox Worker Backlog** | **P2 (High)** | Pending/failed `OutboxEventModel` count growing > 15 minutes | Verify singleton worker container health (`ENABLE_BACKGROUND_WORKER=true`) and dead-letter queue |
