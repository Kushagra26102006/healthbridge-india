# HealthBridge India — API Security Hardening Guide (Day 9 Task 01)

**API Prefix:** `/api/v1`  
**Core Pipeline:** `apps/api/src/app.ts`, `apps/api/src/security/`, `apps/api/src/middleware/`

---

## 1. Global Express Defense-in-Depth Controls

| Vulnerability Class | Control Implemented | Location |
|---|---|---|
| **Clickjacking / MIME Sniffing / Referrer Leakage** | `helmet()` configured with `frameguard: { action: 'deny' }`, `noSniff: true`, `referrerPolicy: { policy: 'strict-origin-when-cross-origin' }`, and production `HSTS` (`maxAge: 31536000; includeSubDomains; preload`). | `apps/api/src/app.ts` |
| **NoSQL Operator Injection (`$ne`, `$gt`, `$where`)** | `nosqlSanitizerMiddleware` recursively scans `req.body`, `req.query`, and `req.params` and blocks keys starting with `$` (`400 BAD_REQUEST` + `NOSQL_INJECTION_BLOCKED` audit log). | `apps/api/src/security/input-security.middleware.ts` |
| **Prototype Pollution** | `nosqlSanitizerMiddleware` rejects `__proto__`, `constructor`, and `prototype` keys across all request objects. | `apps/api/src/security/input-security.middleware.ts` |
| **HTTP Parameter Pollution (HPP)** | `hppGuardMiddleware` deterministically collapses duplicated scalar query parameters (`page`, `limit`, `q`, `status`, `patientId`, etc.). | `apps/api/src/security/input-security.middleware.ts` |
| **Mass Assignment** | Zod strict input validation (`@healthbridge/validation`) paired with `pickAllowedFields(...)` allowlist extractor before Mongoose updates. | `apps/api/src/security/input-security.middleware.ts` |
| **Cross-Site Request Forgery (CSRF)** | `csrfProtectionMiddleware` blocks cross-site `Origin`, `Referer`, and `Sec-Fetch-Site: cross-site` cookie-authenticated state mutations (`403 FORBIDDEN`). | `apps/api/src/security/csrf.middleware.ts` |
| **ReDoS (Regex Denial of Service)** | Search query caps (`<= 100 chars`) and `escapeRegexSpecialChars` before building any regex filters. | `apps/api/src/modules/search/search.validation.ts` |
| **Oversized Payloads & Abuse** | `express.json({ limit: '10mb' })`, `express.urlencoded({ limit: '10mb' })`, bounded pagination limits, and tiered rate limiters (`authLimiter`, `loginRateLimiter`, `passwordResetRateLimiter`, `searchRateLimiter`, `apiLimiter`). | `apps/api/src/app.ts`, `apps/api/src/middleware/rate-limit.ts` |
| **Broken Access Control / IDOR** | Server-derived `req.user`, `authenticate` (no `?token=`), `authorize`/`requirePermission`, `assertResourceOwnership`, `assertFacilityScope`, and `consentSecurityAdapter`. | `apps/api/src/middleware/`, `apps/api/src/security/` |
| **Information Disclosure in Errors** | Centralized `errorHandler` maps Zod (`422`), `AppError`, Mongoose, and JWT errors to structured envelopes with `X-Request-Id` and suppresses stack traces in production. | `apps/api/src/middleware/error-handler.ts` |
| **SSRF (Server-Side Request Forgery)** | Outbound HTTP clients (ABDM gateway) read strictly from server-validated environment base URLs (`env.ABDM_BASE_URL`, `env.ABDM_ABHA_BASE_URL`); user-supplied arbitrary URLs are never fetched server-side. | `apps/api/src/modules/abdm/` |

---

## 2. Route Audit Findings Remediated in Day 9

Full enumeration of every route file under `apps/api/src/modules/` verified authentication/authorization coverage across all 23 mounted prefixes in `v1.routes.ts` and fixed 3 previously unprotected Day 2 scaffold routes (`/api/v1/audit`, `/api/v1/users`, `/api/v1/prescriptions`).
