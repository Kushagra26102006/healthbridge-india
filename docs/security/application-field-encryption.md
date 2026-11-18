# HealthBridge India — Application-Level Field Encryption (Day 9 Task 03)

**Implementation:** `apps/api/src/security/data-protection/key-management.service.ts` (`KeyManagementService`)

---

## 1. Candidates & Search Strategy

- **Justified for Application-Level Encryption:** ABHA identifiers (`abha-crypto.util.ts`), sensitive external identity mappings, stored third-party integration credentials, and private clinical document payloads.
- **Indexing / Search Strategy:** Never encrypt operational lookup fields (`patientId`, `status`, `createdAt`) needed for B-tree indexes. Where exact duplicate lookup is needed on an encrypted identifier (such as an ABHA number), store a keyed **HMAC-SHA256 blind index** alongside the AES-256-GCM ciphertext (as implemented in `abha-crypto.util.ts`).
- **Threat-Model Honesty:** Application-level encryption protects data against raw database dump exposure and unauthorized snapshot reads; it does **not** protect against a fully compromised application runtime that holds active KMS decryption permissions.

---

## 2. Versioned Ciphertext Envelope Specification

Every encrypted value produced by `KeyManagementService.encrypt(plaintext, aad?)` uses Node.js native `crypto.createCipheriv('aes-256-gcm', ...)` and returns:

```json
{
  "version": 1,
  "algorithm": "aes-256-gcm",
  "keyId": "hb-dev-kms-v1",
  "iv": "<12-byte random base64 nonce>",
  "ciphertext": "<base64 encrypted bytes>",
  "authTag": "<16-byte GCM authentication tag base64>"
}
```

### Mandatory Cryptographic Rules Enforced
1. Fresh 12-byte CSPRNG IV (`crypto.randomBytes(12)`) on every encryption call — never reused.
2. Optional Additional Authenticated Data (`aad`, e.g. `documentId:ownerId`) binds ciphertext to its owning record to defeat ciphertext swapping across patients.
3. Strict 16-byte GCM `authTag` verification on decryption — **zero plaintext fallback** on corrupted ciphertext, wrong key, wrong AAD, or missing key.
4. Every decryption failure logs a `DECRYPTION_FAILED`, `INVALID_AUTH_TAG`, or `UNKNOWN_KEY_ID` security monitoring incident without logging plaintext or key material.
