# Laboratory Deployment Readiness Guide — HealthBridge India (Day 6)

## 1. Environment & Secrets Hygiene Verification
- **Git Exclusion Verified:** `.gitignore` excludes `.env`, `.env*.local`, `.env.development.local`, `.env.test.local`, and `.env.production.local`. Verified via `git ls-files "*.env*"` that only `.env.example`, `apps/api/.env.example`, and `apps/web/.env.example` are tracked.
- **Scrubbed `.env.example`:** Removed an embedded MongoDB Atlas credential URI discovered during the Day 6 Task 07 audit and replaced it with a safe placeholder. **Operational action required:** Rotate the previously exposed Atlas database password before production launch.
- **No Hardcoded Secrets in Application Code:** `apps/api/src/config/env.ts` loads `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, and `MONGODB_URI` strictly from runtime environment variables.

---

## 2. Production Hosting Architecture Recommendations

### Frontend (`apps/web` — Next.js 14 App Router on Vercel)
- **Root Directory:** `apps/web` (or monorepo root with Vercel pnpm workspace filter)
- **Install Command:** `pnpm install --frozen-lockfile`
- **Build Command:** `pnpm --filter @healthbridge/web run build`
- **Output:** Standard Next.js SSR + Static App Router output (`apps/web/.next`)
- **Required Environment Variables:**
  - `NEXT_PUBLIC_APP_NAME="HealthBridge India"`
  - `NEXT_PUBLIC_API_URL="https://api.<your-domain>/api/v1"`

### Backend (`apps/api` — Express 4 + Mongoose on Render / Railway / Cloud Run / ECS)
- **Why Persistent Node Process (Not Vercel Serverless):** The Express API relies on long-lived Mongoose connection pooling, Helmet/CORS/rate-limit middleware, and server-side PDF buffer streaming. Hosting `apps/api` on a dedicated Node.js container service (Render, Railway, Google Cloud Run, or AWS ECS/Fargate) avoids serverless cold-start connection churn against MongoDB Atlas.
- **Build Command:** `pnpm --filter @healthbridge/api run build`
- **Start Command:** `node apps/api/dist/server.js` (or `pnpm --filter @healthbridge/api start`)
- **Health Check Endpoint:** `GET /api/v1/health`
- **Required Environment Variables:**
  - `NODE_ENV=production`
  - `PORT=5001` (or platform-injected `$PORT`)
  - `MONGODB_URI=mongodb+srv://<prod_user>:<prod_pass>@<atlas_cluster>.mongodb.net/healthbridge_prod?retryWrites=true&w=majority`
  - `CORS_ORIGIN=https://<your-vercel-domain>` (explicit trusted origin — never `*` with `credentials: true`)
  - `FRONTEND_URL=https://<your-vercel-domain>`
  - `JWT_ACCESS_SECRET` (≥32 bytes cryptographically random)
  - `JWT_REFRESH_SECRET` (≥32 bytes cryptographically random, distinct from access secret)
  - `JWT_EXPIRES_IN=15m`
  - `JWT_REFRESH_EXPIRES_IN=7d`
  - `COOKIE_SECRET` (≥32 bytes cryptographically random)

### Database (MongoDB Atlas)
- Use an M10+ **Replica Set** cluster for production so multi-document ACID transactions (`mongoose.startSession()`) and Point-in-Time Recovery (PITR) backups are available.
- Enable IP allowlisting / VPC peering between the backend host and Atlas.
- Run index creation (`syncIndexes`) during controlled maintenance windows after verifying zero duplicate index conflicts (verified clean in Task 07).

---

## 3. Production Hardening Checklist (Pre-Go-Live)
- [x] `NODE_ENV=production` disables all synthetic demo report/order fallbacks (`lab-report.service.ts`).
- [x] Cross-tenant `X-Laboratory-Id` header spoofing blocked (`quality.controller.ts`).
- [x] Patient/Doctor `?status=DRAFT` filter bypass blocked (`lab-report.service.ts`).
- [x] Private PDF caching disabled (`Cache-Control: private, no-cache, no-store, must-revalidate`).
- [ ] **External Object Storage (Required for High Volume):** Configure S3/GCS private bucket with server-side encryption (KMS) and short-lived pre-signed downloads to offload `LabReportVersionModel.documentBuffer` binary PDFs from MongoDB.
- [ ] **Real Email/SMS Transport:** Replace development mock email/SMS notification dispatchers with production SMTP/SES and DLT-registered Indian SMS gateway credentials.
- [ ] **Redis-Backed Rate Limiting:** Replace default in-memory `express-rate-limit` store with Redis when running multiple backend replicas.
- [ ] **HTTPS & Secure Cookies:** Terminate TLS 1.2+ at load balancer/proxy and set `app.set('trust proxy', 1)` so `Secure` cookies and client IP rate limiting work accurately behind reverse proxies.
- [ ] **Rotate Atlas Credentials:** Rotate the MongoDB user password that was previously committed in `.env.example`.
