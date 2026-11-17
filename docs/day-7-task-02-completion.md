# Day 7 — Task 02 Completion Report: ABHA Integration — Sandbox Authentication, ABHA Number, ABHA Address, Patient Linking & Identity Verification

> **Accuracy Statement:** This report reflects **only** what was researched, implemented, and verified in Day 7 Task 02. All ABHA workflow tests executed in this task used **synthetic test data and mocked/development adapters** (`isMocked: true`). HealthBridge India does **NOT** claim live ABHA creation, live ABHA verification, live sandbox connectivity success, official NHA onboarding completion, official FHIR IG conformance, or production readiness.

---

## 1. Official ABHA APIs Verified
Verified on 2026-11-18 from official ABDM / NHA / NRCeS documentation (`abdm.gov.in`, `sandbox.abdm.gov.in`, `developer.abdm.gov.in`, `abhasbx.abdm.gov.in`, `nrces.in`) and documented in `docs/abdm/abha-api-verification-matrix.md`:
- `POST /api/hiecm/gateway/v3/sessions` — Gateway session access token acquisition (`clientId`, `clientSecret`, `grantType: "client_credentials"`, `X-CM-ID`).
- `GET /abha/api/v3/profile/public/certificate` — Dynamic RSA public certificate for `RSA/ECB/OAEPWithSHA-1AndMGF1Padding` encryption.
- `POST /abha/api/v3/enrollment/request/otp` — Request Aadhaar OTP for ABHA enrolment (`scope: ["abha-enrol"]`, `loginHint: "aadhaar"`).
- `POST /abha/api/v3/enrollment/enrol/byAadhaar` — Verify Aadhaar OTP and enrol ABHA (`consent: { code: "abha-enrollment", version: "1.4" }`).
- `GET /abha/api/v3/enrollment/enrol/suggestion` — Retrieve ABHA address suggestions (`Transaction_Id` header).
- `POST /abha/api/v3/enrollment/enrol/abha-address` — Create/enrol ABHA address.
- `POST /abha/api/v3/profile/login/request/otp` — Request OTP for ABHA number verification (`loginHint: "abha-number"`, `otpSystem: "abdm" | "aadhaar"`).
- `POST /abha/api/v3/profile/login/verify` — Verify ABHA number OTP & issue user `X-Token`.
- `GET /abha/api/v3/profile/account` — Retrieve authorized ABHA profile (`Authorization` + `X-token`).
- `POST /abha/api/v3/phr/app/enrollment/isExists` — Check ABHA address existence/availability.
- `POST /abha/api/v3/phr/web/login/abha/request/otp` & `POST /abha/api/v3/phr/web/login/abha/verify` — ABHA address ownership OTP verification.

## 2. API Versions Used
- **ABDM Gateway Sessions:** `V3` (`https://dev.abdm.gov.in/api/hiecm/gateway/v3/sessions`)
- **ABHA Services & PHR Web:** `V3` (`https://abhasbx.abdm.gov.in/abha/api/v3`)
- **FHIR R4 Patient Profile Alignment:** NRCeS ABDM FHIR R4 IG (`https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient`)
- Deprecated V1/V2 ABHA endpoints and unverified demographic auto-linking are explicitly blocked (`ABDM_UNSUPPORTED_OPERATION`).

## 3. Authentication Implementation Status
- **Status:** `IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER` (live sandbox execution `PENDING_ONBOARDING`).
- Extended `AbdmAuthenticationService` with:
  - Gateway Bearer token acquisition, caching, 60-second safety refresh margin, and 401 cache invalidation.
  - Dynamic ABHA V3 public certificate fetching/caching + `RSA/ECB/OAEPWithSHA-1AndMGF1Padding` encryption (`encryptAbhaV3Field`).
  - Server-side ephemeral user `X-Token` memory store (15m TTL, never persisted to DB or returned to frontend).
  - HTTPS-only enforcement in sandbox/production and `ABDM_ALLOW_PRODUCTION=false` default production lock.

