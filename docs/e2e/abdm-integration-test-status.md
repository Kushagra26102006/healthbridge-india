# HealthBridge India — ABDM & FHIR R4 Integration Test Status (Day 8 Task 05)

## Clear Separation: Local / Synthetic Validation vs Live ABDM Sandbox

| Area | Local / Synthetic Verification | Live NHA ABDM Sandbox Status |
| --- | --- | --- |
| Internal Patient-to-FHIR R4 & Bundle Validation | **VERIFIED** (`fhirR4Validator.validateResource`, `abdm-foundation.test.ts`, `complete-patient-journey.e2e.test.ts`) | Not submitted to official HAPI FHIR IG validator CLI |
| ABHA Number/Address Association | **MOCKED** (`abha-identity.test.ts`, `abha-integration.test.ts`, `isMocked: true`, encrypted at rest, external-only association) | Pending official NHA Sandbox client credentials & Aadhaar/Mobile OTP gateway onboarding |
| ABDM Consent Manager Lifecycle | **MOCKED** (`abdm-consent-manager.test.ts`, `abdm-consent-integration.test.ts`) | Pending NHA Consent Manager callback webhook registration |
| ABDM HIP / HIU Discovery, Linking & Transfer | **MOCKED** (`abdm-hip-hiu.test.ts`, `abdm-hip-hiu-integration.test.ts`, `abdm-day7-e2e-audit.test.ts`) | Pending live HIP/HIU sandbox certification & mutual TLS / webhook verification |
| External Record Provenance & Duplicate Import Prevention | **VERIFIED** (`provenance: 'ABDM_EXTERNAL_IMPORT'`, `isMocked: true`, read-only badge, unique import dedupe) | Ready for real payload ingestion once sandbox enabled |

## Explicit Non-Certification Statement
HealthBridge India does **NOT** claim official NHA/ABDM M1/M2/M3 certification or live production ABDM interoperability at this milestone. `ABDM_ENABLED=false` and `ABDM_ALLOW_PRODUCTION=false` remain enforced by default until sandbox credentials, callback TLS endpoints, and official NHA conformance audits are completed.
