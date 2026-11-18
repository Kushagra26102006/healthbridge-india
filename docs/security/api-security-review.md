# HealthBridge India — API Security Review (Phase 18)

## 1. Global Express Defense-in-Depth Pipeline (`apps/api/src/app.ts`)

| Control Layer | Implementation | Scope |
| --- | --- | --- |
| **Request Correlation** | `requestIdMiddleware` | Cryptographic request ID on every request & response (`X-Request-Id`) |
| **Security Headers** | `helmet` (`frameguard: deny`, `strict-origin-when-cross-origin`, production HSTS 1yr + preload) | Global |
| **CORS Policy** | Explicit origin allowlist (`env.CORS_ORIGIN`), `credentials: true`, restricted headers/methods | Global |
| **Payload Size Limits** | `express.json({ limit: '10mb' })`, `express.urlencoded({ limit: '10mb' })` | Global |
| **Injection & HPP Defense** | `hppGuardMiddleware`, `nosqlSanitizerMiddleware` (blocks `$` operator injection & prototype pollution) | Global |
| **CSRF Protection** | `csrfProtectionMiddleware` (origin/referer & double-submit validation for cookie-authenticated writes) | Global |
| **Rate Limiting** | `authLimiter` (`/auth`), `apiLimiter` (domain APIs), `searchRateLimiter` (`90/min`), `abhaOtpLimiter` (`15/15m`), `abdmWebhookLimiter` (`120/min`), `secOpsRateLimiter` (`120/min`), `auditReadLimiter` (`60/min`) | Per-endpoint |
| **URL Token Rejection** | `authenticate.ts` blocks `?token=` / `?access_token=` on JWT routes (logs `URL_TOKEN_REJECTED`) | All authenticated routes |
| **Schema Validation** | Zod schemas (`@healthbridge/validation`) enforced via `validateRequest` | All write & filtered read routes |
| **Safe Error Handling** | `errorHandler` maps `AppError`, `ZodError`, and Mongoose errors without exposing stack traces in `production` | Global |

---

## 2. Authentication, Session & Real-Time Stream Security

- **Password Storage:** `bcryptjs` cost `12` for newly registered accounts (backward-compatible with existing cost-10 hashes); constant-time `crypto.timingSafeEqual` verification for `ADMIN_REGISTRATION_KEY`.
- **JWT & Sessions:** Short-lived access tokens + hashed refresh token persistence (`RefreshTokenModel`) with session revocation and ownership validation.
- **SSE Notification Stream (`/api/v1/notifications/stream`):** Requires active JWT authentication, derives user scope strictly from `req.user.userId`, enforces per-user connection limits, and strips clinical PHI from live notification previews.
- **Medical Document Preview (`/api/v1/records/:id/preview`):** Requires either active JWT + ownership/consent verification or a short-lived (180s) HMAC-SHA256 signed token verified via `crypto.timingSafeEqual`, responding with `Content-Security-Policy: sandbox`, `X-Content-Type-Options: nosniff`, and `Cache-Control: no-store, private`.

---

## 3. Open API Security Recommendations

1. Provision Redis-backed distributed rate limiting before scaling horizontally across multiple Node.js instances (current limiters use in-memory stores).
2. Implement TOTP-based Multi-Factor Authentication (MFA) for privileged roles (`ADMIN`, `DOCTOR`) prior to production launch.
3. Run automated `pnpm audit --prod --audit-level=high` in CI where npm registry access is available.
