# HealthBridge India — Security Audit Logging & Monitoring (Day 9 Task 01)

**Primary Components:** `apps/api/src/security/security-audit.monitor.ts`, `apps/api/src/modules/security/models/audit-log.model.ts`, `apps/api/src/config/logger.ts`, `apps/api/src/modules/audit/routes/audit.routes.ts`

---

## 1. Audited Security Events Coverage

Every critical security decision emits a structured, PHI-free audit record containing `actorId`, `actorRole`, `action`, `resourceType`, `resourceId`, `timestamp`, `requestId`, `correlationId`, and `outcome` (`SUCCESS` | `FAILURE` | `BLOCKED`):

- **Authentication & Sessions:** `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `LOGOUT_ALL`, `PASSWORD_RESET`, `ACCOUNT_LOCKED`, `REFRESH_TOKEN_REUSE_DETECTED`, `URL_TOKEN_REJECTED`.
- **Authorization & Privacy:** `PERMISSION_DENIED`, `OWNERSHIP_VIOLATION`, `CONSENT_GRANTED`, `CONSENT_REVOKED`, `CONSENT_ACCESS_DENIED`, `SENSITIVE_RECORD_ACCESSED` (including audited break-glass compliance inspections).
- **Clinical & Document Operations:** `DOCUMENT_UPLOADED`, `DOCUMENT_DOWNLOADED`, `FILE_SIGNATURE_REJECTED`, prescription issuance, pharmacy dispensing, laboratory report publication.
- **Perimeter & Abuse Defenses:** `CSRF_BLOCKED`, `NOSQL_INJECTION_BLOCKED`, `GLOBAL_SEARCH_EXECUTED` (operational-only: `queryLength`, `targetTypes`, `resultCount` — never raw search query text).
- **Administrative Actions:** `ADMIN_ACTION`, `ROLE_CHANGED`, event dead-letter inspection/replay.

---

## 2. Immutability & Tamper-Resistance (`audit-log.model.ts`)

- **Schema-Level Write/Delete Protection:** Mongoose pre-hooks reject `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, plus (**Day 9 Hardening**) `deleteMany` and `findOneAndDelete`.
- **Restricted Read Surface (Day 9 Hardening):** `/api/v1/audit` is protected by `authenticate` + `requirePermission('admin:audit:read')` so ordinary users (`PATIENT`, `DOCTOR`, `PHARMACY`, `LABORATORY`) receive `403 FORBIDDEN`.
- **Automatic Credential & PHI Redaction:**
  - `security-audit.monitor.ts` redacts forbidden metadata keys (`password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `secret`, `otp`, `abhaNumber`, `aadhaar`, `fileData`, `diagnosis`, `clinicalNotes`) to `'[REDACTED]'`.
  - `apps/api/src/config/logger.ts` enforces Pino path redaction across headers, tokens, OTPs, ABHA identifiers, diagnoses, and prescriptions.

---

## 3. Incident Response & Monitoring Foundations

Recommended SIEM / alerting thresholds for staging & production:
1. **Critical Alert (Immediate Page):** Any `REFRESH_TOKEN_REUSE_DETECTED` event, spike in `OWNERSHIP_VIOLATION` / `CONSENT_ACCESS_DENIED`, or `ADMIN` break-glass clinical inspection (`SENSITIVE_RECORD_ACCESSED`).
2. **High Alert (15-min Investigation):** Repeated `NOSQL_INJECTION_BLOCKED`, `CSRF_BLOCKED`, `FILE_SIGNATURE_REJECTED`, or `LOGIN_FAILURE` bursts targeting privileged accounts.
3. **Operational Alert:** Growing dead-letter event backlog in `/api/v1/events/dead-letter` or elevated `>= 500ms` slow-query search telemetry.
