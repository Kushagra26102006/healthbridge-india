# Laboratory Security Audit Report — HealthBridge India (Day 6)

> **Scope & Disclaimer:** This report documents an internal code, architecture, API, database, and automated test security audit of the HealthBridge India Laboratory module. It does **not** constitute a formal third-party penetration test, SOC 2 audit, or regulatory certification.

---

## 1. Security Domains Audited
1. **Authentication:** JWT access/refresh token verification (`authenticate` middleware), session revocation, account status (`ACTIVE`) checks, rate-limited `/auth` endpoints (`authLimiter`), and cookie parsing (`COOKIE_SECRET`).
2. **Authorization & Tenancy:** Platform RBAC (`authorize`), laboratory-scoped deny-by-default RBAC (`laboratoryAuthorizationService`, `requireLabPermission`), Segregation of Duties (SoD), patient ownership, ordering-doctor authorization, and cross-laboratory isolation.
3. **Data Privacy:** Minimum-necessary clinical responses, private PDF streaming (`Cache-Control: private, no-cache, no-store, must-revalidate`), privacy-safe notification messages (no lab result values in push/email previews), and zero raw secret/token logging.
4. **API Security:** Zod schema validation, Express JSON size limits (`10mb`), Helmet headers, explicit CORS origin configuration, rate limiting (`apiLimiter`), pagination clamping (`limit <= 100`), regex escaping, and centralized error sanitization.
5. **Database & Secrets:** `.gitignore` exclusion of `.env` / `.env*.local`, unique constraints, compound indexes, append-only `AuditLogModel`, and `.env.example` placeholder hygiene.
6. **Frontend Security:** Protected dashboard layouts, no reliance on frontend-only permission checks (every action enforced server-side), and removal of live production mock fallbacks.

---

## 2. Prioritized Audit Findings & Remediation Status

### CRITICAL Findings
| ID | Finding | Location | Remediation Status |
|---|---|---|---|
| **CRIT-01** | **Cross-Tenant `X-Laboratory-Id` Header Spoofing (IDOR):** `resolveLaboratoryId` blindly trusted untrusted `req.headers['x-laboratory-id']` for any `LABORATORY` caller, allowing Lab B to read/mutate Lab A QMS, Instrument, and Reagent records. | `apps/api/src/modules/laboratory/controllers/quality.controller.ts` | **FIXED & VERIFIED** — Non-`ADMIN` callers resolve strictly from `LaboratoryProfileModel` / active `LaboratoryStaffModel`; mismatched `X-Laboratory-Id` headers now return `403 Forbidden`. Covered by automated test in `laboratory-e2e-workflow-and-failures.test.ts`. |
| **CRIT-02** | **Database Credentials Committed in `.env.example`:** Root `.env.example` line 9 contained a real MongoDB Atlas URI with embedded credentials instead of a placeholder. | `.env.example` | **FIXED** — Replaced immediately with `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/healthbridge_dev?retryWrites=true&w=majority`. **Action Required by Owner:** Rotate the exposed MongoDB Atlas database user password immediately and audit Atlas access logs. |

