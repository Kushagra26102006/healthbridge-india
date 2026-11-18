# HealthBridge India — Database Restore Runbook (Day 9 Task 03)

**Rule:** Never restore over production during routine testing. All validation drills execute exclusively against an isolated staging or local test database.

---

## 1. Ten-Step Controlled Restore Procedure

1. **Prepare Isolated Target Environment:** Provision an isolated staging MongoDB cluster (`healthbridge_restore_verify`) with zero production traffic and separate credentials.
2. **Identify Verified Backup Snapshot:** Select target MongoDB Atlas snapshot / PITR timestamp and record `backupId`, `createdAt`, and referenced `keyVersionRefs`.
3. **Verify Backup Integrity:** Validate snapshot completion metadata and SHA-256 manifest checksum (`backupRecoveryService.verifyBackupChecksum(backupId, manifest)`).
4. **Execute Restore:** Trigger MongoDB Atlas Cloud Restore (or `mongorestore` for isolated local snapshot) into the isolated target cluster.
5. **Rebuild / Synchronize Indexes:** Run `syncDatabaseIndexes()` (`apps/api/src/config/database.ts`) to ensure unique constraints (`idempotencyKey`, `email`, `phone`, `tokenHash`, `userId+noticeVersion`) and compound indexes are active.
6. **Verify Schema Compatibility:** Confirm application startup passes `env.ts` validation and Mongoose models register cleanly without schema errors.
7. **Run Data Integrity & Key Reconciliation:** Execute `backupRecoveryService.reconcileRestoredDataset(...)` checking patient references across encounters, prescriptions, lab reports, consents, and document `keyId` availability (verifying historical KMS keys decrypt sample synthetic records).
8. **Verify Application Connectivity & Health:** Point isolated staging API to restored DB and confirm `GET /api/v1/health` reports `connected`.
9. **Verify Authorization & Privacy Boundaries:** Run non-destructive read verification ensuring cross-patient isolation (`403`), revoked consents stay blocked, and active legal holds remain intact.
10. **Record Post-Restore Audit:** Persist `RestoreTestRecord` (`PASSED` or `FAILED` with issue count) via `backupRecoveryService.recordRestoreTestRun(...)` and attach evidence to the operations log.

---

## 2. Automated Local Test Verification

Isolated synthetic restore, checksum verification, orphan-reference detection, and missing-key recovery failure scenarios are automated and verified in `apps/api/tests/unit/data-protection.test.ts`. Live Atlas cluster restoration remains pending Atlas staging provisioning.
