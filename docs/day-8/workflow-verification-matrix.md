# HealthBridge India — Cross-Module Workflow Verification Matrix (Day 8 Task 06)

**Audit Date:** 2026-11-18  
**Verification Basis:** Backend Vitest Unit, Integration, and Day 8 E2E Journey Suites + Static Route/Contract Inspection.

---

## 1. End-to-End Clinical & Operational Workflow Matrix

| # | Workflow | Participating Modules | Expected Outcome | Verification Source | Status |
|---|---|---|---|---|---|
| 1 | **Patient Registration & Profile Onboarding** | Auth -> Users -> Patient | Account created with `PATIENT` role (public `ADMIN` registration blocked), JWT issued in HTTP-only cookie, profile initialized. | `apps/api/tests/integration/auth-security.test.ts`, `patient-profile.test.ts`, `e2e/day8-patient-journey.e2e.test.ts` | Verified |
| 2 | **ABHA Identity Linking & Mapping** | Patient -> ABDM -> Audit | ABHA address/number validated, linked to internal `patientId`, never leaked in public search or notification previews. | `apps/api/tests/integration/abha-integration.test.ts`, `e2e/day8-patient-journey.e2e.test.ts` | Verified (Mocked NHA Gateway) |
| 3 | **Appointment Booking & Lifecycle** | Patient -> Appointments -> Doctor -> Events -> Notifications | Appointment booked with conflict/slot protection, domain event published (`APPOINTMENT_BOOKED`), doctor & patient notified with valid deep-links. | `apps/api/tests/integration/appointments.test.ts`, `doctor-appointments.test.ts`, `event-workflows.test.ts` | Verified |
| 4 | **Clinical Encounter & Prescription Issuance** | Doctor -> Encounters -> Prescriptions -> Events -> Notifications -> Timeline | Doctor creates encounter and prescription (`PRESCRIPTION_CREATED`), patient timeline updates, patient receives notification. | `apps/api/tests/integration/doctor-clinical-workflow.test.ts`, `doctor-prescriptions.test.ts`, `e2e/day8-patient-journey.e2e.test.ts` | Verified |
| 5 | **Pharmacy Verification, Stock Deduction & Dispensing** | Doctor -> Pharmacy -> Inventory -> Dispensing -> Events -> Notifications | Pharmacy verifies prescription, deducts batch stock atomically with low-stock threshold alerts, creates immutable dispensing record (`PRESCRIPTION_DISPENSED`), notifies patient. | `apps/api/tests/integration/pharmacy-dispensing-workflow.test.ts`, `pharmacy-inventory-system.test.ts`, `e2e/day8-patient-journey.e2e.test.ts` | Verified |
| 6 | **Laboratory Order -> Sample Accessioning -> Result Entry -> Approval -> Publication** | Doctor -> Lab Orders -> Lab Samples -> Lab Reports -> Events -> Notifications -> Patient/Doctor | End-to-end accessioning, barcode validation, analyst entry, pathologist approval, publication (`LAB_REPORT_PUBLISHED`), critical value escalation (`CRITICAL_LAB_RESULT_DETECTED`), automatic visibility to Patient and Doctor. | `apps/api/tests/integration/laboratory-e2e-workflow-and-failures.test.ts`, `laboratory-report-generation-approval.test.ts`, `e2e/day8-patient-journey.e2e.test.ts` | Verified |
| 7 | **ABDM Consent Request -> Grant -> HIU Fetch -> Synchronous Revocation** | Doctor/HIU -> Consent -> ABDM -> Events -> Notifications | Consent request created, patient approves/grants artefact, HIU fetches FHIR R4 bundle; upon revocation (`CONSENT_REVOKED`), `ConsentEnforcementService.invalidateConsentImmediately` blocks access synchronously without waiting for async workers. | `apps/api/tests/integration/abdm-consent-integration.test.ts`, `abdm-hip-hiu-integration.test.ts`, `e2e/day8-patient-journey.e2e.test.ts` | Verified (Mocked External Gateway) |
| 8 | **Global Search & Autocomplete Across 5 Roles** | Search -> All Authorized Domain Collections -> Audit | Server enforces `ROLE_SEARCH_PERMISSION_MATRIX`, fails closed (`403`) on unauthorized types, ignores tampered `patientId`/`userId`, blocks sensitive health terms from session-only history, and never logs raw query strings. | `apps/api/tests/unit/global-search.test.ts`, `apps/api/tests/integration/global-search.test.ts` | Verified |
| 9 | **Unified Notifications Center & Real-Time SSE Sync** | Events -> Outbox Worker -> Notifications -> SSE Stream -> Frontend Sync | Real-time push over `GET /api/v1/notifications/stream` (cookie/Bearer auth; `?token=` rejected `401`), `Last-Event-ID` catch-up scoped to user, cross-tab `BroadcastChannel` sync, unread badge invalidation, `SECURITY` channel locked. | `apps/api/tests/integration/unified-notifications.test.ts`, `notification-system.test.ts` | Verified |
| 10 | **Event Outbox Retry, Idempotency & Dead-Letter Replay** | Domain Events -> Outbox -> Worker -> Admin Monitor | Deduplicated via `idempotencyKey`, exponential backoff retries, dead-letter isolation on poison messages, Admin-only inspect & replay via `/api/v1/events/dead-letter`. | `apps/api/tests/integration/event-workflows.test.ts`, `apps/api/tests/unit/event-engine.test.ts` | Verified |

---

## 2. Failure & Security Negative-Path Verification

| Scenario | Expected Behavior | Result |
|---|---|---|
| Patient A attempts to read Patient B's records, timeline, notifications, or recent searches | Denied (`403` / `404` / empty user-scoped slice) | Verified |
| Non-admin attempts `POST /api/v1/notifications/events` or `/api/v1/events/*` admin endpoints | Rejected with `403 FORBIDDEN` | Verified |
| Client attempts arbitrary event injection via `POST /api/v1/events` | Rejected (`404` — no public publish endpoint) | Verified |
| SSE connection attempts `?token=...` or `?access_token=...` in URL query string | Rejected with `401 UNAUTHORIZED` | Verified |
| Unauthenticated user attempts `GET /api/v1/search` | Rejected with `401 UNAUTHORIZED` | Verified |
| Role requests forbidden search resource type (e.g., `PATIENT` requesting `patient`, `ADMIN` requesting `medical_record`) | Rejected fail-closed with `403 FORBIDDEN` | Verified |
| Public registration attempts `role: "ADMIN"` | Rejected by Zod schema and `auth.service.ts` | Verified |
| Revoked consent used immediately before async event worker completes | Blocked synchronously by `ConsentEnforcementService` | Verified |
