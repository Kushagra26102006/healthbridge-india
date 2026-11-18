# HealthBridge India — ABHA Identity Workflows (Phase 17)

## 1. Overview & Identity Principles

HealthBridge India integrates with official **ABHA V3** identity workflows (`apps/api/src/modules/abdm/clients/abha-v3.client.ts` and `apps/api/src/modules/abdm/services/abha-identity.service.ts`) while enforcing strict healthcare privacy boundaries:

- **No Fabricated Verification:** A patient is marked `VERIFIED` **only** after completing an OTP-verified workflow response from the backend identity service. Unverified inputs never receive verified badges.
- **Identity vs. Record Consent Separation:** Linking an ABHA identity (`IDENTITY_LINKING_ONLY`) associates a patient's identity with HealthBridge and **never** grants automatic permission to share medical records.
- **Encrypted Storage & Masking:** Full 14-digit ABHA numbers are encrypted at rest via `abha-crypto.util.ts` (`ABDM_IDENTIFIER_ENCRYPTION_KEY`) and returned to the UI strictly masked (e.g., `91-XXXX-XXXX-6666`).
- **Duplicate Association Prevention:** Active ABHA links are checked against existing active links across accounts; duplicate associations are blocked (`ABHA_LINK_DUPLICATE_BLOCKED`).

---

## 2. Implemented ABHA V3 Endpoints (Patient-Only RBAC)

All patient ABHA endpoints require JWT authentication (`authorize(['PATIENT'])`), derive the patient strictly from `req.user.userId`, and apply anti-brute-force rate limiting (`15 req / 15 min` on OTP routes; `60 req / 15 min` on read routes):

| Workflow | Endpoint | Method | Notes |
| --- | --- | --- | --- |
| Identity Status | `/api/v1/abdm/abha/status` | `GET` | Returns link status, verification status, masked ABHA number, PHR address, environment, and `isMocked` flag |
| Verification & Link History | `/api/v1/abdm/abha/history` | `GET` | Auditable transaction log with correlation IDs and previous address history |
| ABHA Creation (Initiate) | `/api/v1/abdm/abha/creation/initiate` | `POST` | Initiates Aadhaar OTP enrollment via V3 contract (synthetic mock in dev; live sandbox blocked until credentials provisioned) |
| ABHA Creation (Complete) | `/api/v1/abdm/abha/creation/complete` | `POST` | Verifies OTP and creates ABHA transaction record |
| ABHA Number Verification | `/api/v1/abdm/abha/verify` & `/verify/confirm` | `POST` | OTP ownership verification for an existing 14-digit ABHA number |
| ABHA Address Management | `/api/v1/abdm/abha/address/check`, `/suggestions`, `/create`, `/verify`, `/verify/confirm` | `GET` / `POST` | Distinct handling of PHR handle (`name@sbx` / `name@abdm`) vs 14-digit ABHA number |
| Authorized Profile Retrieval | `/api/v1/abdm/abha/profile` | `GET` | Retrieves profile strictly for an active verified session |
| Confirm Link | `/api/v1/abdm/abha/link` | `POST` | Associates verified ABHA identity with patient account (blocks duplicates) |
| Local Unlink | `/api/v1/abdm/abha/unlink` | `POST` | Removes local HealthBridge link with mandatory reason and immutable audit record (does not delete national NHA account) |

---

## 3. Patient ABHA Dashboard UI (`/patient/abha`)

- Displays real backend-derived connection status, verification badge (`NOT_LINKED`, `PENDING_VERIFICATION`, `VERIFICATION_IN_PROGRESS`, `VERIFIED`, `VERIFICATION_FAILED`, `REVOKED_OR_UNLINKED`), masked ABHA number, ABHA address, and explicit `SYNTHETIC MOCK MODE` badge whenever `status.isMocked === true`.
- Provides unified interoperability overview cards linking to **Linked Health Records** (`/patient/abdm/linked-records`), **Consent Overview** (`/patient/consent`), and **Data-Sharing History** (`/patient/abdm/transfer-history`), plus `<ErrorState>` retry recovery.

---

## 4. Sandbox & Onboarding Status

- **Implemented & Unit-Tested (Mocked):** All 17 unit tests in `apps/api/tests/unit/abha-identity.test.ts` pass (OTP flows, address checks, duplicate link prevention, local unlink, timeout error handling).
- **Blocked by Missing Credentials:** Live ABHA V3 sandbox calls (`https://abhasbx.abdm.gov.in/abha/api/v3`) require official NHA Sandbox `ABDM_CLIENT_ID` and `ABDM_CLIENT_SECRET`.
