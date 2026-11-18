# HealthBridge India — Data Integrity & Post-Restore Reconciliation (Day 9 Task 03)

**Implementation:** `apps/api/src/security/data-protection/backup-recovery.service.ts` (`reconcileRestoredDataset`)

---

## 1. Verified Cross-Module Reconciliation Checks

After any database restore, storage recovery, or key migration, `reconcileRestoredDataset(...)` verifies:
1. **Patient Referential Integrity:** Every restored `Encounter`, `Prescription`, `LabReport`, `Consent`, and `Document` resolves to an existing canonical `patientId`. Orphan references emit `ORPHAN_PATIENT_REF`.
2. **Encryption Key Version Availability:** Every encrypted document's `keyId` exists in the KMS provider and is NOT in `RETIRED` status (`MISSING_ENCRYPTION_KEY` / `RETIRED_ENCRYPTION_KEY`).
3. **Document Cryptographic Integrity:** On document retrieval, `SecureDocumentStorageService` verifies both the AES-256-GCM authentication tag (with record-bound AAD) AND the stored SHA-256 digest (`INTEGRITY_MISMATCH` incident raised on mismatch).

---

## 2. Zero Silent Data Loss Policy

Reconciliation **never silently discards or deletes** records that fail validation. Every anomaly is persisted in `ReconciliationReport.failures` (with `entityType`, `entityId`, `issueCode`, `detail`) and triggers a `RESTORE_FAILURE` security monitoring event (`CRITICAL`) for controlled engineering & clinical investigation.
