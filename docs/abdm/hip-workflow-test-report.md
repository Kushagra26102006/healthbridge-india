# ABDM HIP End-to-End Workflow Test Report (Day 7 Audit)

> **Execution Date:** 2026-11-18  
> **Environment:** `test` / `development` (`isMocked: true`, synthetic clinical data only)  
> **Live Sandbox Execution:** `0` live tests executed (`PENDING_ONBOARDING`)

## Test Coverage & Observed Results

| # | Test Scenario | Suite | Mode | Result |
|---|---|---|---|---|
| 1 | Authenticated HIP webhook accepts authorized request, derives patient strictly from Consent Artefact, packages minimum-necessary FHIR R4 `DocumentBundle`, encrypts payload, records `AbdmTransferPackageModel` & `AbdmTransferAcknowledgementModel` | `tests/unit/abdm-hip-hiu.test.ts` + `abdm-day7-e2e-audit.test.ts` | Mocked | **PASSED** |
| 2 | Unauthorized HIU participant mismatch rejected (`403 ABDM_PARTICIPANT_UNAUTHORIZED`) | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 3 | Expired consent artefact blocked by centralized validator (`403 ABDM_CONSENT_INVALID`) | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 4 | Revoked consent artefact blocked (`403 ABDM_CONSENT_INVALID`) | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 5 | Wrong purpose (`DSRCH` vs `CAREMGT`) & out-of-scope HI category (`Prescription` vs `DiagnosticReport`) blocked | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 6 | Unauthenticated HIP webhook rejected with `401` before Zod schema parsing | `tests/integration/abdm-hip-hiu-integration.test.ts` + `abdm-day7-e2e-audit.test.ts` | Mocked | **PASSED** |
| 7 | Duplicate transfer acknowledgement handled idempotently (`duplicate: true`) | `tests/integration/abdm-hip-hiu-integration.test.ts` | Mocked | **PASSED** |
| 8 | Sandbox mode encryption fails closed (`503 ABDM_ENCRYPTION_NOT_CONFIGURED`) until live Fidelius is configured | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |

**Summary:** All HIP unit, integration, and end-to-end mocked tests passed (`0` failed, `0` skipped).
