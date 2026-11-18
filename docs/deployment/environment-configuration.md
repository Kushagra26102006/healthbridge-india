# HealthBridge India — Production Environment Configuration

## 1. Environment Separation Policy

| Environment | `NODE_ENV` | Database | Secrets Source | ABDM Mode | Seeding Allowed? |
| --- | --- | --- | --- | --- | --- |
| **Local Dev** | `development` | Local `127.0.0.1` or dev Atlas DB | Local untracked `.env` / `.env.local` | `disabled` / mocked | Yes |
| **Automated Test** | `test` | Mocked / ephemeral CI `mongo:7` | Synthetic test-only values | `disabled` / mocked | Yes (test-only fixtures) |
| **Staging** | `production` | Isolated Staging Atlas cluster | Cloud Secret Manager (staging scope) | `sandbox` (once NHA sandbox approved) | Blocked (`SECURITY_BLOCK`) |
| **Production** | `production` | Dedicated Production Atlas cluster (`ap-south-1`) | Cloud Secret Manager (prod scope) | `disabled` until official NHA prod authorization | **Hard Blocked (`SECURITY_BLOCK`)** |

---

## 2. Automated Fail-Closed Production Validation (`packages/validation/src/env.schema.ts`)

When `NODE_ENV=production`, `apps/api/src/config/env.ts` validates `process.env` at startup and **exits with code 1** if ANY of the following production invariants fail:
1. `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, or `ADMIN_REGISTRATION_KEY` is shorter than 32 characters or matches any dev/placeholder pattern (`dev_`, `hb_dev_`, `your_`, `placeholder`, `changeme`, `example`).
2. `JWT_ACCESS_SECRET === JWT_REFRESH_SECRET` (must be cryptographically distinct).
3. `MONGODB_URI` points to `localhost`/`127.0.0.1` or contains placeholder credentials, or disables TLS (`tls=false`, `ssl=false`, `tlsAllowInvalidCertificates=true`).
4. `CORS_ORIGIN` or `FRONTEND_URL` contains `*`, `http://`, or `localhost`/`127.0.0.1` (explicit `https://` origins only; comma-separated allowlist supported).
5. `ABDM_ENVIRONMENT=production` is set without `ABDM_ALLOW_PRODUCTION=true` AND non-placeholder `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, `ABDM_WEBHOOK_SECRET`, and `ABDM_IDENTIFIER_ENCRYPTION_KEY`.

---

## 3. Required Variable Reference

### Backend (`apps/api`)
- **Runtime:** `NODE_ENV=production`, `PORT=5001`, `TRUST_PROXY_HOPS=1`, `ENABLE_BACKGROUND_WORKER=false` (API replicas) / `true` (singleton worker).
- **Database:** `MONGODB_URI` (Atlas SRV TLS URI), `DB_MAX_POOL_SIZE=20`, `DB_MIN_POOL_SIZE=5`.
- **Origins:** `CORS_ORIGIN=https://app.your-domain.in`, `FRONTEND_URL=https://app.your-domain.in`.
- **Security Secrets (Secret Manager Only):** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `ADMIN_REGISTRATION_KEY` (generate via `openssl rand -hex 32`), `JWT_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`.
- **ABDM (Keep Disabled Until Authorized):** `ABDM_ENABLED=false`, `ABDM_ENVIRONMENT=disabled`, `ABDM_ALLOW_PRODUCTION=false`.

### Frontend (`apps/web`)
- `NEXT_PUBLIC_APP_NAME="HealthBridge India"`
- `NEXT_PUBLIC_API_URL="https://api.your-domain.in/api/v1"`
- **Strict Rule:** Never place database URIs, JWT secrets, ABDM keys, or service tokens in any `NEXT_PUBLIC_*` variable.
