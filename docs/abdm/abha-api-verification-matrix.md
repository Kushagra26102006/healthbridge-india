# ABHA V3 Official API Verification Matrix

> **Verification Date:** 2026-11-18  
> **Primary Official Sources:** `https://abdm.gov.in/`, `https://sandbox.abdm.gov.in/`, `https://developer.abdm.gov.in/`, `https://abhasbx.abdm.gov.in/abha/api/v3`, `https://nrces.in/ndhm/fhir/r4/`  
> **Accuracy Notice:** Endpoints and payload contracts below were verified from official ABDM V3 documentation. Live sandbox execution requires organization onboarding credentials on `sandbox.abdm.gov.in`.

---

## 1. Official ABHA V3 API Verification Matrix

| Workflow | Official API / Version | Authentication | Verified | Implementation Status |
|---|---|---|---|---|
| Gateway Session Token Acquisition | `POST /api/hiecm/gateway/v3/sessions` (`V3`) | `clientId` + `clientSecret` + `X-CM-ID` (`sbx` / `abdm`) + `REQUEST-ID` + `TIMESTAMP` | Yes (Official ABDM V3 Docs) | Implemented (`AbdmAuthenticationService` — mock + sandbox HTTPS adapter) |
| ABHA Public Certificate Retrieval | `GET /abha/api/v3/profile/public/certificate` (`V3`) | Gateway `Authorization: Bearer <token>` + `REQUEST-ID` + `TIMESTAMP` | Yes (Official ABDM V3 Docs) | Implemented (`AbdmAuthenticationService.getAbhaPublicCertificate`) |
| ABHA Creation — Request Aadhaar OTP | `POST /abha/api/v3/enrollment/request/otp` (`V3`) | Gateway Bearer Token + RSA-OAEP-SHA1 encrypted `loginId` (`aadhaar`) | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.requestEnrollmentAadhaarOtp` + `/api/v1/abdm/abha/creation/initiate`) |
| ABHA Creation — Verify OTP & Enrol (`byAadhaar`) | `POST /abha/api/v3/enrollment/enrol/byAadhaar` (`V3`) | Gateway Bearer Token + RSA-OAEP-SHA1 encrypted `otpValue` + `consent` (`abha-enrollment` v1.4) | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.completeEnrollmentByAadhaar` + `/api/v1/abdm/abha/creation/complete`) |
| ABHA Address Suggestions (Post-Enrolment) | `GET /abha/api/v3/enrollment/enrol/suggestion` (`V3`) | Gateway Bearer Token + `Transaction_Id` header | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.getAbhaAddressSuggestions` + `/api/v1/abdm/abha/address/suggestions`) |
| ABHA Address Creation / Enrolment | `POST /abha/api/v3/enrollment/enrol/abha-address` (`V3`) | Gateway Bearer Token + active `txnId` | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.createAbhaAddress` + `/api/v1/abdm/abha/address/create`) |
| ABHA Number Verification — Request OTP | `POST /abha/api/v3/profile/login/request/otp` (`V3`) | Gateway Bearer Token + RSA-OAEP-SHA1 encrypted `loginId` (`abha-number`) | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.requestAbhaNumberLoginOtp` + `/api/v1/abdm/abha/verify`) |
| ABHA Number Verification — Verify OTP | `POST /abha/api/v3/profile/login/verify` (`V3`) | Gateway Bearer Token + RSA-OAEP-SHA1 encrypted `otpValue` -> returns `X-Token` | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.verifyAbhaNumberLoginOtp` + `/api/v1/abdm/abha/verify/confirm`) |
| Authorized ABHA Profile Retrieval | `GET /abha/api/v3/profile/account` (`V3`) | Gateway Bearer Token + User `X-token: Bearer <userToken>` | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.getAuthorizedProfile` + `/api/v1/abdm/abha/profile`) |
| ABHA Address Existence / Availability Check | `POST /abha/api/v3/phr/app/enrollment/isExists` (`V3`) | Gateway Bearer Token | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.checkAbhaAddressExists` + `/api/v1/abdm/abha/address/check`) |
| ABHA Address Verification — Request OTP | `POST /abha/api/v3/phr/web/login/abha/request/otp` (`V3`) | Gateway Bearer Token + RSA-OAEP-SHA1 encrypted `loginId` (`abha-address`) | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.requestAbhaAddressLoginOtp` + `/api/v1/abdm/abha/address/verify`) |
| ABHA Address Verification — Verify OTP | `POST /abha/api/v3/phr/web/login/abha/verify` (`V3`) | Gateway Bearer Token + RSA-OAEP-SHA1 encrypted `otpValue` | Yes (Official ABDM V3 Docs) | Implemented (`AbhaV3Client.verifyAbhaAddressLoginOtp` + `/api/v1/abdm/abha/address/verify/confirm`) |
| Local HealthBridge Identity Unlink | Internal HealthBridge Association Removal | Authenticated Patient JWT + Explicit Confirmation | N/A (Internal Association) | Implemented (`LOCAL_HEALTHBRIDGE_UNLINK` — preserves audit history; does not deactivate national ABHA) |
| Demographic-Only Auto-Linking / Legacy V1–V2 | Deprecated / Policy-Prohibited | Blocked | Verified Deprecated / Prohibited | Explicitly Blocked (`ABDM_UNSUPPORTED_OPERATION`) |

---

## 2. Cryptographic & Header Standards Verified

- **Payload Field Encryption:** `RSA/ECB/OAEPWithSHA-1AndMGF1Padding` (Base64-encoded ciphertext using SHA-1 digest and MGF1). Implemented in `apps/api/src/modules/abdm/utils/abha-crypto.util.ts`.
- **Mandatory V3 Request Headers:**
  - `Authorization: Bearer <Gateway Access Token>`
  - `REQUEST-ID`: RFC 4122 UUID v4
  - `TIMESTAMP`: UTC ISO-8601 timestamp (`YYYY-MM-DDTHH:mm:ss.sssZ`)
  - `X-CM-ID`: `sbx` (sandbox) or `abdm` (production)
  - `X-token`: `Bearer <User Session Token>` (strictly for user-authenticated profile calls; never exposed to browser)
- **Sandbox Base URLs:**
  - Gateway Sessions: `https://dev.abdm.gov.in`
  - ABHA V3 Services: `https://abhasbx.abdm.gov.in/abha/api/v3`

---

## 3. Items Dependent on Official Sandbox Account Access

- Live verification of exact V3 error sub-codes and rate-limit response headers on `abhasbx.abdm.gov.in`.
- Provisioning of synthetic Aadhaar/ABHA test identities through the NHA Sandbox portal.
- Verification of optional mobile-update or biometric/face-auth scopes (not implemented until verified under authenticated sandbox documentation).
