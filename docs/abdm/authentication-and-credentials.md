# ABDM Authentication & Credential Security — HealthBridge India

## 1. Verified Official ABDM V3 Authentication Contract
From official NHA / ABDM V3 developer documentation (`developer.abdm.gov.in`):
- **Sandbox Gateway Host:** `https://dev.abdm.gov.in`
- **V3 Session Endpoint:** `POST /api/hiecm/gateway/v3/sessions`
- **Mandatory Headers:**
  - `REQUEST-ID`: Unique RFC 4122 UUID per request
  - `TIMESTAMP`: ISO-8601 UTC timestamp
  - `X-CM-ID`: `sbx` (sandbox Consent Manager ID)
- **Payload:** `{ clientId, clientSecret, grantType: "client_credentials" }`
- **Response:** Returns Bearer JWT `accessToken` used for subsequent V3 gateway calls.
- **Separate ABHA V3 Host (Milestone 1):** `https://abhasbx.abdm.gov.in/abha/api/v3`

> **Unverified Item:** Production `X-CM-ID`, token TTL duration, and exact refresh vs re-issue rate limits must be confirmed inside the authenticated ABDM Sandbox portal upon onboarding.

## 2. Credential Isolation & Security Controls Implemented
1. **Backend-Only Secrets:** `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, and `ABDM_WEBHOOK_SECRET` exist exclusively in `apps/api` runtime environment variables (never prefixed `NEXT_PUBLIC_`, never returned by `/api/v1/abdm/status`).
2. **Placeholder Rejection:** `AbdmConfigurationService` detects and rejects empty or placeholder values (`your_*`, `*placeholder*`, `changeme`) whenever `ABDM_ENABLED=true` in `sandbox` or `production`.
3. **Token Lifecycle (`AbdmAuthenticationService`):**
   - Caches access tokens strictly in server memory (never in cookies, localStorage, or MongoDB).
   - Refreshes proactively 60 seconds prior to expiry (`refreshSafetyMarginMs`).
   - Clears cached tokens immediately upon HTTP `401` responses or credential rotation (`clearToken()`).
4. **Zero Secret Logging:** Both Pino's global redaction paths (`apps/api/src/config/logger.ts`) and `redactAbdmLogPayload()` (`apps/api/src/modules/abdm/utils/redaction.ts`) strip `clientSecret`, `accessToken`, `Authorization: Bearer ...`, and `x-webhook-secret` before writing logs.
5. **Credential Rotation Strategy:** Rotate sandbox/production secrets via hosting secret manager + rolling restart; `AbdmAuthenticationService` starts with an empty token cache on boot, eliminating stale credential persistence.
6. **Honest Foundation Boundary:** Live outbound session creation returns `501 ABDM_NOT_IMPLEMENTED_LIVE` in Task 01 unless a unit-test mock fetcher or `development` mode is active. No fake authentication success is claimed.
