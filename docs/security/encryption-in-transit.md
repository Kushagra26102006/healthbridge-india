# HealthBridge India — Encryption in Transit Specification (Day 9 Task 03)

**Primary Code Surfaces:** `apps/api/src/app.ts`, `apps/api/src/config/database.ts`, `apps/api/src/modules/auth/utils/cookie.util.ts`, `apps/web/next.config.mjs`

---

## 1. Transport Security Controls Implemented & Verified

| Hop | Protocol / Policy | Verification |
|---|---|---|
| **Browser -> Frontend (`apps/web`)** | HTTPS via reverse proxy / CDN + `Strict-Transport-Security: max-age=31536000; includeSubDomains` (`next.config.mjs`). | Configured in `next.config.mjs`; TLS cert termination verified at hosting deployment. |
| **Browser -> Backend API (`apps/api`)** | HTTPS + Helmet production HSTS (`maxAge: 31536000; includeSubDomains; preload`), strict `CORS_ORIGIN`, `credentials: true`, HTTP-only `secure` (`NODE_ENV === 'production'`) `SameSite=Lax` cookies, zero URL query tokens. | Verified in `app.ts`, `cookie.util.ts`, `authenticate.ts`, and HTTP integration tests. |
| **Backend API -> MongoDB Atlas** | `mongodb+srv://` enforces TLS by default. **Day 9 Task 03 Guard (`database.ts`):** In `NODE_ENV === 'production'`, `connectDatabase()` explicitly throws if `MONGODB_URI` contains `tls=false`, `ssl=false`, `tlsAllowInvalidCertificates=true`, or `tlsAllowInvalidhostnames=true`. | Implemented in `apps/api/src/config/database.ts`. |
| **Backend API -> External ABDM / Cloud Services** | HTTPS-only base URLs (`https://dev.abdm.gov.in`, `https://abhasbx.abdm.gov.in/abha/api/v3`); grep confirmed **zero** `rejectUnauthorized: false` or `NODE_TLS_REJECT_UNAUTHORIZED=0` bypasses anywhere in the monorepo. | Verified via static codebase scan. |
| **Backend API -> Document Storage** | Private authenticated streams / short-lived signed downloads with `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`. Production object storage endpoints must enforce TLS 1.2+ only. | Verified locally; cloud bucket TLS policy verified on deployment. |

---

## 2. Production TLS Verification Checklist (Hosting Layer)

1. Terminate TLS 1.2 / TLS 1.3 at load balancer / CDN with automated certificate renewal (ACM / Let's Encrypt / Managed TLS) and HTTP -> HTTPS 301 redirect.
2. Confirm reverse proxy forwards `X-Forwarded-Proto: https` and configure Express `app.set('trust proxy', 1)` when running behind a managed load balancer.
3. Verify MongoDB Atlas cluster enforces minimum TLS 1.2 and disables insecure ciphers.
