# ABDM HIU End-to-End Workflow Test Report (Day 7 Audit)

> **Execution Date:** 2026-11-18  
> **Environment:** `test` / `development` (`isMocked: true`, synthetic clinical data only)  
> **Live Sandbox Execution:** `0` live tests executed (`PENDING_ONBOARDING`)

## Test Coverage & Observed Results

| # | Test Scenario | Suite | Mode | Result |
|---|---|---|---|---|
| 1 | Discovery initiation -> authenticated callback -> Care-Context Linking -> OTP confirmation -> Local unlink | `tests/unit/abdm-hip-hiu.test.ts` + `abdm-hip-hiu-integration.test.ts` + `abdm-day7-e2e-audit.test.ts` | Mocked | **PASSED** |
| 2 | Invalid participant, cross-patient discovery (`403`), duplicate discovery (`409`), duplicate link (`409`) | `tests/unit/abdm-hip-hiu.test.ts` + `abdm-hip-hiu-integration.test.ts` | Mocked | **PASSED** |
| 3 | HIU request initiation enforces centralized consent validation and generates server-memory ephemeral keys (private key never exposed in HTTP response) | `tests/integration/abdm-hip-hiu-integration.test.ts` | Mocked | **PASSED** |
| 4 | Encrypted data push webhook -> decrypt -> purge ephemeral key -> FHIR R4 validation -> immutable provenance import (`readOnly: true`) | `tests/unit/abdm-hip-hiu.test.ts` + `abdm-hip-hiu-integration.test.ts` + `abdm-day7-e2e-audit.test.ts` | Mocked | **PASSED** |
| 5 | Unencrypted data push rejected (`422 ABDM_ENCRYPTION_REQUIRED`) | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 6 | Cross-participant data push rejected (`403 ABDM_PARTICIPANT_UNAUTHORIZED`) | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 7 | Ambiguous patient match quarantined (`QUARANTINED_REVIEW`, transfer `REQUIRES_REVIEW`) | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 8 | Duplicate import skipped idempotently (`duplicatesSkipped: 1`) | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 9 | Invalid FHIR Bundle rejected (`rejectedEntries: 1`, transfer `FAILED`, never silently imported) | `tests/unit/abdm-hip-hiu.test.ts` | Mocked | **PASSED** |
| 10 | Doctor views only verified read-only records under active consent; Doctor blocked from modifying/reviewing records (`403`) | `tests/integration/abdm-hip-hiu-integration.test.ts` + `abdm-day7-e2e-audit.test.ts` | Mocked | **PASSED** |

**Summary:** All HIU unit, integration, and end-to-end mocked tests passed (`0` failed, `0` skipped).
