# ABHA & ABDM V3 Authentication Architecture

## 1. Layered Authentication Model

ABDM ABHA V3 uses **three distinct cryptographic/authentication layers**, kept strictly separate in `apps/api/src/modules/abdm/services/abdm-authentication.service.ts`:

1. **System Gateway Bearer Token (`Authorization: Bearer <accessToken>`):**
   - Acquired via `POST /api/hiecm/gateway/v3/sessions` with `REQUEST-ID`, `TIMESTAMP`, `X-CM-ID`, and `{ clientId, clientSecret, grantType: "client_credentials" }`.
   - Cached in backend memory with a **60-second safety refresh margin** before expiry.
   - Automatically cleared on `401 Unauthorized` responses from ABDM endpoints.
2. **ABHA V3 Public Certificate (`GET /v3/profile/public/certificate`):**
   - Dynamically retrieved and cached (1-hour TTL) to encrypt sensitive payloads (`Aadhaar`, `ABHA Number`, `ABHA Address`, `OTP`) with `RSA/ECB/OAEPWithSHA-1AndMGF1Padding` (`encryptAbhaV3Field`).
   - In `development` mock mode, an ephemeral RSA-2048 keypair is generated in memory to exercise the exact same RSA-OAEP-SHA1 code path without external calls.
3. **Ephemeral User `X-Token` (`X-token: Bearer <userToken>`):**
   - Returned by ABHA V3 OTP verification endpoints (`/v3/enrollment/enrol/byAadhaar`, `/v3/profile/login/verify`, `/v3/phr/web/login/abha/verify`).
   - Stored **exclusively in server-side memory** keyed by authenticated `patientId` with a 15-minute TTL.
   - **Never** persisted to MongoDB, **never** logged, and **never** returned to the frontend browser.

## 2. Environment Separation & Security Controls

| Environment | Behavior |
|---|---|
| `disabled` (default) | All outbound ABDM/ABHA requests rejected with `503 ABDM_DISABLED`. |
| `development` | Deterministic synthetic mock adapter (`isMocked: true`), ephemeral RSA keypair, non-production mock token. |
| `sandbox` | Requires HTTPS `ABDM_BASE_URL` & `ABDM_ABHA_BASE_URL`, non-placeholder `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, `ABDM_X_CM_ID`, and `ABDM_IDENTIFIER_ENCRYPTION_KEY`. |
| `production` | Locked by default (`ABDM_ALLOW_PRODUCTION=false`) until CERT-In WASA audit and NHA Sandbox Exit approval. |

## 3. Credential Isolation

- All credentials live exclusively in backend environment variables (`apps/api/.env`, never Git or `NEXT_PUBLIC_*`).
- `GET /api/v1/abdm/status` and `GET /api/v1/abdm/abha/analytics` return boolean readiness indicators only and are verified by automated tests to leak zero secrets or tokens.
