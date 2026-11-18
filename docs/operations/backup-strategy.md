# HealthBridge India — Backup Architecture & Strategy (Day 9 Task 03)

**Governance Service:** `apps/api/src/security/data-protection/backup-recovery.service.ts`

> **Honest Status Notice:** Automated cloud backups are **NOT verified active** in this offline development environment (`atlasAutomatedBackupStatus: 'NOT_VERIFIED_IN_OFFLINE_ENVIRONMENT'`). This document defines the target production backup architecture and provider verification checklist; backup schedules must never run as unreliable in-memory timers inside serverless/API processes.

---

## 1. Backup Asset Scope & Target Architecture

| Asset | Recommended Production Provider Mechanism | Proposed Cadence (Pending Provisioning) | Encryption & Access | Verification Method |
|---|---|---|---|---|
| **MongoDB Atlas Database** | Atlas Continuous Cloud Backup + Point-in-Time Recovery (PITR) on M10+ replica set in India region (`ap-south-1` / `asia-south1`) | Continuous oplog + daily snapshots + cross-region copy | Encrypted with Atlas CMK; restricted to Atlas Backup Operator IAM role | Monthly automated isolated staging restore + `reconcileRestoredDataset()` |
| **Private Medical Document Bucket** | S3/GCS Object Versioning + Cross-Region Replication (India secondary region) | Continuous replication | Mandatory SSE-KMS + Block Public Access + Object Lock where required | Checksum manifest verification (`verifyBackupChecksum`) |
| **Encryption Keys & Recovery Metadata** | Managed Cloud KMS multi-region keys with >= 30-day deletion waiting period | Synchronized across regions | Strict IAM separation (Ops cannot export raw KMS key material) | Quarterly restore-decryption drill using historical key versions |
| **Audit Logs & Access Ledger** | Exported to immutable WORM storage / SIEM archive | Continuous streaming + daily sealed manifest | Encrypted + Write-Once-Read-Many retention lock | SHA-256 manifest verification |
| **Application & Integration Config** | Infrastructure-as-Code (Terraform/Helm) in Git + encrypted Secrets Manager backups | Every release + daily secret vault backup | Zero plaintext secrets in Git; KMS-encrypted vault snapshots | IaC dry-run (`terraform plan`) in staging |

---

## 2. Non-Negotiable Operational Rules

1. Never expose public backup download or restore HTTP endpoints.
2. Never delete historical encryption keys while retained backups still reference those `keyId` versions.
3. All administrative restore operations require dual-authorized operational runbook execution and emit immutable audit events.
