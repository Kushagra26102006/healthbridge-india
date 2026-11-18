# HealthBridge India — Final Repository Audit (Phase 20)

## 1. Monorepo Architecture Inventory

Audited complete pnpm workspace (`healthbridge-india/`) prior to production release preparation:

| Workspace | Stack & Version | Role & Verified Modules |
| --- | --- | --- |
| `apps/web` (`@healthbridge/web`) | Next.js `14.2.35`, React `18.3.1`, Tailwind CSS `3.4.19`, Redux Toolkit `2.3.0`, TanStack Query `5.60.5`, Framer Motion `11.18.2` | Public landing & privacy notice; Auth flows (login, register, forgot/reset password, email/phone verify); 5 role-based portals (**Patient**, **Doctor**, **Pharmacy**, **Laboratory**, **Admin**); Global Search (`Cmd+K`); Notification Center + SSE; Medical Document Vault; Interactive Analytics; ABHA & ABDM Admin Consoles |
| `apps/api` (`@healthbridge/api`) | Node.js 20+, Express `4.22.3`, Mongoose `8.24.9`, Pino `10.4.0`, Helmet `8.0.0`, Zod `3.25.76`, `bcryptjs`, `jsonwebtoken` | 25 route modules covering Auth/JWT/Refresh Rotation, RBAC, Patients, Doctors, Appointments, Encounters, Prescriptions, Pharmacy (Inventory/Dispensing/Procurement/Orders), Laboratory (Accessioning/QMS/Workforce/Reports), Medical Records (Magic-Byte Validation + Short-Lived Signed URLs), Consent Engine, Notifications + SSE, Global Search, ABDM V3/ABHA/FHIR R4, Privacy/DPDP, Security Monitoring, Centralized Immutable Audit Logs, Durable Outbox Event Worker, Health/Readiness Probes |
| `packages/config` | TypeScript `5.6.3` | Shared constants, 9 canonical `HEALTH_RECORD_TYPES`, auth/record configs |
| `packages/shared-types` | TypeScript `5.6.3` | 33 shared DTO & domain type modules across API & Web |
| `packages/validation` | Zod `3.25.76` | 25 shared validation schemas including fail-closed production `backendEnvSchema` |
| `e2e/` & `scripts/` | Playwright specs + Chrome CDP `axe-core@4.14.0` auditor + Production Smoke Test runner | 5-role Playwright E2E suite, 8-viewport responsive & WCAG 2.2 AA auditor, non-destructive `scripts/production-smoke-test.mjs` |
| `.github/workflows/` | GitHub Actions | `ci-qa.yml`, `security-ci.yml`, `release-production.yml` (manual approval-gated release) |

---

## 2. Build, Container & Configuration Audit

- **Root Build & QA Scripts (`package.json`):** `build`, `lint`, `typecheck`, `test:web`, `test:unit`, `test:integration`, `test:api-e2e`, `test:all`, `db:sync-indexes`, `smoke:prod`.
- **Containerization Added (Phase 20):** Multi-stage non-root Node 20 Alpine Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`) with built-in `HEALTHCHECK` probes and `docker-compose.production.yml` separating stateless API replicas (`ENABLE_BACKGROUND_WORKER=false`) from the singleton outbox worker (`ENABLE_BACKGROUND_WORKER=true`).
- **Environment Templates Verified:** `.env.example`, `apps/api/.env.example`, and `apps/web/.env.example` contain placeholders only; `git ls-files` confirms **0 tracked `.env` files**.
- **External Dependencies Required Before Live Launch:**
  1. Managed MongoDB Atlas cluster in India region (`ap-south-1`, M10+ replica set, TLS enforced, PITR enabled).
  2. Cloud application hosting for `@healthbridge/web` and `@healthbridge/api` + dedicated outbox worker.
  3. Private cloud object storage (S3/GCS in India region, KMS-encrypted, zero public buckets) + external AV/malware scanner (ClamAV/Cloud AV) for clinical file uploads at scale.
  4. Custom domain DNS, TLS/SSL certificates, and transactional Email/SMS provider credentials.
  5. Official NHA ABDM Sandbox/Production onboarding (`ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, HFR/HPR registration, WASA certificate).
