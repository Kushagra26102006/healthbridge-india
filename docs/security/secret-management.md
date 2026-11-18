# HealthBridge India — Secret & Credential Management Audit (Day 9 Task 01)

**Audit Date:** 2026-11-18  
**Scope:** `.env.example`, Git tracked files, `apps/api`, `apps/web`, `packages/*`, and startup validation (`@healthbridge/validation`).

---

## 1. Repository Secret Audit Results

| Check | Method | Finding |
|---|---|---|
| Tracked `.env` / private key files | `git ls-files \| grep -iE "\.env($\|\.)\|secret\|private\|\.pem$\|\.key$"` (excluding `.example`) | **PASS — 0 tracked `.env`, `.pem`, or `.key` files.** |
| Hardcoded cloud / private key / Atlas URI credentials | Regex scan across `apps/` and `packages/` (excluding `node_modules`, `.next`, `dist`) | **PASS — 0 hardcoded AWS keys, private keys, or live `mongodb+srv://` credentials detected.** |
| Frontend `NEXT_PUBLIC_*` exposure | Grep of all `NEXT_PUBLIC_` references across `apps/web/src/` and `.env.example` | **PASS — Only `NEXT_PUBLIC_APP_NAME` and `NEXT_PUBLIC_API_URL` exist. Zero secrets or ABDM credentials exposed to browser bundles.** |
| Fail-fast startup validation | `apps/api/src/config/env.ts` (`backendEnvSchema.safeParse(process.env)`) | **PASS — Process exits immediately (`process.exit(1)`) on missing/invalid `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, or `MONGODB_URI`.** |

---

## 2. Secret Classification & Storage Rules

| Secret / Variable | Scope | Minimum Entropy / Format | Rotation Cadence |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | Backend Only (`apps/api`) | >= 32 random bytes (hex/base64) | Every 90 days or immediately on incident |
| `JWT_REFRESH_SECRET` | Backend Only (`apps/api`) | >= 32 random bytes (distinct from access secret) | Every 90 days (triggers refresh re-login) |
| `COOKIE_SECRET` | Backend Only (`apps/api`) | >= 32 random bytes | Every 90 days |
| `MONGODB_URI` | Backend Only (`apps/api`) | Least-privilege Atlas user + TLS | Every 90 days via dual-user zero-downtime swap |
| `ABDM_CLIENT_ID` / `ABDM_CLIENT_SECRET` | Backend Only (`apps/api`) | NHA-issued sandbox/prod credentials | Per NHA policy / immediate on suspected exposure |
| `ABDM_WEBHOOK_SECRET` | Backend Only (`apps/api`) | >= 32 random bytes | Coordinated dual-secret overlap window |
| `ABDM_IDENTIFIER_ENCRYPTION_KEY` | Backend Only (`apps/api`) | 32-byte AES-256 key | Managed KMS envelope key rotation |

---

## 3. Credential Rotation & Leak Response Runbook

1. **Immediate Containment:** If any credential is suspected exposed in logs, CI output, or developer workstations, immediately revoke it at the issuing provider (MongoDB Atlas, NHA ABDM portal, SMTP/SMS provider) and rotate the replacement value via managed Secrets Manager (AWS Secrets Manager / GCP Secret Manager / HashiCorp Vault).
2. **Session Invalidation:** On `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` compromise, rotate both secrets and run `RefreshTokenModel.updateMany({ revokedAt: { $exists: false } }, { revokedAt: new Date() })` to force clean re-authentication across all devices.
3. **Never Print Secrets:** CI scripts, incident tickets, and audit reports must never print raw secret values or unredacted connection strings.
