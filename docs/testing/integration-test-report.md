# HealthBridge India — API & Integration Test Execution Report

## 1. Execution Summary

Executed via Vitest `5.1.0` + Supertest `7.3.2` against the full Express application (`createApp()`) with isolated Mongoose mocks and synthetic fixtures.

| Suite | Command Executed | Test Files | Passed | Failed | Skipped | Duration |
| --- | --- | --- | --- | --- | --- | --- |
| **API Integration Suites (`tests/integration`)** | `pnpm --dir healthbridge-india/apps/api exec vitest run tests/integration tests/e2e` | 48 | **627** | 0 | 0 | Included below |
| **Backend Complete Patient Journey E2E (`tests/e2e`)** | Included in same run | 1 | **19** | 0 | 0 | Included below |
| **Combined Integration + API E2E Total** | `pnpm --dir healthbridge-india/apps/api exec vitest run tests/integration tests/e2e` | **49** | **646** | **0** | **0** | **4.71 s** |

---

## 2. Domain Coverage Matrix (49 Executed Test Files)

| Functional Domain | Verified Integration Test Suites | Key Behaviors Verified | Status |
| --- | --- | --- | --- |
| **Authentication, RBAC & Session Security** | `auth-middleware.test.ts`, `auth-security.test.ts`, `rbac-matrix.test.ts`, `security-architecture.test.ts`, `phase19-auth-security-regression.test.ts` | Valid/invalid login, expired & tampered JWT `401`, fail-closed public `ADMIN` registration, 5-role RBAC isolation, Helmet/CSP/no-`X-Powered-By` headers | **PASSED** |
| **Patient & Appointment Workflows** | `patient-profile.test.ts`, `appointments.test.ts` | Doctor discovery, future slot validation, booking, concurrency double-booking `409`, reschedule, cancellation, cross-patient isolation | **PASSED** |
| **Doctor Clinical Workspace** | `doctor-dashboard.test.ts`, `doctor-appointments.test.ts`, `doctor-schedule.test.ts`, `doctor-patients.test.ts`, `doctor-encounters.test.ts`, `doctor-prescriptions.test.ts`, `doctor-clinical-workflow.test.ts`, `doctor-settings.test.ts` | Consultation start/finalize, duplicate encounter prevention, draft vs. issued prescriptions, authorized patient workspace, schedule management | **PASSED** |
| **Pharmacy Operations** | `pharmacy-dashboard.test.ts`, `pharmacy-inventory-system.test.ts`, `pharmacy-dispensing-workflow.test.ts`, `pharmacy-order-fulfillment.test.ts`, `pharmacy-procurement-system.test.ts`, `pharmacy-settings-staff.test.ts` | Prescription queue verification, atomic stock deduction, duplicate dispense protection, inventory batches/expiry, supplier procurement | **PASSED** |
| **Laboratory Operations & QMS** | `laboratory-order-sample-accessioning.test.ts`, `laboratory-report-generation-approval.test.ts`, `laboratory-quality-management.test.ts`, `laboratory-workforce-operations.test.ts`, `laboratory-e2e-workflow-and-failures.test.ts`, `lab-reports.test.ts` | Order intake, barcode sample tracking, QC release gate blocking unapproved report publication, pathologist authorization, cross-lab isolation | **PASSED** |
| **Medical Documents & Consent** | `records.test.ts`, `consent.test.ts`, `privacy-governance.test.ts`, `phase19-audit-and-records-api.test.ts` | Magic-byte spoofing rejection, cross-patient IDOR `403` on signed tokens, tampered preview token rejection, owner-only archival, consent approval/denial/immediate revocation | **PASSED** |
| **Audit Logs, SecOps & Data Protection** | `security-monitoring.test.ts`, `data-protection.test.ts`, `phase19-audit-and-records-api.test.ts` | Read-only `/api/v1/audit/logs` & `/export` (CSV formula neutralization, redaction, zero `PUT`/`DELETE` routes), `ADMIN`-only enforcement, key rotation API | **PASSED** |
| **Notifications, Search, Events & Platform** | `notification-system.test.ts`, `unified-notifications.test.ts`, `global-search.test.ts`, `event-workflows.test.ts`, `platform-integration.test.ts`, `health.test.ts`, `error-handler.test.ts`, `rate-limit.test.ts`, `request-id.test.ts`, `not-found.test.ts` | Privacy-safe notification previews, role-scoped global search, durable outbox idempotency, rate limiting, request correlation IDs, standardized error envelopes | **PASSED** |
| **ABDM / ABHA / HIP / HIU (Mocked Integration)** | `abdm-integration-foundation.test.ts`, `abha-integration.test.ts`, `abdm-consent-integration.test.ts`, `abdm-hip-hiu-integration.test.ts`, `abdm-day7-e2e-audit.test.ts` | Mocked ABDM V3 gateway contracts, ABHA OTP/linking, consent artefacts, HIP/HIU FHIR bundle callbacks, error handling | **PASSED (MOCKED)** |

---

## 3. Blocked / External Integration Tests (Reported Honestly)

| Test Category | Status | Reason |
| --- | --- | --- |
| **Live NHA ABDM Sandbox Integration** | **BLOCKED** | Official NHA ABDM Sandbox `CLIENT_ID`, `CLIENT_SECRET`, and registered HIP/HIU callback URLs are not provisioned in this local environment. All ABDM integration results above are strictly mocked contract tests. |
| **Live MongoDB Replica-Set Transaction & Index Persistence Suite** | **NOT EXECUTED** | Integration suites ran against isolated Mongoose mocks without starting a live `mongod` replica set; CI Playwright/staging job provisions a live `mongo:7` service container. |
