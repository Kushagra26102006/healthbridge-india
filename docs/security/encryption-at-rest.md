# HealthBridge India — Encryption at Rest Specification (Day 9 Task 03)

**Scope:** Database volumes, managed object storage, backups, patient data exports, and temporary processing artifacts.

---

## 1. Layered Encryption-at-Rest Matrix

| Storage Layer | Mechanism | Current Verification Status | Production Provider Verification Required |
|---|---|---|---|
| **MongoDB Atlas Database Volumes** | WiredTiger storage engine encryption (AES-256) + Atlas Encryption at Rest using Customer Managed Keys (CMK via AWS KMS / GCP KMS / Azure Key Vault). | **Not Verified Offline** (no live Atlas cluster connected) | Verify Atlas M10+ Encryption at Rest with CMK enabled in Atlas Security settings. |
| **Private Medical Document Storage** | Provider SSE-KMS (private S3/GCS bucket) + Application-level AES-256-GCM envelope encryption (`SecureDocumentStorageService`). | **App-level AES-256-GCM Implemented & Tested Locally**; cloud bucket SSE-KMS not provisioned | Enable mandatory SSE-KMS + Block Public Access on cloud storage bucket. |
| **Database & Storage Backups** | Encrypted Atlas cloud backup snapshots + cross-region encrypted copies. | **Not Verified Offline** | Verify backup encryption and CMK key-access policy before go-live. |
| **Patient Data Exports** | Private ephemeral storage (`PRIVATE_EPHEMERAL`, 15-minute TTL, SHA-256 checksum, secret-scrubbed); zero public bucket placement. | **Implemented & Tested Locally** (`privacy-governance.test.ts`) | Store large async exports in private KMS-encrypted S3/GCS prefix with automated lifecycle purge (`<= 24h`). |
| **Temporary Processing Artifacts** | In-memory Buffer decryption during authenticated download streams; zero unencrypted clinical temp files written to `/tmp`. | **Verified in code** (`document-storage.service.ts`) | Ensure container ephemeral disks are encrypted and memory swap is disabled in production. |

---

## 2. Avoiding Unnecessary Redundancy

Provider-managed storage encryption protects against physical media theft and snapshot exposure; application-level encryption is reserved strictly for high-sensitivity identifiers, external credentials, and private clinical document payloads requiring record-bound AAD and independent key-version governance.
