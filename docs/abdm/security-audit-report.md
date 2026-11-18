# ABDM Integration Security Audit Report (Day 7 Task 05)

> **Audit Date:** 2026-11-18  
> **Scope:** Full ABDM module (`apps/api/src/modules/abdm/*`), shared types/validation, and frontend pages (`apps/web/src/app/(dashboard)/*/abdm*`, `patient/abha*`, `patient/consent*`, `admin/integrations/abdm`).  
> **Disclaimer:** This is an engineering source-code & automated test security audit — it is **NOT** a formal independent third-party penetration test or CERT-In security audit.

## 1. Findings & Remediation Summary

| ID | Severity | Area | Finding | Remediation Status |
|---|---|---|---|---|
| **SEC-01** | **HIGH** | Callback Auth | Inbound webhook endpoints (`/webhooks/callback`, `/webhooks/consent/:callbackType`, and the 4 HIE webhook routes) previously ran Zod schema validation before verifying HMAC/shared-secret authentication, allowing unauthenticated schema probing (`422` vs `401`). | **FIXED & VERIFIED** (`abdm.controller.ts`, `abdm-consent.controller.ts`, `abdm-hie.controller.ts`; verified in `abdm-day7-e2e-audit.test.ts` — all 6 routes return `401` on empty unauthenticated requests). |
| **SEC-02** | **HIGH** | External Transfer Timeout | Direct `dataPushUrl` HTTP POST in `abdm-hie-v3.client.ts` lacked an `AbortController` timeout, creating socket-exhaustion DoS exposure if a peer HIU hung. | **FIXED & VERIFIED** (`abdm-hie-v3.client.ts` now enforces `config.requestTimeoutMs` via `AbortController` and maps timeouts to `504 ABDM_TIMEOUT`). |
| **SEC-03** | **HIGH** | Resource / Payload DoS | FHIR Bundle validation and HIU decryption lacked explicit maximum entry count and decoded byte size bounds. | **FIXED & VERIFIED** (`fhir-r4.validator.ts` enforces `<= 150` entries per `DocumentBundle` [`BUNDLE_ENTRY_LIMIT_EXCEEDED`]; `abdm-hiu.service.ts` rejects decrypted bundles `> 2 MB`). |
| **SEC-04** | **MEDIUM** | Webhook Burst Protection | Inbound ABDM webhook routes lacked dedicated IP rate limiting. | **FIXED & VERIFIED** (`abdmWebhookLimiter`: `120 req/min/IP` mounted across all 6 ABDM webhook endpoints in `abdm.routes.ts`). |
| **SEC-05** | **MEDIUM** | Sensitive Log Redaction | `redaction.ts` did not explicitly list Day 7 Task 03/04 cryptographic & encrypted storage keys (`encryptedFhirBundle`, `encryptedPayload`, `encryptedSensitivePayload`, `dhPrivateKey`, `sharedSecret`, `symmetricKey`, `rawBundle`). | **FIXED & VERIFIED** (`redaction.ts` updated and verified in `abdm-day7-e2e-audit.test.ts`). |
| **SEC-06** | **MEDIUM** | Live Cryptographic Provider | Official ABDM Fidelius requires BouncyCastle short-Weierstrass Curve25519 rather than Node.js native Montgomery `X25519`. | **MITIGATED (FAIL-CLOSED)** — Sandbox/Production encryption fails closed (`503 ABDM_ENCRYPTION_NOT_CONFIGURED`) until official Fidelius sidecar/KMS is attached. |
| **SEC-07** | **LOW** | Single-Instance Ephemeral Stores | Ephemeral `X-Token` sessions, consent decision cache (60s TTL), and HIU ephemeral decryption keys reside in single-instance server memory. | **DOCUMENTED** — Production horizontal scaling requires TLS/ACL-isolated Redis backing. |
| **SEC-08** | **LOW** | Gateway Asymmetric JWKS | Webhook auth currently uses HMAC-SHA256 / shared secret rather than live ABDM Gateway JWKS asymmetric JWT verification. | **DOCUMENTED** — Pending live sandbox bridge onboarding and official Gateway JWKS endpoint verification. |

## 2. Verified Zero-Leakage & Authorization Controls
- **No Secrets in Source/Frontend/Logs:** `ABDM_CLIENT_SECRET`, `ABDM_WEBHOOK_SECRET`, Bearer tokens, `X-Token`, OTPs, Aadhaar numbers, full ABHA numbers, private keys, and plaintext clinical payloads are strictly scrubbed/excluded from logs, API responses, notifications, and Admin analytics.
- **Object-Level Authorization:** Patient routes derive `patientId` from JWT (`req.user.userId`); cross-patient access returns `403`; HIP derives `patientId` exclusively from verified Consent Artefacts; Doctors have strictly read-only access to consent-verified imported records and `403` on quarantine reviews or Admin analytics.
- **Zero Critical Open Defects:** `0` CRITICAL and `0` unaddressed HIGH defects remain in the ABDM codebase.
