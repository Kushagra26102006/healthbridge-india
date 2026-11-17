# ABHA Sandbox Testing & Onboarding Guide

## 1. Strict Test-Data Policy

- **NEVER** use real citizen Aadhaar numbers, real ABHA numbers, or real patient mobile numbers during development, automated testing, or sandbox integration testing.
- Use **synthetic test identities only** (`91-0000-...`, `@sbx` handles, and NHA-provided sandbox test Aadhaar numbers).

## 2. Test Execution Modes

| Mode | Configuration | Behavior | Claims Live Sandbox Verification? |
|---|---|---|---|
| **Disabled (Default)** | `ABDM_ENABLED=false`, `ABDM_ENVIRONMENT=disabled` | All ABHA API routes return `503 ABDM_DISABLED`. | No |
| **Development / Synthetic Mock** | `ABDM_ENABLED=true`, `ABDM_ENVIRONMENT=development` | Exercises full RSA-OAEP-SHA1 encryption, AES-256-GCM storage, OTP state machine, RBAC, audit logs, and notifications using synthetic mock data (`isMocked: true`). Deterministic mock OTP: `123456` (valid), `000000` (invalid OTP), `999999` (expired session). | **No** (Mocked Only) |
| **ABDM Sandbox** | `ABDM_ENABLED=true`, `ABDM_ENVIRONMENT=sandbox` + real sandbox credentials + HTTPS URLs | Executes real HTTPS requests to `https://dev.abdm.gov.in/api/hiecm/gateway/v3/sessions` and `https://abhasbx.abdm.gov.in/abha/api/v3/*`. | Only after real sandbox requests succeed |

## 3. Prerequisites Required From User Before Live Sandbox Testing

1. Register organization & product on `https://sandbox.abdm.gov.in/`.
2. Acquire Sandbox `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, and official V3 Postman/OpenAPI specifications from `https://developer.abdm.gov.in/`.
3. Provision synthetic sandbox test Aadhaar / ABHA numbers via NHA Sandbox documentation.
4. Set backend runtime environment variables (never Git or frontend):
   - `ABDM_ENABLED=true`
   - `ABDM_ENVIRONMENT=sandbox`
   - `ABDM_BASE_URL=https://dev.abdm.gov.in`
   - `ABDM_ABHA_BASE_URL=https://abhasbx.abdm.gov.in/abha/api/v3`
   - `ABDM_X_CM_ID=sbx`
   - `ABDM_CLIENT_ID=<sandbox_client_id>`
   - `ABDM_CLIENT_SECRET=<sandbox_client_secret>`
   - `ABDM_IDENTIFIER_ENCRYPTION_KEY=<64_hex_char_aes256_key>`
   - Keep `ABDM_ALLOW_PRODUCTION=false`.

## 4. Automated Test Classification

- **Unit & Mocked Tests:** `apps/api/tests/unit/abha-identity.test.ts`
- **Express API Integration Tests (Mocked DB/Env):** `apps/api/tests/integration/abha-integration.test.ts`
- **Actual ABDM Sandbox Tests:** `0 executed` (pending sandbox credentials).
