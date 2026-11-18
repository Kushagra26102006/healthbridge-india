# HealthBridge India — Security & Healthcare Privacy Audit (Day 8 Task 06)

**Audit Date:** 2026-11-18  
**Standard Alignment Target:** Indian healthcare privacy best practices (ABDM / DISHA / DPDP principles), OWASP Top 10, least-privilege RBAC, and zero PHI/credential leakage.

---

## 1. Authentication, Session & Registration Controls

| Control | Implementation Evidence | Verification |
|---|---|---|
| **HTTP-Only Cookie + Bearer JWT Auth** | `hb_access_token` cookie + signed JWT verified in `apps/api/src/middleware/authenticate.ts`; `cookieParser(env.COOKIE_SECRET)`. | Verified (`auth-middleware.test.ts`, `auth-security.test.ts`) |
| **Public Admin Self-Registration Blocked** | Explicitly rejected in both `packages/validation/src/auth.schema.ts` and `apps/api/src/modules/auth/services/auth.service.ts`. | Verified in code & auth tests |
| **No Tokens in URL Query Strings** | `GET /api/v1/notifications/stream` and `/api/v1/notifications/*` explicitly reject `?token=` and `?access_token=` with `401 UNAUTHORIZED` to prevent token leakage into proxy/server logs and browser history. | Verified (`unified-notifications.test.ts`) |
| **Security Headers & Strict CORS** | `helmet()` enabled; CORS requires explicit `env.CORS_ORIGIN`, `credentials: true`, and explicit header allow-list (`Content-Type`, `Authorization`, `X-Requested-With`, `X-Request-Id`, `X-ABDM-Auth`, `Last-Event-ID`). | Verified (`apps/api/src/app.ts`) |

---

## 2. Authorization, Tenant Isolation & Anti-Spoofing

- **Server-Derived Actor Identity:** Every authenticated module derives `userId` and `role` exclusively from `req.user` (populated from the verified JWT + active `UserModel` lookup). Client-supplied `userId`, `patientId`, or `recipientId` query/body parameters are ignored for ownership scoping.
- **Role-Scoped Global Search Permission Matrix (`apps/api/src/modules/search/search.permissions.ts`):**
  - `PATIENT`: own records + public provider discovery only (cannot search `patient`, `user`, `inventory`, `dispensing`, `lab_sample`).
  - `DOCTOR`: assigned/consented care patients & clinical records + medicines.
  - `PHARMACY`: pharmacy-scoped operations & issued prescriptions (cannot search `patient`, `encounter`, `lab_report`, `medical_record`).
  - `LABORATORY`: lab orders, samples, tests, reports, minimal authorized patient identity (cannot search `prescription`, `inventory`, `encounter`, `medical_record`).
  - `ADMIN`: platform operational users/providers/orders only (cannot search private `medical_record`, `encounter`, `lab_report`, `prescription`, `external_record`).
  - **Fail-Closed Enforcement:** Requesting unauthorized types returns `403 FORBIDDEN`.
- **Event & Notification Anti-Spoofing:**
  - `POST /api/v1/notifications/events` restricted strictly to `ADMIN` (`403` for all non-admin roles).
  - No public client endpoint exists to publish arbitrary domain events (`POST /api/v1/events` returns `404`).
- **Synchronous Consent Revocation Barrier:**
  - `ConsentEnforcementService.invalidateConsentImmediately(...)` blocks revoked consent artefacts immediately upon patient revocation, keyed by `consentId`/`consentRequestId` so newly granted consents are unaffected.

---

## 3. PHI, Credential & Log Redaction Controls

- **Structured Pino Redaction:** Pino logger (`apps/api/src/utils/logger.ts`) redacts authorization headers, cookies, passwords, OTPs, tokens, and masked ABHA identifiers (`[REDACTED]`).
- **Privacy-First Global Search:**
  - Raw search query text is **never** written to `AuditLogModel` or slow-query operational logs (only `queryLength`, `targetTypes`, `resultCount`, `executionTimeMs`).
  - Recent searches are stored strictly in ephemeral in-memory session storage (`SESSION_MEMORY_ONLY`, 30-minute TTL, instant `DELETE /api/v1/search/recent`), never persisted to MongoDB, and automatically skip queries matching ABHA numbers, Aadhaar numbers, credentials (`password`/`token`/`otp`), or sensitive clinical terms (`hiv`, `cancer`, `psychiatric`, etc.).
- **Notification Preview Scrubbing:** Stored notification previews scrub raw ABHA numbers and sensitive clinical values (`unified-notifications.test.ts`).
- **Frontend Error Privacy:** Root `apps/web/src/app/error.tsx` displays only a generic safe message and recovery buttons, never stack traces or patient identifiers.

---

## 4. Residual Security Hardening Required Before Production Go-Live

1. Enable strict Content Security Policy (CSP) headers on `apps/web` and API docs routes in production deployment.
2. Provision production secret management (KMS / Vault / Secrets Manager) for `JWT_SECRET`, `COOKIE_SECRET`, MongoDB Atlas URI, and ABDM client credentials.
3. Replace in-memory rate-limit counters and in-memory SSE/recent-search stores with Redis-backed stores prior to horizontal multi-replica scaling.
4. Perform independent penetration testing, DAST/SAST scanning, and official NHA ABDM Milestone/Security Certification before enabling `ABDM_ALLOW_PRODUCTION=true`.
