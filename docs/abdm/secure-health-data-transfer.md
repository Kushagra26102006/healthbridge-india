# ABDM Secure Health Data Transfer & Encryption Adapter

> **Adapter:** `apps/api/src/modules/abdm/adapters/abdm-encryption.adapter.ts`  
> **HTTP Client:** `apps/api/src/modules/abdm/clients/abdm-hie-v3.client.ts`  
> **Live Fidelius Status:** `NOT_CONFIGURED` (`liveFideliusConfigured: false`)

## 1. Official ABDM Fidelius Specification Verified
- **Key Agreement:** Ephemeral ECDH on Curve25519 (**BouncyCastle short-Weierstrass form**) with 32-byte per-session random nonces from both peers (Perfect Forward Secrecy).
- **Nonce Combination & Key Derivation:** `CombinedNonce = senderNonce XOR requesterNonce`; first **20 bytes** = HKDF-SHA-256 salt, last **12 bytes** = AES-256-GCM IV; HKDF info = empty; output length = 32 bytes (`AES-256`).
- **Authenticated Encryption:** `AES/GCM/NoPadding` (`aes-256-gcm`), 16-byte authentication tag appended to ciphertext before Base64 encoding.

## 2. Interoperability & Honest Adapter Separation
Node.js built-in `crypto` provides standard RFC 7748 Montgomery `X25519` rather than BouncyCastle's short-Weierstrass Curve25519 parameters. To avoid broken sandbox crypto or dishonest claims:
1. **`IAbdmEncryptionProvider` Interface:** Allows plugging in an official Java Fidelius CLI/sidecar or verified short-Weierstrass Curve25519 KMS provider via `abdmEncryptionAdapter.registerLiveProvider(...)`.
2. **Development / Test Mode (`MockLocalX25519FideliusProvider`):** Performs genuine local `X25519` + `HKDF-SHA-256` (exact 20B/12B XOR split) + `AES-256-GCM` round-trip encryption while transparently reporting `providerMode: 'MOCK_LOCAL_X25519_NOT_BOUNCYCASTLE_WEIERSTRASS'` and `liveFideliusConfigured: false`.
3. **Sandbox / Production Fail-Closed:** Throws `503 ABDM_ENCRYPTION_NOT_CONFIGURED` until a verified live Fidelius provider is registered.

## 3. Cryptographic & Key Management Controls
- Ephemeral private keys reside **exclusively** in server memory (`Map<sessionId, StoredEphemeralKey>`) with a 15-minute TTL, zeroed buffers on cleanup, and explicit `purgeSessionKey(sessionId)` after single-use encryption or decryption.
- No private key is ever placed in source code, environment variables, MongoDB documents, API responses, logs, or frontend bundles.
- Unencrypted HIU incoming payloads are rejected by default with `422 ABDM_ENCRYPTION_REQUIRED`.
