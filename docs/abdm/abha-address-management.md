# ABHA Address Management Architecture

## 1. Strict Separation of ABHA Number vs ABHA Address

HealthBridge preserves the distinct semantic and database roles of both identifiers:

| Identifier | Format | Purpose | Storage Strategy |
|---|---|---|---|
| **ABHA Number** | 14 digits (`91-XXXX-XXXX-XXXX`) | Foundational national health ID | AES-256-GCM encrypted (`abhaNumberEncrypted`, `select: false`) + HMAC-SHA256 blind index (`abhaNumberHash`) + masked display (`abhaNumberMasked`) |
| **ABHA Address** | `username@sbx` (sandbox) / `username@abdm` (prod) | Consent-based PHR routing alias | Distinct `abhaAddress` field + `abhaAddressHistory[]` array tracking `ACTIVE`, `SUPERSEDED`, and `UNLINKED` states |

ABHA Number and ABHA Address are **never** treated as interchangeable, and an ABHA Address is **never** marked verified unless external ABHA V3 OTP verification succeeded.

## 2. Implemented Official V3 Operations

1. **Availability / Existence Check (`POST /api/v1/abdm/abha/address/check`):**
   - Maps to `POST /abha/api/v3/phr/app/enrollment/isExists`.
2. **Post-Enrolment Suggestions (`GET /api/v1/abdm/abha/address/suggestions`):**
   - Maps to `GET /abha/api/v3/enrollment/enrol/suggestion` with `Transaction_Id` header.
3. **Address Enrolment / Creation (`POST /api/v1/abdm/abha/address/create`):**
   - Maps to `POST /abha/api/v3/enrollment/enrol/abha-address` for a verified enrolment transaction.
4. **ABHA Address Ownership Verification:**
   - Initiate OTP: `POST /api/v1/abdm/abha/address/verify` -> `POST /abha/api/v3/phr/web/login/abha/request/otp` (`loginHint: "abha-address"`, RSA-OAEP-SHA1 encrypted).
   - Confirm OTP: `POST /api/v1/abdm/abha/address/verify/confirm` -> `POST /abha/api/v3/phr/web/login/abha/verify`.
5. **Address History:**
   - Recorded in `AbhaLinkModel.abhaAddressHistory` and visible on `/patient/abha/history`.
