# HealthBridge India — Authentication & Session Security (Day 9 Task 01)

**Primary Modules:** `apps/api/src/modules/auth/`, `apps/api/src/middleware/authenticate.ts`, `apps/api/src/security/csrf.middleware.ts`, `apps/web/src/features/auth/`

---

## 1. Credential & Password Security

- **Hashing:** Passwords are hashed using `bcryptjs` (salted adaptive hashing); plaintext passwords are never stored or logged.
- **Model Projection Protection:** `UserSchema` marks `passwordHash` with `select: false` and strips `passwordHash` in both `toJSON` and `toObject` transforms.
- **Public Admin Registration Blocked:** Both `@healthbridge/validation` (`registerValidationSchema`) and `auth.service.ts` explicitly prohibit registering with `role: 'ADMIN'`.
- **Account Enumeration Mitigation:** Login failures return generic authentication error messages; password reset flows avoid leaking sensitive internal state.

---

## 2. JWT Access Tokens & Refresh Token Rotation

| Control | Implementation |
|---|---|
| **Access Token Lifetime** | Short-lived (`JWT_EXPIRES_IN=15m`), signed with `JWT_ACCESS_SECRET`, verified for `issuer`, `audience`, signature, and expiry in `token.service.ts`. |
| **Refresh Token Storage** | High-entropy random token (`40` bytes); only its **SHA-256 hash** (`tokenHash`) is persisted in `RefreshTokenModel` with a MongoDB TTL index (`7d`). |
| **Token Hash Redaction (Day 9 Fix)** | `RefreshTokenModel` and `VerificationTokenModel` now strip `tokenHash` in `toJSON` and `toObject` transforms so hashes cannot accidentally leak in serialized responses. |
| **Rotation & Reuse Detection** | Every `/api/v1/auth/refresh` revokes the used refresh token and mints a fresh one. Presenting a previously revoked refresh token triggers **breach containment**: ALL active sessions for that user are revoked and `REFRESH_TOKEN_REUSE_DETECTED` (`BLOCKED`) is persisted to `AuditLogModel`. |
| **Session Management** | Supports single-device logout (`POST /auth/logout`), logout-all (`POST /auth/logout-all`), active session listing (`GET /auth/sessions`), selective session revocation (`DELETE /auth/sessions/:sessionId`), and `POST /auth/logout-others`. |

---

## 3. Cookie, URL Token & CSRF Hardening

- **HTTP-Only Cookies (`cookie.util.ts`):** `httpOnly: true`, `secure: env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`.
- **Global URL Token Rejection (Day 9 Fix):** Prior to Day 9, `authenticate.ts` still accepted `?token=` as a global fallback. Removed that fallback and replaced it with explicit `401 UNAUTHORIZED` rejection + `URL_TOKEN_REJECTED` audit logging whenever `?token=` or `?access_token=` appears in any authenticated route.
- **CSRF Defense (`csrf.middleware.ts`, Day 9 Fix):** Cookie-authenticated state-changing requests (`POST`/`PUT`/`PATCH`/`DELETE`) without an explicit `Authorization: Bearer` header are verified against `Sec-Fetch-Site` (blocking `cross-site`), `Origin`, and `Referer` against `CORS_ORIGIN` / `FRONTEND_URL`.
- **Auth Rate Limiting (`auth.routes.ts`, Day 9 Fix):**
  - `/login`: `loginRateLimiter` (5 attempts / 15 min per IP + identifier)
  - `/forgot-password`, `/resend-verification`, `/reset-password`: `passwordResetRateLimiter` (3 requests / hour)
  - `/register`, `/refresh`, `/verify-email`: `authGeneralLimiter` + global `authLimiter`

---

## 4. Frontend Session & Account Switching Hygiene

- **Zero Token Storage in `localStorage`:** Verified across `apps/web/src/`; browser authentication uses HTTP-only cookies via `withCredentials: true`.
- **Cache Cleanup on Switch/Logout (Day 9 Fix):** `use-auth.ts` invokes `queryClient.clear()` on `login`, `logout`, and `logoutAll`, and broadcasts cross-tab `LOGOUT` notifications via `BroadcastChannel`.
- **Open-Redirect Prevention:** `apps/web/src/lib/security/safe-redirect.ts` (`sanitizeRedirectPath`) restricts redirects strictly to single-slash relative application paths.
