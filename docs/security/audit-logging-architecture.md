# HealthBridge India — Centralized Audit Logging Architecture (Phase 18)

## 1. Architecture Overview

HealthBridge India operates a two-tier, privacy-safe, append-only audit architecture:

1. **Immutable Domain & Security Audit Trail (`AuditLogModel` — `auditLogs` collection):**
   - Written via `securityAuditMonitor.record()` (`apps/api/src/security/security-audit.monitor.ts`) and core auth/ABDM services.
   - Queried strictly read-only via `/api/v1/audit/logs`, `/api/v1/audit/logs/:id`, `/api/v1/audit/summary`, and `/api/v1/audit/export` (`apps/api/src/modules/audit/`).
2. **Real-Time Security Event & Detection Stream (`SecurityEventModel` / `securityMonitoringService`):**
   - Evaluates sliding-window detection rules (`detection-engine.ts`) for brute-force login bursts, cross-patient access attempts, and suspicious API patterns.
   - Exposed strictly to Admins holding explicit `SECURITY_EVENTS_READ` permission at `GET /api/v1/admin/security/events`.

---

## 2. Tracked Events & Standard Metadata Schema

Tracked event categories include authentication (`LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `LOGOUT_ALL`, `PASSWORD_RESET`, `ACCOUNT_LOCKED`), authorization (`PERMISSION_DENIED`, `OWNERSHIP_VIOLATION`, `URL_TOKEN_REJECTED`), medical documents (`DOCUMENT_UPLOADED`, `DOCUMENT_ACCESS_TOKEN_ISSUED`, `DOCUMENT_PREVIEWED`, `DOCUMENT_DOWNLOADED`, `DOCUMENT_ARCHIVED`, `FILE_SIGNATURE_REJECTED`), consent (`CONSENT_GRANTED`, `CONSENT_REVOKED`, `CONSENT_ACCESS_DENIED`), ABDM (`ABHA_*`, `ABDM_WEBHOOK_RECEIVED`), and audit governance (`AUDIT_LOG_EXPORTED`).

Every persisted record captures:
- `id` (Event ID), `actorId`, `actorRole`, `action`, `resourceType`, `resourceId`, `timestamp` (UTC), `outcome` (`SUCCESS | FAILURE | BLOCKED`), `requestId`, `correlationId`, and recursively redacted `metadata`.

---

## 3. Immutability & Privacy Safeguards

- **Schema-Level Append-Only Enforcement (`audit-log.model.ts`):** Mongoose `pre` hooks unconditionally throw errors on `updateOne`, `updateMany`, `findOneAndUpdate`, `deleteOne`, `deleteMany`, and `findOneAndDelete`.
- **Zero Mutation Routes:** `/api/v1/audit` registers `GET` routes only — no `PUT`, `PATCH`, or `DELETE` endpoints exist.
- **Recursive Credential & PHI Redaction:** Both `sanitizeAuditMetadata()` and `AuditLogSchema`'s nested validator block/redact `password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `secret`, `privateKey`, `encryptionKey`, `keyMaterial`, `otp`, `abhaNumber`, `aadhaar`, `fileData`, `diagnosis`, and `clinicalNotes`.
- **Safe Redacted CSV Exports:** `GET /api/v1/audit/export` applies RFC-4180 quoting, neutralizes Excel formula injection prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`), caps exports at 1,000 rows, sets `Cache-Control: no-store, private` + `X-Content-Type-Options: nosniff`, and self-audits the export event.
