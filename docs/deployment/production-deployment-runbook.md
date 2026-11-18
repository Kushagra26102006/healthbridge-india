# HealthBridge India — Production Deployment Runbook

> **Authorization Requirement:** Never execute production deployment commands without explicit release manager approval and completed staging verification.

## 1. Prerequisites

- Node.js `20.x` and `pnpm@9.15.5` (or Docker Engine `24+` with Compose v2).
- Provisioned MongoDB Atlas `M10+` replica set in `ap-south-1` (TLS enabled, PITR backups active, IP allowlist/VPC peering configured).
- Provisioned HTTPS load balancer / reverse proxy with valid TLS 1.3 certificates for frontend (`https://app.<domain>`) and API (`https://api.<domain>`).
- Production secrets generated via `openssl rand -hex 32` and stored in a cloud secret manager (never committed to Git).

---

## 2. Environment Variable Injection

Configure the following secrets in your cloud secret manager / orchestrator (see `docs/deployment/environment-configuration.md`):
- **API & Worker:** `NODE_ENV=production`, `PORT=5001`, `TRUST_PROXY_HOPS=1`, `MONGODB_URI`, `DB_MAX_POOL_SIZE=20`, `DB_MIN_POOL_SIZE=5`, `CORS_ORIGIN`, `FRONTEND_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `ADMIN_REGISTRATION_KEY`, `ABDM_ENABLED=false`, `ABDM_ENVIRONMENT=disabled`, `ABDM_ALLOW_PRODUCTION=false`.
- **API Replicas:** `ENABLE_BACKGROUND_WORKER=false`.
- **Dedicated Singleton Worker:** `ENABLE_BACKGROUND_WORKER=true`.
- **Frontend Build Args:** `NEXT_PUBLIC_APP_NAME="HealthBridge India"`, `NEXT_PUBLIC_API_URL="https://api.<domain>/api/v1"`.

---

## 3. Pre-Deployment Verification Commands (Actual Monorepo Scripts)

```bash
# 1. Install frozen dependencies
pnpm install --frozen-lockfile

# 2. Static TypeScript & ESLint verification
pnpm typecheck
pnpm lint

# 3. Run all automated test suites (Frontend + Backend Unit + Integration + API E2E)
pnpm test:all

# 4. Run production builds for packages, API, and Web
pnpm build
```

---

## 4. Controlled Database Index Synchronization (Pre-Traffic)

Because `mongoose.set('autoIndex', false)` is active in production:

1. Take an on-demand MongoDB Atlas snapshot before modifying indexes.
2. Execute the verified non-destructive index sync CLI against the target database:
   ```bash
   NODE_ENV=production pnpm db:sync-indexes
   ```
3. **NEVER** run `pnpm seed` in production (hard-blocked by `SECURITY_BLOCK`).

---

## 5. Containerized Deployment Commands

```bash
# Build and launch API, Singleton Outbox Worker, and Next.js Web containers
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

Alternatively, trigger `.github/workflows/release-production.yml` manually from `main` via GitHub Actions `workflow_dispatch` with required `production` environment reviewer approval.

---

## 6. Post-Deployment Health Checks & Smoke Tests

```bash
# 1. Verify API liveness and database readiness probes
curl -fsS https://api.<domain>/api/v1/health/live
curl -fsS https://api.<domain>/api/v1/health/ready

# 2. Execute non-destructive zero-PHI smoke test suite
API_BASE_URL=https://api.<domain> \
WEB_BASE_URL=https://app.<domain> \
pnpm smoke:prod
```

---

## 7. Rollback Procedure

1. Identify the last known good container image tag / Git commit SHA from `release-manifest-production` artifact.
2. Re-deploy the previous immutable container images for `api`, `worker`, and `web`:
   ```bash
   docker compose -f docker-compose.production.yml up -d --no-build
   ```
   (Or trigger container orchestrator revision rollback on ECS / Cloud Run / Kubernetes).
3. Because all schema changes follow backward-compatible expand-and-contract rules, rolling back application binaries does not require destructive database rollbacks. If emergency data recovery is required, follow `docs/deployment/backup-recovery.md`.
4. Re-run `pnpm smoke:prod` and confirm `/api/v1/health/ready` returns `200 OK`.

---

## 8. Troubleshooting Quick Reference

- **API exits immediately with code 1 at startup:** Inspect `stderr` for Zod `backendEnvSchema` messages — typically a dev/placeholder secret, `localhost` URI, or non-HTTPS `CORS_ORIGIN` when `NODE_ENV=production`.
- **`/api/v1/health/ready` returns `503`:** Verify MongoDB Atlas IP allowlist, TLS URI, and DB user credentials; inspect masked connection log.
- **SSE notifications drop after 60s:** Increase reverse-proxy / ALB idle timeout (`proxy_read_timeout 3600s; proxy_buffering off;` on `/api/v1/notifications/stream`).
- **Rate limiter blocks all users behind proxy:** Verify `TRUST_PROXY_HOPS` matches your load-balancer hop count (`1` for single ALB/Nginx, `2` for Cloudflare + ALB).