## 4. ABHA Creation Implementation Status
- **Status:** `IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER` (verified via synthetic mocked tests only; live UIDAI/sandbox OTP `PENDING_ONBOARDING`).
- Implemented `POST /api/v1/abdm/abha/creation/initiate` and `POST /api/v1/abdm/abha/creation/complete` for the verified V3 Aadhaar OTP (`byAadhaar`) workflow, followed by optional address suggestions & creation and explicit linking confirmation.
- Aadhaar numbers and OTPs are RSA-encrypted in transit, never logged, and never persisted.

## 5. ABHA Number Verification Status
- **Status:** `IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER` (mocked tests passing; live sandbox `NOT_YET_VERIFIED`).
- Implemented `POST /api/v1/abdm/abha/verify` and `POST /api/v1/abdm/abha/verify/confirm` enforcing explicit patient consent, 10-minute OTP session expiry, correlation ID tracking, per-user OTP rate limiting, and structured status transitions (`NOT_LINKED`, `PENDING_VERIFICATION`, `VERIFICATION_IN_PROGRESS`, `VERIFIED`, `VERIFICATION_FAILED`, `REVOKED_OR_UNLINKED`).
- Syntactically valid ABHA numbers are never accepted as proof of ownership.

## 6. ABHA Address Workflow Status
- **Status:** `IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER` (mocked tests passing; live sandbox `NOT_YET_VERIFIED`).
- Implemented `POST /api/v1/abdm/abha/address/check` (`isExists`), `GET /api/v1/abdm/abha/address/suggestions`, `POST /api/v1/abdm/abha/address/create`, `POST /api/v1/abdm/abha/address/verify`, and `POST /api/v1/abdm/abha/address/verify/confirm`.
- Preserves strict semantic and database separation between 14-digit ABHA Number and `@sbx`/`@abdm` ABHA Address, including `abhaAddressHistory[]`.

## 7. Patient Identity Linking Status
- **Status:** `IMPLEMENTED_AND_VERIFIED_IN_TESTS` (local persistence + mocked ABHA verification).
- Created `AbhaLinkModel` and `AbhaTransactionModel` keeping internal `User._id` strictly separate from external ABHA identity.
- Enforces AES-256-GCM storage encryption (`select: false`), HMAC-SHA256 blind indexing, partial unique indexes preventing duplicate active links per patient or across patients (`409 ABDM_DUPLICATE_IDENTITY`), strict patient ownership (`req.user.userId`), demographic discrepancy review flagging (never auto-merging accounts), explicit consent boundary (`consentScope: 'IDENTITY_LINKING_ONLY'`), and authorized local unlinking (`LOCAL_HEALTHBRIDGE_UNLINK`) preserving audit history.
- Built 4 patient UI pages (`/patient/abha`, `/patient/abha/link`, `/patient/abha/verification`, `/patient/abha/history`) and extended `/admin/integrations/abdm` with persisted ABHA telemetry.

## 8. FHIR Mapping Status
- **Status:** `FOUNDATION_EXTENDED_UNVALIDATED_BY_HAPI_CLI`.
- Extended `AbdmFhirMapperService.mapPatient()` so `Patient.identifier` distinctly maps:
  - Internal HealthBridge MRN (`use: 'usual'`, `v2-0203#MR`, `https://healthbridge.in/identifiers`)
  - Verified ABHA Number (`use: 'official'`, `ndhm-identifier-type-code#ABHA`, `https://healthid.ndhm.gov.in`) — omitted with warning `UNVERIFIED_ABHA_NUMBER_OMITTED` unless `abhaVerified === true`
  - Verified ABHA Address (`use: 'secondary'`, `ndhm-identifier-type-code#PHR`, `https://healthid.ndhm.gov.in`)
- Unrelated FHIR resources do not expose patient ABHA identifiers.

## 9. Sandbox Connectivity Status
- **Status:** `PENDING_ONBOARDING` / `NOT_YET_VERIFIED`.
- No live requests were sent to `dev.abdm.gov.in` or `abhasbx.abdm.gov.in` because official sandbox client credentials have not yet been provisioned.

