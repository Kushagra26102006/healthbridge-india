# HealthBridge India — ABDM Sandbox & Environment Configuration (Phase 17)

## 1. Environment Separation Model

`apps/api/src/modules/abdm/services/abdm-configuration.service.ts` enforces strict isolation across four explicit modes via `ABDM_ENVIRONMENT`:

| Mode | `ABDM_ENABLED` | Behavior |
| --- | --- | --- |
| `disabled` (Default) | `false` | External ABDM gateway calls disabled; admin status reports `NOT_CONFIGURED`. |
| `development` | `true` | Runs synthetic mocked workflows locally for engineering & QA; UI explicitly tags responses with `SYNTHETIC MOCK MODE` (`isMocked: true`). |
| `sandbox` | `true` | Targets official ABDM Sandbox gateways (`dev.abdm.gov.in` & `abhasbx.abdm.gov.in/abha/api/v3`). Fails closed at startup/runtime if credentials are missing or placeholders. |
| `production` | `true` | **Locked by default (`ABDM_ALLOW_PRODUCTION=false`)** — throws `ABDM_PRODUCTION_LOCKED (503)` unless explicitly unlocked after NHA Sandbox Exit & CERT-In WASA audit. |

---

## 2. Environment Variables (Placeholders in `.env.example`)

All ABDM secrets live exclusively in backend environment variables (`apps/api/.env`) and are **never** prefixed with `NEXT_PUBLIC_` or exposed in API responses:

| Variable | Purpose | Example / Placeholder |
| --- | --- | --- |
| `ABDM_ENABLED` | Master integration switch | `false` |
| `ABDM_ENVIRONMENT` | Active mode (`disabled`, `development`, `sandbox`, `production`) | `disabled` |
| `ABDM_BASE_URL` | ABDM V3 HIE-CM / Gateway base URL | `https://dev.abdm.gov.in` |
| `ABDM_ABHA_BASE_URL` | ABHA V3 Sandbox base URL | `https://abhasbx.abdm.gov.in/abha/api/v3` |
| `ABDM_X_CM_ID` | Consent Manager identifier header (`X-CM-ID`) | `sbx` |
| `ABDM_CLIENT_ID` | Official Sandbox Client ID (never commit real value) | `your_abdm_sandbox_client_id` |
| `ABDM_CLIENT_SECRET` | Official Sandbox Client Secret (never commit real value) | `your_abdm_sandbox_client_secret` |
| `ABDM_CALLBACK_URL` | Public HTTPS callback endpoint registered with ABDM bridge | `https://your-api-domain.example/api/v1/abdm/webhooks/callback` |
| `ABDM_WEBHOOK_SECRET` | Shared HMAC/secret for inbound callback verification | `your_abdm_webhook_verification_secret_placeholder` |
| `ABDM_IDENTIFIER_ENCRYPTION_KEY` | 32-byte key for at-rest ABHA identifier encryption | `your_32_byte_hex_or_strong_key_for_abha_storage_encryption` |
| `ABDM_REQUEST_TIMEOUT_MS` | Outbound gateway HTTP timeout (`1000–60000` ms) | `15000` |
| `ABDM_ALLOW_PRODUCTION` | Hard safety gate preventing accidental production activation | `false` |

---

## 3. Token Lifecycle & Security Handling

- `abdm-authentication.service.ts` caches short-lived gateway session bearer tokens strictly in backend process memory, proactively refreshes before expiry, and clears tokens on `401` failures.
- `abdm-http.client.ts` injects required `REQUEST-ID` (UUIDv4), `TIMESTAMP` (ISO-8601 UTC), and `X-CM-ID` headers, enforces configured timeouts, and retries **only** idempotent/safe transport failures (never blindly retrying state-mutating POST creations).
- `abdm-configuration.service.ts` automatically detects and rejects placeholder values (`your_*`, `*placeholder*`, `*example*`, `changeme`) in `sandbox` and `production` modes.

---

## 4. External Dependencies Required for Live Sandbox Testing

1. Organization registration on the official ABDM Sandbox Portal (`sandbox.abdm.gov.in`).
2. Issued Sandbox `ABDM_CLIENT_ID` and `ABDM_CLIENT_SECRET`.
3. Public TLS/HTTPS callback domain whitelisted in the ABDM Sandbox Bridge.
4. Sandbox HFR Facility ID and HPR Practitioner ID registrations (for Milestone M2/M3).
5. Provisioned Fidelius Curve25519 encryption service for live encrypted HIP/HIU FHIR bundle exchange.
