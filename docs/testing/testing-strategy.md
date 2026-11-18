# HealthBridge India — Testing Architecture Audit & QA Strategy

## 1. Repository Testing Architecture Audit

An exhaustive audit of the `healthbridge-india` pnpm monorepo (`apps/api`, `apps/web`, `packages/*`, `scripts/`, and `.github/workflows/`) was completed prior to Phase 19 test implementation.

### Application Surface Inventoried
- **Backend API (`apps/api`):** Express `4.22.3` + Mongoose `8.24.9` + Zod `3.25.76` across **25 modular route groups** (`auth`, `users`, `patients`, `doctors`, `appointments`, `prescriptions`, `records`, `consent`, `laboratory`, `lab-order`, `lab-report`, `quality`, `workforce`, `pharmacy`, `notifications`, `search`, `abdm`, `privacy`, `security-monitoring`, `audit`, `events`, `platform`, `healthcare/medication-catalog`, `health`, `docs`).
- **Frontend Web (`apps/web`):** Next.js `14.2.35` App Router + React `18.3.1` + Redux Toolkit + TanStack Query + Tailwind CSS across **5 role-based portals** (`PATIENT`, `DOCTOR`, `PHARMACY`, `LABORATORY`, `ADMIN`), public landing/auth pages, global search, notification center, analytics dashboards, medical document vault, and ABDM/ABHA workflows.
- **Shared Packages (`packages/*`):** `@healthbridge/config`, `@healthbridge/shared-types`, and `@healthbridge/validation` (25 Zod validation modules).

### Baseline Findings Before Phase 19
| Area | Pre-Phase 19 State | Risk / Gap Identified | Phase 19 Action Taken |
| --- | --- | --- | --- |
| **Backend Unit Tests** | 21 Vitest files (183 tests) | Missing centralized synthetic fixture safety guard (`NODE_ENV === 'test'`), token tampering/expiry unit assertions, and FHIR R4 DocumentReference unit checks | Created reusable `apps/api/tests/fixtures/synthetic-healthcare-fixtures.ts` + `phase19-fixtures-auth-consent-fhir.test.ts` → **22 files, 188 tests** |
| **Backend Integration & API E2E** | 46 integration files + 1 full-journey E2E file (634 tests) | Missing HTTP integration tests for Phase 16 signed document access/preview/archival and Phase 18 read-only `/api/v1/audit` immutability + cross-role regression matrix | Added `phase19-audit-and-records-api.test.ts` + `phase19-auth-security-regression.test.ts` → **49 files, 646 tests** |
| **Frontend Unit & Component Tests** | **0 test files, no test script** | Critical client security (`sanitizeRedirectPath`), error mapping, CSV formula-injection neutralization, Redux auth state, role-scoped quick actions, and `ProtectedRoute` UI lacked automated tests | Configured `apps/web/vitest.config.mts` reusing monorepo Vitest 5.1.0 + added **4 frontend test suites (32 tests)** |
| **Browser E2E, Responsive & Accessibility** | **0 Playwright specs; no live `axe-core` runner** | No automated verification across 8 viewports (`320px–1440px`), Light/Dark mode, or WCAG 2.2 AA rules | Created Playwright E2E suite (`e2e/`) for all 5 roles + zero-dependency Chrome CDP + `axe-core@4.14.0` live auditor (`scripts/qa-live-browser-audit.mjs`) |
| **CI/CD Automation** | Security-only workflow (`.github/workflows/security-ci.yml`) | Did not execute frontend tests, backend integration tests, or API E2E journey tests | Created `.github/workflows/ci-qa.yml` covering all quality gates + manual staging Playwright gate |

---

## 2. Testing Pyramid & Quality Gates

1. **Static Verification (Fastest Gate):** `pnpm typecheck` (`tsc --noEmit` across all workspaces) and `pnpm lint` (`next lint`).
2. **Unit & Component Layer:** Vitest 5.1.0 across `apps/web/tests/unit` (32 tests) and `apps/api/tests/unit` (188 tests) — runs in under 2 seconds with zero external dependencies.
3. **API Integration & Workflow E2E Layer:** Vitest + Supertest (`apps/api/tests/integration` + `apps/api/tests/e2e`) across 49 files (646 tests) exercising Express routing, Helmet/CORS/CSP headers, JWT auth, RBAC permissions, Zod validation, consent enforcement, idempotent outbox events, and all clinical workflows.
4. **Live Browser Responsive, Accessibility & Performance Layer:** Headless Chrome CDP + `axe-core@4.14.0` (`scripts/qa-live-browser-audit.mjs`) + Playwright E2E specs (`e2e/specs/*.spec.ts`).
5. **Security & Compliance Regression Layer:** Dedicated IDOR, auth bypass, magic-byte spoofing, CSV formula-injection, audit immutability, secret-hygiene, and dependency audit checks.

---

## 3. Synthetic Test Data Governance

All automated tests use synthetic-only fixtures defined in `apps/api/tests/fixtures/synthetic-healthcare-fixtures.ts` and `e2e/fixtures/synthetic-users.ts`:
- **Zero Real PHI:** All identities use `@synthetic.healthbridge.test` emails and synthetic 10-digit Indian test phone ranges (`90000xxxxx`).
- **Hard Production Safety Guards:** `assertTestEnvironment()` throws `SECURITY_BLOCK` whenever `NODE_ENV !== 'test'`, and `assertSafeE2ETarget()` blocks Playwright execution against any hostname outside `localhost`, `127.0.0.1`, or `staging.healthbridge.internal`.
- **ABDM Test Separation:** Local unit tests, mocked HIE/ABHA integration tests, and real NHA ABDM Sandbox tests are strictly separated; mock tests are never reported as live sandbox verification.
