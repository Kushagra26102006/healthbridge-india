# ABDM Sandbox Testing Report (Day 7 Audit)

> **Audit Date:** 2026-11-18  
> **Actual Live Sandbox Tests Executed:** **`0`**  
> **Sandbox Connectivity Status:** `NOT_EXECUTED_PENDING_SANDBOX_ONBOARDING`

## 1. Why Live Sandbox Tests Were Not Executed
HealthBridge India currently has `.env.example` configured safely with `ABDM_ENABLED=false`, `ABDM_ENVIRONMENT=disabled`, and `ABDM_ALLOW_PRODUCTION=false`. No official NHA ABDM Sandbox `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, registered HFR Facility ID, registered HIP/HIU Bridge webhook URL, or live BouncyCastle short-Weierstrass Curve25519 Fidelius sidecar has been provisioned in this environment.

## 2. Distinction Between Mocked & Live Test Evidence
| Test Category | Files | Tests Executed | Passed | Failed | Skipped | Mode |
|---|---|---|---|---|---|---|
| ABDM Foundation Unit & Integration | `abdm-foundation.test.ts`, `abdm-integration-foundation.test.ts` | 22 | 22 | 0 | 0 | Mocked |
| ABHA Identity Unit & Integration | `abha-identity.test.ts`, `abha-integration.test.ts` | 21 | 21 | 0 | 0 | Mocked |
| Consent Manager Unit & Integration | `abdm-consent-manager.test.ts`, `abdm-consent-integration.test.ts` | 19 | 19 | 0 | 0 | Mocked |
| HIP / HIU Exchange Unit & Integration | `abdm-hip-hiu.test.ts`, `abdm-hip-hiu-integration.test.ts` | 14 | 14 | 0 | 0 | Mocked |
| Day 7 End-to-End Audit & Hardening | `abdm-day7-e2e-audit.test.ts` | 2 | 2 | 0 | 0 | Mocked |
| **Total ABDM Automated Suite** | **9 ABDM Test Files** | **78** | **78** | **0** | **0** | **Mocked** |
| **Full Monorepo Suite (`pnpm test`)** | **48 Test Files** | **686** | **686** | **0** | **0** | **Mocked / In-Memory** |
| **Live ABDM Sandbox M1/M2/M3 Tests** | N/A | **0** | **0** | **0** | **0** | **Not Executed** |

## 3. Required User Onboarding Actions Before Live Sandbox Testing
1. Register organization and software product on `https://sandbox.abdm.gov.in/`.
2. Provision Sandbox `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, and `X-CM-ID=sbx`.
3. Register HFR test facility ID and publicly reachable HTTPS Bridge webhook endpoints.
4. Deploy an official Java Fidelius sidecar (or verified short-Weierstrass Curve25519 KMS) and register it with `abdmEncryptionAdapter.registerLiveProvider(...)`.
5. Run M1 (ABHA), M2 (HIP), and M3 (HIU) Sandbox test scenarios using NHA synthetic test identities only.
