# HealthBridge India — Disaster Recovery Plan (Day 9 Task 03)

**Classification:** Architecture & Runbook Defined — Pending Live Cloud Provider Verification  
**Important:** RTO and RPO figures below are **proposed engineering targets** tied explicitly to required cloud infrastructure; they are **not** certified live SLAs until staging DR drills pass against real MongoDB Atlas & cloud storage clusters.

---

## 1. Proposed Recovery Objectives & Required Infrastructure

| Objective | Proposed Target | Infrastructure Required to Achieve Target |
|---|---|---|
| **RTO (Recovery Time Objective)** | **<= 4 hours** (Tier-1 Clinical API & Portal) | Multi-AZ MongoDB Atlas M10+, Infrastructure-as-Code automated redeployment, multi-region container registry, documented on-call runbooks. |
| **RPO (Recovery Point Objective)** | **<= 15 minutes** (Zero committed transaction loss target for PITR) | MongoDB Atlas Continuous Cloud Backups (PITR oplog) + cross-region object storage replication for private medical documents. |

---

## 2. Failure Scenario Recovery Matrix

| Failure Scenario | Severity | Primary Owner | Recovery Sequence | Rollback / Validation |
|---|---|---|---|---|
| **MongoDB Atlas Primary Outage** | SEV-1 (Critical) | Platform SRE / DB Admin | Verify automatic replica-set election; if regional outage, restore latest PITR snapshot in secondary India region and update `MONGODB_URI` via Secrets Manager. | Run `reconcileRestoredDataset` + `/api/v1/health`. |
| **Document Storage Outage** | SEV-1 (Critical) | Cloud Infrastructure Lead | Fail over read/write adapter to replicated secondary-region private bucket; maintain private-only policy and KMS decryption access. | Verify SHA-256 download integrity on canary document. |
| **Encryption Key Loss** | SEV-1 (Critical) | Security Architect | Halt key deletion via KMS waiting period; restore multi-region KMS replica; if permanently lost, quarantine affected records via reconciliation report (never return corrupted bytes). | Confirm historical key decryption passes. |
| **Encryption Key Compromise** | SEV-1 (Critical) | Security Incident Commander | Immediately rotate active key (`rotateKey()`), trigger priority `KeyRotationOrchestrator` batch re-encryption, audit all decryption logs, revoke compromised IAM access. | Confirm zero active records reference compromised `keyId`. |
| **Application Deployment Failure** | SEV-2 (High) | Release Engineer | Immediately roll back to last known-good immutable container digest; keep DB schema backward-compatible. | Smoke-test auth, records, notifications, and health endpoints. |
| **Data Corruption / Accidental Deletion** | SEV-1 (Critical) | DB Admin + Privacy Officer | Freeze affected writes/workers, execute PITR restore into isolated cluster, extract verified records, reconcile references without overwriting valid newer audit logs. | Reconcile referential integrity + immutable audit trail. |
| **ABDM Integration Outage** | SEV-3 (Medium) | Integrations Engineer | Circuit-break external ABDM gateway calls (`ABDM_ENABLED=false` graceful degradation); preserve local clinical operations; queue retryable callbacks safely. | Verify local Patient/Doctor/Pharmacy/Lab workflows unaffected. |
| **Event Outbox Worker Failure** | SEV-2 (High) | Backend SRE | Restart worker pods; lease-expiry recovers stuck events; inspect & replay dead-letter items via `/admin/platform/events` (`ADMIN` only). | Confirm outbox lag returns to zero with zero duplicate side effects. |

---

## 3. Incident Communication & Post-Incident Review

- **Communication Plan:** Internal incident channel within 15 minutes (SEV-1); status notice for affected healthcare facilities within 1 hour; statutory breach intimation to CERT-In / Data Protection Board of India strictly per legal counsel & applicable notified timelines if PHI confidentiality is compromised.
- **Post-Incident Review:** Blameless RCA within 5 business days documenting timeline, root cause, reconciliation findings, and preventive action items.
