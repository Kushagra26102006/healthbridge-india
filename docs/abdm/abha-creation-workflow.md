# ABHA Creation Workflow (Official V3 Aadhaar OTP)

## 1. Verified Workflow Summary

HealthBridge implements ABHA creation exclusively through the verified **ABDM ABHA V3 Aadhaar OTP (`byAadhaar`)** sequence:

1. **Patient Authorization:** Authenticated patient (`PATIENT` JWT) confirms explicit consent (`patientConsentConfirmed: true`).
2. **Initiate Aadhaar OTP (`POST /api/v1/abdm/abha/creation/initiate`):**
   - Validates 12-digit synthetic/test Aadhaar format via Zod.
   - Encrypts Aadhaar number via `RSA/ECB/OAEPWithSHA-1AndMGF1Padding` using ABHA V3 public certificate.
   - Calls `POST /abha/api/v3/enrollment/request/otp` with `scope: ["abha-enrol"]`, `loginHint: "aadhaar"`, `otpSystem: "aadhaar"`.
   - Creates an `AbhaTransaction` record with 10-minute expiry (`VERIFICATION_IN_PROGRESS`), correlation ID, and masked placeholder (`AADHAAR-XXXX-XXXX-****`).
   - **Never** logs or persists the Aadhaar number.
3. **Complete Enrolment (`POST /api/v1/abdm/abha/creation/complete`):**
   - Validates 6-digit OTP and explicit ABHA enrolment consent (`consent.code: "abha-enrollment"`, `consent.version: "1.4"`).
   - Encrypts OTP via RSA-OAEP-SHA1 and calls `POST /abha/api/v3/enrollment/enrol/byAadhaar`.
   - Stores returned `X-Token` transiently in server memory only.
   - Encrypts returned ABHA Number using AES-256-GCM and computes HMAC-SHA256 blind index for duplicate protection.
   - Discards OTP immediately (never persisted or logged).
4. **Optional ABHA Address Selection:**
   - Fetches suggestions via `GET /api/v1/abdm/abha/address/suggestions` (`GET /v3/enrollment/enrol/suggestion`).
   - Enrols chosen address via `POST /api/v1/abdm/abha/address/create` (`POST /v3/enrollment/enrol/abha-address`).
5. **Explicit Linking Confirmation (`POST /api/v1/abdm/abha/link`):**
   - Patient reviews verified outcome and explicitly confirms identity linking (`consentScope: 'IDENTITY_LINKING_ONLY'`).

## 2. Unsupported Methods Blocked

- Unverified demographic creation, offline fake ABHA number generation, and deprecated V1/V2 registration endpoints are strictly blocked (`400 ABDM_UNSUPPORTED_OPERATION`).
- HealthBridge **never** generates a fake ABHA number and marks it as live-verified. Synthetic mock values are strictly labeled `isMocked: true` in `development` mode.
