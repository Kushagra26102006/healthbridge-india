# HealthBridge India — Final Production Launch Checklist (Release Gate)

Checked honestly against actual executed verification as of **Phase 20 completion**:

## Codebase, Build, QA & Security Engineering Gates

- [x] **All required modules build successfully** — `@healthbridge/api` (`tsc --project tsconfig.json`) and `@healthbridge/web` (`next build`, `87.5 kB` shared First Load JS) both compiled cleanly.
- [x] **TypeScript checks pass** — `pnpm typecheck` passed across all 5 workspaces (`config`, `shared-types`, `validation`, `api`, `web`) with `0` errors.
- [x] **ESLint passes** — `pnpm --filter @healthbridge/web lint` passed with `0` errors (5 pre-existing Day-6 lab QMS hook warnings logged as low-priority).
- [x] **Required automated tests pass** — **76 test files, 872 / 872 Vitest tests PASSED** (32 frontend unit/component + 194 backend unit + 646 backend integration & full-workflow E2E); **80 / 80 responsive checks** (`320px–1440px`, Light/Dark) and **11 / 11 zero-violation `axe-core@4.14.0` routes** verified live.
- [x] **Critical security findings are resolved** — `0` open Critical findings (`SEC-H01` and `SEC-M01`–`SEC-M04` remediated and regression-tested; fail-closed production env & seed guards verified).
- [x] **Authentication and RBAC are verified** — 5-role server-side RBAC, JWT expiry/tampering checks, cross-patient IDOR `403`, and fail-closed `ADMIN` registration verified.
- [x] **Consent workflows are verified** — Consent request, approval, denial, expiry, and immediate synchronous revocation verified.
- [x] **Medical document storage is private** — Backend-enforced ownership/consent, magic-byte anti-spoofing, SHA-256 duplicate detection, and short-lived HMAC signed URLs verified (zero public file URLs).
- [x] **Rollback procedures are documented** — Documented in `docs/deployment/production-deployment-runbook.md`.
- [x] **External integration dependencies are documented** — Documented in `docs/deployment/final-repository-audit.md` and `docs/abdm/`.

## Infrastructure & External Pre-Launch Operational Gates (Pending Provisioning)

- [ ] **High-risk operational items resolved or formally accepted** — TOTP MFA (`SEC-M05`) and external AV/private cloud object storage (`SEC-M06`) require pre-launch implementation/provisioning or formal risk acceptance.
- [ ] **Database migrations / index sync executed on target Atlas cluster** — `pnpm db:sync-indexes` CLI verified in code; must be executed against live staging/production Atlas cluster once provisioned.
- [ ] **Production environment variables provisioned in Cloud Secret Manager** — Fail-closed validator verified; actual production secrets must be generated and injected into cloud hosting.
- [ ] **Backup and recovery procedures tested on live Atlas cluster** — Strategy documented; isolated staging restore drill pending Atlas provisioning.
- [ ] **HTTPS, custom domain DNS & SSL certificates verified** — Domain & TLS setup pending infrastructure/DNS authorization.
- [ ] **External monitoring & alerting sinks connected** — Health/readiness probes and structured Pino logs verified; external log aggregator, uptime probes, and Sentry alerting pending provisioning.
- [ ] **Live production smoke tests executed against deployed URLs** — `scripts/production-smoke-test.mjs` ready; awaiting live staging/production URLs and explicit deployment authorization.
- [ ] **Official NHA ABDM Sandbox/Production onboarding** — Safely gated (`ABDM_ENABLED=false`, `ABDM_ALLOW_PRODUCTION=false`) until official NHA credentials, HFR/HPR IDs, and CERT-In WASA certification are obtained.
