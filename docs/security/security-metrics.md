# HealthBridge India — Security Metrics & Reporting (Day 9 Task 04)

**Aggregation Endpoint:** `GET /api/v1/admin/security/overview` (`SECURITY_EVENTS_READ` required)

---

## 1. Server-Side Metric Definitions

All metrics are aggregated live on the server from actual ingested `SecurityEvent`, `SecurityAlert`, `SecurityIncident`, `VulnerabilityRecord`, and `KeyManagementService` incident records — **zero hardcoded or fabricated values**.

| Metric | Formula / Calculation | Edge-Case / Limitation Behavior |
|---|---|---|
| `failedLoginRatePercent` | `(LOGIN_FAILURE / (LOGIN_SUCCESS + LOGIN_FAILURE)) * 100` rounded to 2 decimals | Returns `null` when total auth attempts = `0` (never fabricates `0%`). |
| `unauthorizedAccessAttempts` | Count of `ACCESS_DENIED`, `CROSS_PATIENT_ACCESS_ATTEMPT`, `CROSS_TENANT_ACCESS_ATTEMPT`, `CONSENT_VALIDATION_FAILURE` | Bounded to current in-process/DB aggregation window. |
| `rateLimitEvents` | Count of `RATE_LIMIT_EXCEEDED` events | Single-instance counter until Redis-backed distributed telemetry is connected. |
| `meanTimeToAcknowledgeSec` (MTTA) | Mean `(acknowledgedAt - firstDetectedAt)` in seconds across acknowledged alerts | Returns `null` when `acknowledgedSampleCount === 0`. |
| `meanTimeToResolveSec` (MTTR) | Mean `(resolvedAt - firstDetectedAt)` in seconds across resolved/closed/dismissed alerts | Returns `null` when `resolvedSampleCount === 0`. |
| `vulnerabilitySummary.openBySeverity` | Count of vulnerabilities in `OPEN`, `TRIAGED`, or `IN_PROGRESS` grouped by `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | Depends on manual or CI-ingested advisory records. |
| `backupAndKeyManagementAlerts` | Count of recent data-protection incidents recorded by `KeyManagementService` & `BackupRecoveryGovernanceService` | Reflects active instance history until centralized SIEM persistence is enabled. |
