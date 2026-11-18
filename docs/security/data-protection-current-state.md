# HealthBridge India — Data Protection Current-State Assessment (Day 9 Task 03)

**Assessment Date:** 2026-11-18  
**Scope:** Live repository inspection across MongoDB connection settings, existing crypto utilities, medical document storage, TLS config, environment templates, and cloud/backup dependencies.

---

## 1. Verified Existing Protections vs. Missing Controls

| Control Area | Verified Repository State | Honest Infrastructure / External Status |
|---|---|---|
| **Encryption in Transit** | Zero `rejectUnauthorized: false` or `NODE_TLS_REJECT_UNAUTHORIZED=0` bypasses; production `database.ts` explicitly rejects `tls=false` / `tlsAllowInvalidCertificates=true`; HSTS + HTTP-only `secure` cookies configured in prod (`app.ts`, `next.config.mjs`, `cookie.util.ts`). | Hosting reverse proxy / CDN TLS certificates must be verified at deployment time. |
| **Application-Level Field Encryption** | Existing `abha-crypto.util.ts` uses AES-256-GCM + HMAC-SHA256 blind index for ABHA identifiers; **Day 9 Task 03** adds centralized versioned AES-256-GCM `KeyManagementService` (`apps/api/src/security/data-protection/key-management.service.ts`) with key rotation & AAD binding. | Local `DevelopmentLocalKeyProvider` is active locally; cloud KMS (`AWS_KMS` / `GCP_KMS` / `AZURE_KEY_VAULT`) is an unconfigured boundary pending cloud provisioning. |
| **Encryption at Rest (Database & Object Storage)** | Application-level encrypted envelopes verified locally; Mongoose strips `passwordHash` and `tokenHash`. | MongoDB Atlas WiredTiger AES-256 / KMS CMK encryption at rest and private S3/GCS SSE-KMS bucket encryption **cannot be verified offline** and must be confirmed directly in cloud provider consoles. |
| **Medical Document Storage** | Private storage abstraction (`SecureDocumentStorageService`) with magic-byte validation, AES-256-GCM payload encryption, SHA-256 integrity hash, and HMAC-signed short-lived download tokens; zero public URLs. | Uses `LOCAL_PRIVATE_DEVELOPMENT_STORE` locally; production private S3/GCS bucket with public-access block not yet provisioned. |
| **Malware Scanning** | Full quarantine state machine (`UPLOADED -> QUARANTINED -> SCANNING -> CLEAN | INFECTED | SCAN_FAILED | REJECTED`); unconfigured scanner fails closed to `SCAN_FAILED` (never auto-`CLEAN`). | External ClamAV or cloud AV scanner is **NOT configured** locally. |
| **Backups & Disaster Recovery** | `BackupRecoveryGovernanceService` implements SHA-256 manifest verification, isolated restore test logging, and post-restore referential + key-version reconciliation. | Live MongoDB Atlas Continuous Backups / PITR and cloud storage cross-region replication are **NOT verified offline**. |

---

## 2. Sensitive Data Locations & Key Weaknesses Identified

- **Sensitive Data Locations:** `users` (`passwordHash`, personal contact), `medicalRecords` & `labReports` (clinical PHI & document payloads), `prescriptions` & `dispensingRecords`, `abhaLinks` (encrypted ABHA identifiers), `refreshTokens` / `verificationTokens` (SHA-256 hashes), `privacyRequests` (ephemeral exports), `auditLogs` / `dataAccessEvents`.
- **Key Management Weakness Identified in Pre-Day-9 Code:** `apps/api/src/modules/abdm/utils/abha-crypto.util.ts` derived a single unversioned AES key from `ABDM_IDENTIFIER_ENCRYPTION_KEY` without multi-version rotation metadata. The new `KeyManagementService` & `KeyRotationOrchestrator` establish versioned envelopes (`keyId`, `version`) and safe rotation runbooks for platform-wide adoption.
