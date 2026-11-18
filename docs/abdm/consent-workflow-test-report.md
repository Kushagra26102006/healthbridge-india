# ABDM Consent Manager End-to-End Workflow Test Report (Day 7 Audit)

> **Execution Date:** 2026-11-18  
> **Environment:** `test` / `development` (`isMocked: true`, synthetic test data only)  
> **Live Sandbox Execution:** `0` live tests executed (`PENDING_ONBOARDING`)

## Test Coverage & Observed Results

| # | Test Scenario | Suite | Mode | Result |
|---|---|---|---|---|
| 1 | HIU consent request initiation (verified ABHA required; returns `REQUESTED`, never fake `APPROVED`) | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 2 | Unauthorized role & unverified ABHA patient request rejection | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 3 | Verified `hiu/notify` (`GRANTED`) + `hiu/on-fetch` immutable artefact persistence (SHA-256 + AES-256-GCM) | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 4 | Forged / unknown `consentRequestId` callback rejected (`404`) | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 5 | Duplicate callback idempotency & out-of-order / stale timestamp anti-overwrite protection | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 6 | Terminal state monotonicity (`REVOKED` / `EXPIRED` cannot revert to `GRANTED`) | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 7 | 11-rule centralized validator: valid allowed; expired, revoked, wrong purpose, out-of-scope HI type, out-of-range date, wrong patient, internal non-ABDM consent, environment mismatch all denied; patient self-access preserved | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 8 | Patient revocation sets honest `PENDING_CONFIRMATION`, invalidates decision cache immediately, preserves history | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 9 | Scheduler-safe expiry & status synchronization sweep + `AbdmConsentSyncLogModel` recording | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 10 | FHIR R4 `Consent` projection preserving `originalPayloadSha256`, `unmappedFields[]`, `officialIgConformanceClaimed: false` | `tests/unit/abdm-consent-manager.test.ts` | Mocked | **PASSED** |
| 11 | Full Express HTTP lifecycle, cross-patient isolation (`403`), webhook auth-before-validation (`401`), replay guard, Admin zero-PII analytics | `tests/integration/abdm-consent-integration.test.ts` + `abdm-day7-e2e-audit.test.ts` | Mocked | **PASSED** |

**Summary:** `19 / 19` mocked Consent unit & integration tests + Day 7 E2E audit webhook checks passed (`0` failed, `0` skipped).
