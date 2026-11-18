# HealthBridge India — Security Detection Rules Specification (Day 9 Task 04)

**Engine:** `apps/api/src/modules/security-monitoring/detection-engine.ts` (`SecurityDetectionEngine`)

Single failed logins or isolated validation errors do **not** automatically generate security alerts or incidents. Every rule uses configurable sliding windows, thresholds, enable/disable toggles, and deterministic alert deduplication fingerprints.

---

## 1. Active Rule Catalogue

| Rule ID | Category | Severity | Matching Events | Threshold / Window | Group Key |
|---|---|---|---|---|---|
| `RULE_REPEATED_FAILED_LOGINS_ACCOUNT` | `AUTHENTICATION` | `HIGH` | `LOGIN_FAILURE`, `ACCOUNT_LOCKOUT` | >= 5 in 15m (`900s`) | `actorId` |
| `RULE_REPEATED_FAILED_LOGINS_IP` | `AUTHENTICATION` | `HIGH` | `LOGIN_FAILURE` | >= 8 in 15m (`900s`) | `sourceIp` |
| `RULE_REFRESH_TOKEN_REUSE` | `AUTHENTICATION` | `CRITICAL` | `TOKEN_REUSE_DETECTED` | >= 1 in 5m (`300s`) | `actorId` |
| `RULE_CROSS_PATIENT_ACCESS_PATTERN` | `AUTHORIZATION` | `CRITICAL` | `CROSS_PATIENT_ACCESS_ATTEMPT`, `CONSENT_VALIDATION_FAILURE` | >= 3 in 10m (`600s`) | `actorId` |
| `RULE_CROSS_TENANT_OR_ADMIN_DENIAL` | `AUTHORIZATION` | `HIGH` | `CROSS_TENANT_ACCESS_ATTEMPT`, `ACCESS_DENIED` | >= 4 in 10m (`600s`) | `actorId` |
| `RULE_API_ABUSE_PATTERN` | `API_SECURITY` | `HIGH` | `RATE_LIMIT_EXCEEDED`, `SUSPICIOUS_QUERY_PATTERN`, `INVALID_REQUEST_PATTERN` | >= 5 in 5m (`300s`) | `sourceIp` |
| `RULE_UNAUTHORIZED_DOCUMENT_OR_DECRYPTION` | `DATA_PROTECTION` | `CRITICAL` | `UNAUTHORIZED_DOCUMENT_DOWNLOAD`, `DECRYPTION_FAILURE`, `KEY_ROTATION_FAILURE` | >= 3 in 15m (`900s`) | `actorId` |
| `RULE_INTEGRATION_REPLAY_ABUSE` | `INTEGRATION` | `HIGH` | `EVENT_REPLAY_ATTEMPT`, `ABDM_CALLBACK_VALIDATION_FAILURE`, `EVENT_SIGNATURE_VALIDATION_FAILURE` | >= 3 in 15m (`900s`) | `sourceModule` |