## 10. Mocked Tests Executed
- **Unit & Mocked Tests (`apps/api/tests/unit/abha-identity.test.ts`):** `17` tests executed (auth lifecycle, RSA-OAEP-SHA1, AES-256-GCM + HMAC blind index, mocked creation/verification/address workflows, timeout handling, unsupported op rejection, duplicate & cross-patient blocking, unlink auth, redaction, consent separation, FHIR Patient mapping).
- **Express API Integration Tests with Mocked Persistence (`apps/api/tests/integration/abha-integration.test.ts`):** `4` end-to-end HTTP test suites executed (RBAC, cross-patient hijack prevention, full verify/profile/link/history/unlink lifecycle, privacy-safe notifications, admin aggregate analytics with zero PII/secrets, disabled mode handling).
- **Prior ABDM Foundation Tests (`abdm-foundation.test.ts` + `abdm-integration-foundation.test.ts`):** `22` regression tests executed.
- **Full Monorepo Suite (`pnpm test`):** `43` test files / `651` tests executed.

## 11. Actual Sandbox Tests Executed
- **`0` actual live ABDM sandbox tests executed** (blocked pending official sandbox account & credentials from `sandbox.abdm.gov.in`).

## 12. Tests Passed
- **ABHA Task 02 Unit & Integration Tests:** `21 / 21` passed (100%).
- **Full Platform Suite (`pnpm test`):** `43 / 43` test files, **`651 / 651` tests passed** (3.72s).
- **`pnpm typecheck`:** `5 / 5` workspace packages passed (0 errors).
- **`pnpm lint`:** `5 / 5` workspace packages passed (0 errors).
- **`pnpm build`:** Passed cleanly (`15.7s`, including all 4 `/patient/abha*` routes and `/admin/integrations/abdm`).

## 13. Tests Failed
- **`0` tests failed.**

## 14. Tests Not Executed
- **Live ABDM Sandbox Session & ABHA V3 OTP Tests:** Not executed (no sandbox credentials provisioned).
- **External HAPI FHIR CLI Validation against NRCeS `ndhm.in` `package.tgz`:** Not executed (external Java CLI & IG package required).
- **Frontend Component / Browser E2E Tests (Playwright/Cypress):** Not configured in repository; frontend verified via `next lint`, `tsc --noEmit`, and `next build`.

## 15. Required User Onboarding Actions
1. Register organization & product on `https://sandbox.abdm.gov.in/`.
2. Acquire Sandbox `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, and official V3 API collections from `https://developer.abdm.gov.in/`.
3. Provision synthetic sandbox test Aadhaar / ABHA credentials per NHA Sandbox documentation (never use real citizen identifiers).
4. Configure backend runtime environment variables (`ABDM_ENABLED=true`, `ABDM_ENVIRONMENT=sandbox`, `ABDM_BASE_URL`, `ABDM_ABHA_BASE_URL`, `ABDM_X_CM_ID=sbx`, `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, `ABDM_IDENTIFIER_ENCRYPTION_KEY`) outside Git and execute live M1 sandbox verification.

## 16. Security Findings
- **Fixed during verification:** Hardened `AADHAAR_NUMBER_REGEX` and `ABHA_NUMBER_REGEX` with negative lookaround boundaries so 12-digit segments inside RFC 4122 UUID correlation IDs are never falsely mutated while standalone Aadhaar/ABHA numbers remain strictly redacted.
- Verified zero leakage of client secrets, Bearer tokens, `X-Token`, OTPs, Aadhaar numbers, or full ABHA numbers across logs, API responses, notifications, and Admin analytics.
- Verified `AbdmConsentAdapter` rejects linking-only / internal records when `ABDM_HIE_CM` consent is required (`INTERNAL_CONSENT_NOT_ABDM_ARTEFACT`).
- Verified `DOCTOR`, `LABORATORY`, and cross-patient requests are strictly blocked (`403`).

## 17. Remaining Limitations
- Live sandbox connectivity, exact V3 upstream error sub-codes, and real OTP delivery remain unverified until official sandbox credentials are supplied.
- Ephemeral user `X-Token` sessions are stored in single-instance server memory; multi-instance production deployments should back `X-Token` sessions and rate-limit buckets with Redis.
- Consent artefact exchange (HIE-CM) and health information transfer (HIP/HIU Fidelius encryption) are intentionally out of scope for Day 7 Task 02 and scheduled for subsequent Day 7 tasks.
