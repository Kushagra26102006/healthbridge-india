# ABDM Deployment Readiness & Production Gating Checklist (Day 7 Audit)

> **Audit Date:** 2026-11-18  
> **Production ABDM Status:** `PRODUCTION_NOT_ENABLED` (`ABDM_ENABLED=false`, `ABDM_ALLOW_PRODUCTION=false`, `liveExchangeEnabled=false`)  
> **Deployment Action Taken:** None (no production infrastructure modified).

## 1. Audited Infrastructure & Configuration Controls

| Area | Audited State | Status |
|---|---|---|
| **Environment Defaults** (`.env.example`) | `ABDM_ENABLED=false`, `ABDM_ENVIRONMENT=disabled`, `ABDM_ALLOW_PRODUCTION=false`; placeholders only (zero real secrets committed). | **PASS** |
| **Production Lock Guard** | `AbdmConfigurationService`, `AbdmEncryptionAdapter`, `AbdmHieV3Client`, `AbdmHipService`, `AbdmHiuService`, `AbdmConsentV3Client`, `AbhaV3Client` all fail closed when `ABDM_ALLOW_PRODUCTION !== 'true'`. | **PASS** |
| **HTTPS & SSRF Enforcement** | Sandbox & production enforce HTTPS on ABDM base URLs and HIU `dataPushUrl`, blocking private/loopback/link-local hosts. | **PASS** |
| **API Timeouts & Body Limits** | `ABDM_REQUEST_TIMEOUT_MS` bounded `1000–60000ms` (default `15000ms`), `express.json({ limit: '10mb' })`, FHIR Bundle `<= 2 MB` and `<= 150` entries. | **PASS** |
| **CORS & Security Headers** | Helmet enabled, explicit `CORS_ORIGIN` allowlist with credentials, `X-Request-Id` correlation middleware, Pino structured JSON logging with ABDM secret/PII redaction. | **PASS** |
| **Health & Monitoring Endpoints** | `/api/v1/health` active; Admin `/api/v1/abdm/status` & `/admin/integrations/abdm` report honest statuses (`NOT_CONFIGURED | MOCKED | PENDING_ONBOARDING | PRODUCTION_NOT_ENABLED`) with zero PII/secrets. | **PASS** |
| **Build & Type Integrity** | `pnpm lint`, `pnpm typecheck`, `pnpm test` (`686/686`), and `pnpm build` (`apps/api` + `apps/web`) all pass cleanly. | **PASS** |

## 2. Mandatory Prerequisites Before Enabling Live Sandbox or Production
1. Complete official NHA ABDM Sandbox onboarding (M1, M2, M3) and receive formal NHA production sign-off & certification.
2. Store real `ABDM_CLIENT_ID`, `ABDM_CLIENT_SECRET`, `ABDM_WEBHOOK_SECRET`, and `ABDM_IDENTIFIER_ENCRYPTION_KEY` exclusively in a managed secrets vault (AWS Secrets Manager / GCP Secret Manager / HashiCorp Vault) with key rotation policies.
3. Deploy an official BouncyCastle short-Weierstrass Curve25519 Fidelius sidecar/KMS and verify interoperability against ABDM Sandbox vectors.
4. Migrate ephemeral `X-Token` sessions, consent decision cache invalidation, and HIU ephemeral decryption keys to TLS/ACL-isolated Redis for multi-replica deployments.
5. Upgrade webhook authentication from HMAC/shared-secret to official ABDM Gateway JWKS asymmetric verification.
6. Run external HAPI FHIR CLI Validator against official NRCeS `ndhm.in` `package.tgz` and resolve any IG-level profile findings.
7. Execute an independent CERT-In / healthcare application security audit before enabling `ABDM_ALLOW_PRODUCTION=true`.
