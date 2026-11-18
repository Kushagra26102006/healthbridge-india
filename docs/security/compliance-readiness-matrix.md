# HealthBridge India — Security & Compliance Readiness Matrix (Phase 18)

> **DISCLAIMER:** This matrix is an internal technical engineering readiness assessment only. It does **not** constitute legal compliance, DPDP Act sign-off, ABDM/NHA certification, or CERT-In WASA approval. Formal compliance requires independent legal and accredited security assessments.

## 1. OWASP Top 10 (2021) & OWASP ASVS Technical Readiness

| Control Area | Reference | Technical Status | Evidence / Gap Notes |
| --- | --- | --- | --- |
| Broken Access Control (RBAC & IDOR) | OWASP A01 / ASVS V4 | **Implemented and verified** | Centralized `ROLE_PERMISSION_REGISTRY`, per-route `authorize` / `requirePermission`, ownership checks, ABDM consent enforcement (`183 / 183` unit tests). |
| Cryptographic Failures | OWASP A02 / ASVS V6 | **Partially implemented** | AES-256-GCM envelope encryption, bcrypt cost 12, HMAC-SHA256 signed URLs, constant-time comparisons implemented; external Cloud KMS & production TLS termination pending deployment. |
| Injection (NoSQL / CSV / ReDoS) | OWASP A03 / ASVS V5 | **Implemented and verified** | Zod request validation, `nosqlSanitizerMiddleware`, `hppGuardMiddleware`, ReDoS-escaped search regexes, CSV formula-injection neutralization (`escapeAuditCsvCell`). |
| Insecure Design (Consent & Privacy) | OWASP A04 | **Implemented and verified** | Internal vs ABDM consent separation, fail-closed `ABDM_ALLOW_PRODUCTION=false`, owner-only archival, privacy-safe notification/search previews. |
| Security Misconfiguration | OWASP A05 / ASVS V14 | **Partially implemented** | `helmet`, strict CORS, body limits, zero tracked `.env` files; external CSP hardening for web & cloud WAF pending deployment. |
| Vulnerable & Outdated Components | OWASP A06 | **Requires external assessment / CI** | Automated `pnpm audit --prod --audit-level=high` configured in `.github/workflows/security-ci.yml`; offline sandbox cannot query live advisory feeds. |
| Identification & Authentication Failures | OWASP A07 / ASVS V2 | **Partially implemented** | Rate limiting, brute-force lockout, JWT expiration, URL-token blocking, refresh token revocation implemented; **MFA (TOTP) Not Implemented**. |
| Software & Data Integrity Failures | OWASP A08 | **Implemented and verified** | Frozen lockfile CI install, binary magic-byte file verification, SHA-256 document checksums, HMAC webhook verification + ±5m replay guard. |
| Security Logging & Monitoring Failures | OWASP A09 / ASVS V7 | **Implemented and verified** | Append-only `AuditLogModel`, recursive credential/PHI redaction, read-only `/api/v1/audit/*` API, `SecurityMonitoringService` sliding-window detection rules, Admin Audit & Security Center UI. |
| Server-Side Request Forgery (SSRF) | OWASP A10 | **Implemented and verified** | Outbound ABDM HTTP calls strictly locked to configured `ABDM_BASE_URL` / `ABDM_ABHA_BASE_URL`; no arbitrary user-supplied URL fetching. |

---

## 2. Indian Healthcare & Data Protection Readiness (DPDP Act / ABDM / DISHA Principles)

| Requirement Area | Technical Status | Evidence / Remaining External Dependency |
| --- | --- | --- |
| Explicit Purpose & Consent Enforcement | **Implemented and verified** | `consentEnforcementService` + ABDM Consent Manager lifecycle (`REQUESTED`/`GRANTED`/`REVOKED`/`EXPIRED`) with purpose, HI-type, and date-window checks. |
| Data Minimization & PHI-Free Telemetry | **Implemented and verified** | Recursive redaction in `AuditLogModel` & `securityAuditMonitor`; PII-free admin monitoring, search previews, and notification previews. |
| Patient Privacy Requests & Erasure Governance | **Partially implemented** | `privacy` module + admin privacy-request governance exist; formal legal retention & statutory deletion SOP requires external legal review. |
| ABDM Security & Sandbox Certification | **Requires external assessment** | Requires official NHA Sandbox credentials, Fidelius Curve25519 bridge, HAPI FHIR CLI IG validation, CERT-In WASA audit, and NHA Sandbox Exit approval. |
| Automated Production Backups & DR Drills | **Not implemented (Infra)** | Governance & reconciliation logic implemented; live MongoDB Atlas PITR & S3/GCS private bucket replication must be configured in cloud infrastructure. |
