# ABHA End-to-End Workflow Test Report (Day 7 Audit)

> **Execution Date:** 2026-11-18  
> **Environment:** `test` / `development` (`isMocked: true`, synthetic test data only)  
> **Live Sandbox Execution:** `0` live tests executed (`PENDING_ONBOARDING`)

## Test Coverage & Observed Results

| # | Test Scenario | Suite | Mode | Result |
|---|---|---|---|---|
| 1 | Gateway session token acquisition, 60s refresh margin, 401 invalidation, invalid credentials | `tests/unit/abha-identity.test.ts` | Mocked | **PASSED** |
| 2 | Dynamic RSA public cert encryption (`RSA/ECB/OAEPWithSHA-1AndMGF1Padding`) | `tests/unit/abha-identity.test.ts` | Mocked | **PASSED** |
| 3 | ABHA creation (Aadhaar OTP initiate & confirm + address suggestions + address creation) | `tests/unit/abha-identity.test.ts` | Mocked | **PASSED** |
| 4 | ABHA number verification OTP challenge, invalid OTP rejection, expired session rejection | `tests/unit/abha-identity.test.ts` | Mocked | **PASSED** |
| 5 | ABHA address existence check, creation, and ownership verification | `tests/unit/abha-identity.test.ts` | Mocked | **PASSED** |
| 6 | Patient identity linking (`AbhaLinkModel`), AES-256-GCM encryption & HMAC blind index | `tests/unit/abha-identity.test.ts` | Mocked | **PASSED** |
| 7 | Duplicate identity & cross-patient linking blocked (`409 ABDM_DUPLICATE_IDENTITY`) | `tests/unit/abha-identity.test.ts` | Mocked | **PASSED** |
| 8 | External timeout handling & deprecated V1/V2 operation blocking (`ABDM_UNSUPPORTED_OPERATION`) | `tests/unit/abha-identity.test.ts` | Mocked | **PASSED** |
| 9 | Full HTTP verify -> profile -> link -> history -> local unlink lifecycle & RBAC (`403` for Doctor/Lab/cross-patient) | `tests/integration/abha-integration.test.ts` | Mocked | **PASSED** |
| 10 | Privacy-safe notifications & zero-PII Admin ABHA analytics | `tests/integration/abha-integration.test.ts` | Mocked | **PASSED** |

**Summary:** `21 / 21` mocked unit & integration tests passed (`0` failed, `0` skipped). Live ABHA V3 Sandbox OTP tests remain unexecuted pending sandbox onboarding.
