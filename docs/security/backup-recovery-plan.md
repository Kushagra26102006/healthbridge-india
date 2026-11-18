# HealthBridge India — Backup & Disaster Recovery Plan (Phase 18)

## 1. Honest Current Environment Status

> **IMPORTANT:** In this local development/sandbox workspace, automated production database and cloud object storage backups are **NOT YET CONFIGURED OR VERIFIED** (`MONGODB_ATLAS_NOT_VERIFIED_OFFLINE`). The application implements governance, manifest checksum verification, isolated restore testing, and post-restore referential/key reconciliation in `apps/api/src/security/data-protection/backup-recovery.service.ts` (`BackupRecoveryGovernanceService`), tested with synthetic datasets (`tests/unit/data-protection.test.ts`).

---

## 2. Target Production Backup & Retention Strategy

| Data Tier | Target Backup Mechanism | Schedule | Retention | Encryption & Access |
| --- | --- | --- | --- | --- |
| **MongoDB Primary Database** (`users`, `medicalRecords`, `auditLogs`, `consents`, etc.) | MongoDB Atlas Continuous Cloud Backup + Point-in-Time Recovery (PITR) | Continuous oplog + daily snapshots (02:00 IST) | 35 days daily, 12 months monthly (audit archives per statutory retention) | AES-256 volume encryption + KMS CMK; restricted IAM backup operator role |
| **Private Medical Document Store** | Cloud Object Storage (S3/GCS Private Bucket) with Object Versioning & Cross-Region Replication | Real-time replication + daily manifest checksum | Active lifecycle + soft-archive retention | SSE-KMS + application-layer AES-256-GCM envelope encryption |
| **KMS Key Metadata & Rotation History** | Managed Cloud KMS (AWS KMS / GCP KMS) — key material never exported to git or database dumps | Managed durable multi-AZ | Non-destructive retirement of historical decryption keys | Hardware-backed HSM boundary; dual-control admin policy |

---

## 3. Target Recovery Objectives (Pre-Production SLA Targets)

- **Recovery Point Objective (RPO):** Target `<= 15 minutes` (with MongoDB Atlas Continuous PITR enabled).
- **Recovery Time Objective (RTO):** Target `<= 2 hours` for full API + database restoration in staging/production.

---

## 4. Non-Destructive Restore Verification Procedure

1. Provision an **isolated restore environment** (never restore over production data).
2. Verify backup manifest integrity via SHA-256 checksum (`backupRecoveryService.verifyBackupChecksum()`).
3. Restore database snapshot and document store snapshot into the isolated environment.
4. Execute `backupRecoveryService.reconcileRestoredDataset()` to detect any orphan patient references, missing decryption key versions, or retired keys — logging any anomaly without silently discarding clinical records.
5. Sign off restore drill results in `/admin/security/data-protection` prior to production go-live.
