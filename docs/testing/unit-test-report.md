# HealthBridge India — Unit Test Execution Report

## 1. Execution Summary

All unit tests were executed locally using Vitest `5.1.0` with synthetic fixtures and zero external network dependencies.

| Workspace | Command Executed | Test Files | Passed | Failed | Skipped | Duration |
| --- | --- | --- | --- | --- | --- | --- |
| **Frontend (`@healthbridge/web`)** | `pnpm --dir healthbridge-india test:web` | 4 | **32** | 0 | 0 | 186 ms |
| **Backend (`@healthbridge/api`)** | `pnpm --dir healthbridge-india/apps/api exec vitest run tests/unit` | 22 | **188** | 0 | 0 | 1.66 s |
| **Combined Unit Total** | — | **26** | **220** | **0** | **0** | **1.85 s** |

---

## 2. Frontend Unit & Component Suite (`apps/web/tests/unit/`)

| Test File | Tests | Verified Scope | Result |
| --- | --- | --- | --- |
| `security-and-errors.test.ts` | 10 | `sanitizeRedirectPath` (CWE-601 open-redirect prevention), `mapApiErrorToUserError` (401/403/404/409/422/429/500/network + DB stack trace stripping), `sanitizeCsvCell` / `buildCsvContent` (spreadsheet formula-injection neutralization), `filterByDateRange` | **10 / 10 PASSED** |
| `validation-schemas.test.ts` | 7 | `@healthbridge/validation` schemas: patient registration, password policy, fail-closed public ADMIN registration block, login & password reset, future appointment slots, 9 canonical health record categories + 10 MB / MIME limits, consent date-range & future expiry | **7 / 7 PASSED** |
| `redux-state-and-navigation.test.ts` | 5 | Redux `authSlice` & `systemSlice` transitions, strict 5-role quick-action isolation (zero cross-role route leakage), user-scoped `recent-navigation.ts` (ObjectId rejection, query stripping, pause/clear), ReDoS-safe term highlighting | **5 / 5 PASSED** |
| `ui-components-and-a11y.test.tsx` | 10 | Real React SSR rendering of `Button` (`disabled`, `aria-busy`), `Input` (`for`/`id`, `aria-invalid`, `aria-describedby`), `Badge`, `ErrorState` (`role="alert"`, `/login` recovery), `FormErrorSummary` (WCAG 3.3.1 jump links), `HighlightMatch` (XSS escaping), and `ProtectedRoute` (loading, unauthenticated block, cross-role `Access Restricted`, authorized render) | **10 / 10 PASSED** |

---

## 3. Backend Unit Suite (`apps/api/tests/unit/`)

All **22 backend unit test files (188 tests)** passed:
- **Phase 19 Additions (`phase19-fixtures-auth-consent-fhir.test.ts` — 5 tests):** Production-environment guard (`SECURITY_BLOCK`), JWT verification/expiry/tampering, PDF magic-byte validation vs. spoofed MZ executable rejection, NRCeS HL7 FHIR R4 `DocumentReference` LOINC mapping, and fail-closed synchronous consent revocation barrier.
- **Phase 18 Security & Audit (`phase18-security-audit.test.ts` — 6 tests):** Recursive nested audit redaction, Mongoose PHI/credential rejection, append-only immutability pre-hooks, CSV formula neutralization, security-event filtering, and fail-closed ADMIN registration.
- **ABDM / ABHA / FHIR R4 (5 files — 60 tests):** `abdm-foundation.test.ts`, `abha-identity.test.ts`, `abdm-consent-manager.test.ts`, `abdm-hip-hiu.test.ts`, `abdm-phase17-interoperability.test.ts` (strictly local unit & mock tests; NOT live NHA sandbox).
- **Core Healthcare, Security, Privacy, Search, Notifications & Validation (15 files — 117 tests):** `medical-documents.test.ts`, `laboratory-domain-services.test.ts`, `global-search.test.ts`, `unified-notifications.test.ts`, `event-processing.test.ts`, `platform-integration.test.ts`, `security-architecture.test.ts`, `security-monitoring.test.ts`, `data-protection.test.ts`, `privacy-governance.test.ts`, `sanitization.test.ts`, `validate.test.ts`, `pagination.test.ts`, `api-response.test.ts`, `app-error.test.ts`.

---

## 4. Coverage Notes

- `@vitest/coverage-v8` is not installed in the offline `node_modules` tree, so line/branch percentage instrumentation was not generated in this environment. Rather than fabricating coverage numbers, exact module-level test counts (**26 files, 220 passing unit tests**) are reported above; coverage instrumentation can be enabled in CI by installing `@vitest/coverage-v8`.
