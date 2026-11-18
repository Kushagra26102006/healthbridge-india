# ABDM HIP / HIU Security & Privacy Controls

## 1. Enforced Security Controls (Verified in Automated Tests)
1. **Webhook Auth Before Validation (Hardened in Task 04):** All 4 HIE webhook endpoints (`/webhooks/hie/discovery`, `/webhooks/hip/health-information/request`, `/webhooks/hiu/data-push`, `/webhooks/hie/acknowledgement`) verify HMAC-SHA256 / constant-time shared secret **before** Zod schema parsing, preventing unauthenticated schema probing (`401` before `422`), followed by ±5-minute replay-window enforcement (`401 ABDM_REPLAY_DETECTED`).
2. **HIP & HIU Separation:** Separate services (`AbdmHipService` vs `AbdmHiuService`) and role-scoped endpoints ensure neither role shares unrestricted permissions.
3. **Zero Trust in Client Patient/Participant IDs:** HIP derives `patientId` strictly from the verified `AbdmConsentArtefactModel`; patient APIs derive `patientId` strictly from JWT (`req.user.userId`); cross-patient and cross-participant access return `403`.
4. **Centralized Fail-Closed Consent Enforcement:** All HIP and HIU data-exchange operations delegate to `abdmConsentValidationService.validateAbdmConsentAccess(...)` (`allowPatientSelfAccess: false` for external exchange while preserving patient self-access to own internal records).
5. **Encryption & Key Hygiene:** Unencrypted transfers are rejected (`422 ABDM_ENCRYPTION_REQUIRED`); ephemeral private keys exist only in short-TTL server memory and are purged/zeroed immediately after use; live sandbox/production transfers fail closed (`503 ABDM_ENCRYPTION_NOT_CONFIGURED`) until official short-Weierstrass Curve25519 Fidelius is configured.
6. **SSRF Protection:** `AbdmHieV3Client.validateDataPushUrl(...)` enforces HTTPS and blocks loopback, RFC 1918 private networks, and link-local addresses in sandbox/production.
7. **Zero-PII Monitoring & Audit Logs:** Plaintext clinical bundles are never written to application logs, `AuditLogModel`, `AbdmFhirMappingResultModel`, or Admin analytics (`GET /api/v1/abdm/hie/analytics`).

## 2. Residual Risks & Production Prerequisites
- **BouncyCastle Short-Weierstrass Curve25519 Fidelius Provider:** Must be deployed as an official Java Fidelius sidecar or verified KMS provider before sandbox/production M2/M3 testing.
- **Multi-Replica Ephemeral Key Vault:** Current ephemeral HIU decryption keys reside in single-instance server memory; horizontally scaled deployments should store short-TTL encrypted ephemeral keys in Redis with strict ACL/TLS isolation.
- **ABDM Gateway Asymmetric JWKS Verification:** Production webhook signature verification must be switched from shared-secret/HMAC to ABDM Gateway asymmetric JWKS once sandbox bridge onboarding completes.
