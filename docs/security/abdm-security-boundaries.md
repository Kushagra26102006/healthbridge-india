# HealthBridge India — ABDM & External Integration Security Boundaries (Day 9 Task 01)

**Primary Modules:** `apps/api/src/modules/abdm/`, `apps/api/src/modules/consent/`, `apps/api/src/security/consent.adapter.ts`

---

## 1. Environment Separation (Mock vs. Sandbox vs. Production)

| Mode | Configuration Flags | Current Status in This Repo |
|---|---|---|
| **Disabled / Mocked Local** | `ABDM_ENABLED=false`, `ABDM_ENVIRONMENT=disabled`, `ABDM_ALLOW_PRODUCTION=false` | **Active Default** — all ABDM/ABHA tests use isolated synthetic sandbox fixtures and local HL7 FHIR R4 validation. |
| **NHA ABDM Sandbox** | `ABDM_ENABLED=true`, `ABDM_ENVIRONMENT=sandbox`, `ABDM_ALLOW_PRODUCTION=false` | **Not Connected** — requires registered NHA sandbox client credentials and a public HTTPS callback URL. |
| **Production NHA Gateway** | `ABDM_ENABLED=true`, `ABDM_ENVIRONMENT=production`, `ABDM_ALLOW_PRODUCTION=true` | **Explicitly Blocked** — requires NHA M1/M2/M3 certification, WASA/CERT-In security audit, and production credentials. |

> **Honest Disclosure:** HealthBridge India does **not** have live NHA ABDM connectivity or ABDM certification in this environment. Only local mock/synthetic sandbox integration boundaries and FHIR R4 structural mapping have been executed and verified.

---

## 2. Boundary Controls Implemented

1. **Server-Side-Only Credentials:** `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, `ABDM_WEBHOOK_SECRET`, and `ABDM_IDENTIFIER_ENCRYPTION_KEY` exist exclusively in `apps/api` environment configuration (`env.ts`) and are never exposed to `apps/web`.
2. **Callback Authenticity & Replay Protection:** Inbound webhook endpoints (`/api/v1/abdm/webhooks/*`) are rate-limited (`abdmWebhookLimiter`), validate webhook authentication/signature headers, validate payloads strictly with Zod, and guard against duplicate/replayed callback IDs.
3. **Consent Before Health Data Exchange:** HIP/HIU data transfers verify active, non-expired, non-revoked consent artefacts via `ConsentEnforcementService` / `abdmConsentValidationService`, with immediate synchronous revocation blocking (`invalidateConsentImmediately`).
4. **External Provenance & Trust Labeling:** Imported external records retain `source: 'ABDM_INGESTION'` and `resourceReference` provenance metadata and are never silently elevated to locally verified hospital records without provenance.
5. **Safe Failure Logging:** Gateway authentication, timeout, and callback errors are logged structurally via Pino with full credential/ABHA/OTP redaction (`[REDACTED]`).
