# HealthBridge India — Production Backup & Disaster Recovery

## 1. Recovery Objectives (Target SLAs — Requires Managed Cloud Provisioning)

| Tier | Scope | Target RPO | Target RTO | Backup Mechanism |
| --- | --- | --- | --- | --- |
| **Tier 1 (Clinical & Auth DB)** | MongoDB Atlas production cluster (Users, Profiles, Appointments, Encounters, Prescriptions, Lab Reports, Consents, Immutable Audit Logs) | **<= 15 minutes** | **<= 60 minutes** | MongoDB Atlas Continuous Cloud Backup (Point-in-Time Recovery / oplog replay) + daily snapshots retained 35 days + monthly snapshots retained 1 year |
| **Tier 2 (Medical Documents)** | Private encrypted S3 / GCS clinical document bucket (`ap-south-1`) | **<= 1 hour** | **<= 2 hours** | Bucket versioning + Cross-Region Replication (`ap-south-1` → `ap-south-2` Hyderabad) + KMS encryption + Object Lock / lifecycle retention |
| **Tier 3 (App Config & Code)** | Git repository, Docker images, IaC templates | **0 (Git SHA)** | **<= 15 minutes** | Immutable container registry tags + GitHub release metadata |

---

## 2. Backup Security & Access Controls

- **Encryption:** All snapshots and replicated object buckets must use AES-256 / customer-managed KMS keys stored strictly in India regions.
- **Least-Privilege Access:** Separate IAM / Atlas roles for backup administration vs. application runtime; application DB credentials must never hold snapshot-delete privileges.
- **No Unverified Restore Claims:** Live cloud backup and restore drills have **NOT** been executed in this local workspace because cloud Atlas and S3/GCS infrastructure are not yet provisioned.

---

## 3. Isolated Restore Verification Drill Procedure (Mandatory Pre-Launch Gate)

Execute **only** against an isolated staging/restore cluster — never overwrite production:
1. Trigger an on-demand Atlas snapshot of the staging cluster and record document counts for `users`, `medicalrecords`, `consents`, and `auditlogs`.
2. Restore the snapshot (or PITR timestamp) into a fresh isolated temporary Atlas cluster.
3. Point a staging API instance to the restored URI and verify `GET /api/v1/health/ready` returns `200` (`ready: true`).
4. Confirm document counts, SHA-256 document checksums, and immutable audit log continuity match the pre-backup baseline.
5. Record measured restore duration (actual RTO) and sign off in `docs/deployment/final-launch-checklist.md`.
