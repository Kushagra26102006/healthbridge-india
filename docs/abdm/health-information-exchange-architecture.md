# ABDM Health Information Exchange (HIP & HIU) Architecture — HealthBridge India

> **Status:** Both **HIP** and **HIU** workflows are **proposed architectural designs (`PENDING_ONBOARDING`)**. Live health information exchange is explicitly disabled (`AbdmHealthInformationAdapter.assertLiveTransferDisabled`) until sandbox onboarding, encryption verification, and Milestone 2/3 implementation complete.

---

## 1. End-to-End Encryption Design (Fidelius Protocol)
Based on official ABDM HIE-CM & Fidelius specifications:
- The HIE-CM gateway is **data-blind** and never reads clinical payloads.
- **Cryptographic Primitives:**
  - **Key Agreement:** Ephemeral ECDH on Curve25519 in **short Weierstrass form** (BouncyCastle-compatible — *not* raw Montgomery `X25519`, which causes gateway error `ABDM-9999`).
  - **Nonce & Key Derivation:** HIU and HIP each generate 32-byte random nonces (`RAND`). `XOR(hiuNonce, hipNonce)` produces 32 bytes split into `SALT` (first 20 bytes) and `IV` (last 12 bytes). **HKDF-SHA256** derives the 256-bit **AES-256-GCM** session key from the ECDH shared secret and `SALT`.
  - **Payload:** Serialized NRCeS ABDM FHIR R4 Document `Bundle` JSON encrypted with AES-256-GCM.

---

## 2. Proposed HIP Workflow (HealthBridge as Record Source — Milestone 2)
```
Patient Visit / Lab Publication (HealthBridge Doctor/Lab Portal)
  └─► Group Care Contexts & Link to Verified ABHA Address (M2 Linking APIs)
        │
External HIU Requests Patient Records via HIE-CM
  └─► [1] Discovery Callback (`discover` -> `on-discover`): Match patient & Care Contexts
  └─► [2] Consent Notification (`consents/hip/notify`): Verify HIE-CM signature & store artefact
  └─► [3] HI Data Request (`health-information/hip/request`):
           • Evaluate via AbdmConsentAdapter (origin === ABDM_HIE_CM, active, in dateRange, valid HI-type)
           • Map records via AbdmFhirMapperService (Composition at entry[0] Document Bundle)
           • Validate bundle via FhirR4Validator
           • Encrypt bundle with Fidelius ECDH Curve25519 (Weierstrass) + AES-256-GCM
           • Push encrypted bundle to HIU Data Push URL & send status acknowledgement
           • Write immutable AuditLogModel entry
```

## 3. Proposed HIU Workflow (HealthBridge as Record Consumer — Milestone 3)
```
Treating Doctor Requests External Longitudinal History (HealthBridge Doctor Portal)
  └─► [1] Raise Consent Request (`consent-requests/init`) with explicit purpose, HI-types, dateRange, expiry
  └─► [2] Receive Consent Notification (`consents/hiu/notify`) when patient grants in PHR app
  └─► [3] Fetch Signed Consent Artefact (`consents/fetch`)
  └─► [4] Generate Ephemeral Curve25519 (Weierstrass) Keypair + 32-byte Nonce
  └─► [5] Dispatch HI Request (`health-information/cm/request`) with Data Push callback URL
  └─► [6] Receive Encrypted Bundle -> Decrypt via Fidelius -> Validate via FhirR4Validator
  └─► [7] Display read-only external records inside Doctor Portal & purge upon `dataEraseAt` or revocation
```
