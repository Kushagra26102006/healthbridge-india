# ABDM Encryption & Key Management Audit (Day 7 Task 05)

> **Audit Date:** 2026-11-18  
> **Live Fidelius Infrastructure Status:** `NOT_CONFIGURED` (`liveFideliusConfigured: false`)

## 1. Audited Components
1. **ABHA V3 Transit Encryption (`abha-crypto.util.ts`):** Uses dynamic ABHA V3 RSA public certificate with `RSA/ECB/OAEPWithSHA-1AndMGF1Padding` (`crypto.constants.RSA_PKCS1_OAEP_PADDING`, `oaepHash: 'sha1'`) for Aadhaar/OTP fields. Plaintext Aadhaar/OTP values are never stored or logged.
2. **At-Rest Storage Encryption (`abha-crypto.util.ts`):** Uses `AES-256-GCM` with 12-byte random IV and 16-byte authentication tag (`select: false` in Mongoose schemas) for ABHA identifiers, sensitive external consent payloads, and imported FHIR bundles, paired with HMAC-SHA256 blind indexes where lookup is required.
3. **Health Information Exchange Encryption (`abdm-encryption.adapter.ts`):**
   - Verified official ABDM Fidelius spec: Ephemeral ECDH Curve25519 (**BouncyCastle short-Weierstrass form**) + dual-nonce XOR (`20B` HKDF-SHA-256 salt + `12B` AES-GCM IV) + `AES/GCM/NoPadding` (16-byte tag appended, Base64).
   - **Honest Non-Substitution Control:** Because Node.js native `crypto` provides Montgomery `X25519` rather than BouncyCastle short-Weierstrass Curve25519, HealthBridge does **NOT** substitute `X25519` for live sandbox/production traffic. Instead:
     - `MockLocalX25519FideliusProvider` runs in `development`/test mode only (`isMocked: true`, `providerMode: 'MOCK_LOCAL_X25519_NOT_BOUNCYCASTLE_WEIERSTRASS'`).
     - `sandbox` and `production` environments fail closed (`503 ABDM_ENCRYPTION_NOT_CONFIGURED`) until a verified live Fidelius provider is registered via `abdmEncryptionAdapter.registerLiveProvider(...)`.

## 2. Key Hygiene Audit Checklist
- [x] Zero private keys in source code, `.env.example`, or frontend bundles.
- [x] Ephemeral private keys held strictly in server memory (15m TTL) with explicit `purgeSessionKey(sessionId)` and `Buffer.fill(0)` zeroing of shared secrets, derived symmetric keys, and nonces.
- [x] Unencrypted incoming HIU transfers rejected (`422 ABDM_ENCRYPTION_REQUIRED`).
- [x] Production transfer locked (`ABDM_ALLOW_PRODUCTION=false`, `liveExchangeEnabled: false`).
- [ ] **Missing Production Infrastructure:** Official Java Fidelius CLI/sidecar or HSM/KMS supporting BouncyCastle short-Weierstrass Curve25519 + Redis-backed ephemeral key vault for multi-replica deployments.