### HIGH Findings
| ID | Finding | Location | Remediation Status |
|---|---|---|---|
| **HIGH-01** | **Missing Cross-Laboratory Ownership Checks on Report Mutations:** `recordTestResult`, `submitReportForReview`, `reviewReport`, `publishReport`, and `requestAmendment` did not verify `entity.laboratoryId === user.laboratoryId`. | `apps/api/src/modules/laboratory/services/lab-report.service.ts` | **FIXED & VERIFIED** — Added `assertLaboratoryOwnership()` and enforced across all 6 report mutation/draft methods + lab role checks for approval & amendment. |
| **HIGH-02** | **Patient/Doctor Unpublished Draft Bypass:** Passing `?status=DRAFT` on `GET /api/v1/lab-reports` overwrote the `PUBLISHED`-only query filter for `PATIENT`/`DOCTOR`; direct doctor access to `DRAFT` reports was also unrestricted. | `apps/api/src/modules/laboratory/services/lab-report.service.ts` | **FIXED & VERIFIED** — Intersected requested status filter with role-allowed published statuses; blocked direct doctor access to `DRAFT`/`PENDING_REVIEW` (`403`). |
| **HIGH-03** | **Reagent Consumption from Quarantined/Expired Lots & Non-Atomic Negative Adjustment:** `CONSUMPTION` did not block `QUARANTINED`/`RECALLED`/`EXPIRED` lots, and negative `ADJUSTMENT` checked balance in memory instead of atomically in MongoDB. | `apps/api/src/modules/laboratory/services/reagent-inventory.service.ts` | **FIXED & VERIFIED** — Blocked clinical `CONSUMPTION` on `QUARANTINED`, `RECALLED`, or `EXPIRED` lots (`400`) and added atomic `$gte` filter on negative adjustments. |
| **HIGH-04** | **Overdue Calibration & Unauthorized QC Override:** `checkQCEligibility` did not block `OVERDUE` calibrations, and `authorizeReleaseOverride` did not enforce role authorization (allowing `LAB_TECHNICIAN` overrides). | `apps/api/src/modules/laboratory/services/qc-release-gate.service.ts` | **FIXED & VERIFIED** — Blocked `OVERDUE` / past-due `nextCalibrationDate` calibrations and restricted QC overrides to authorized roles (`LAB_ADMIN`, `LAB_QUALITY_MANAGER`, `LAB_PATHOLOGIST`, `LAB_MANAGER`, `LAB_SUPERVISOR`, `ADMIN`). |
| **HIGH-05** | **Multi-User Staff Tenancy Resolution Missing in Report & QMS Controllers:** Active staff members (`LaboratoryStaffModel`) could not resolve their parent `laboratoryId` or `labRole` in `lab-report.controller.ts` and `quality.controller.ts`. | `lab-report.controller.ts`, `quality.controller.ts` | **FIXED & VERIFIED** — Both controllers now resolve `LaboratoryStaffModel` (`status: 'ACTIVE'`) and propagate `laboratoryId` and `labRole` cleanly while preserving SoD. |

### MEDIUM Findings
| ID | Finding | Location | Remediation Status |
|---|---|---|---|
| **MED-01** | **Demo Fallback Active in Production:** `getDemoLabReports` / `getDemoLabOrders` ran regardless of `NODE_ENV`. | `apps/api/src/modules/laboratory/services/lab-report.service.ts` | **FIXED** — Strictly gated behind `process.env.NODE_ENV !== 'production'`. |
| **MED-02** | **Unbounded Pagination & Unescaped `$regex` Search (ReDoS Risk):** Search parameters were interpolated raw into MongoDB `$regex` and `limit` was unclamped. | `lab-report.service.ts`, `reagent-inventory.service.ts` | **FIXED** — Clamped `limit` to `[1, 100]` and escaped regex metacharacters. |
| **MED-03** | **Unauthenticated Token Brute-Force Surface on `/staff/accept-invite`:** Endpoint accepts token without requiring `LABORATORY` role (necessary for onboarding). | `apps/api/src/modules/laboratory/routes/laboratory.routes.ts` | **MITIGATED / DOCUMENTED** — Protected by `apiLimiter` and 256-bit cryptographically random SHA-256 tokens (7-day TTL); consider applying stricter `authLimiter` specifically to `/staff/accept-invite` in production. |
| **MED-04** | **Hardcoded Accreditation Text in PDF Header:** PDF template statically printed NABL/ABDM compliance text. | `apps/api/src/modules/laboratory/services/report-pdf.service.ts` | **FIXED** — Only prints accreditation reference if explicitly present on report metadata. |

### LOW Findings
| ID | Finding | Recommendation |
|---|---|---|
| **LOW-01** | `helmet({ contentSecurityPolicy: false })` in `apps/api/src/app.ts` to allow OpenAPI docs rendering. | Enable strict CSP on non-docs API routes or serve Swagger UI on a scoped path CSP in production. |
| **LOW-02** | Refresh token storage & CORS multi-origin support. | Ensure `COOKIE_SECURE=true` and `SameSite=None` (or `Lax` on same top-level domain) over HTTPS in production, and parse comma-separated `CORS_ORIGIN` if multiple web origins are deployed. |
| **LOW-03** | Client-side React Hook `exhaustive-deps` lint warnings in Day 6 Task 05 QMS hooks (`use-laboratory-quality.ts`). | Non-security maintainability item; extract serialized filter keys before `useCallback` dependency arrays in a future cleanup sprint. |
