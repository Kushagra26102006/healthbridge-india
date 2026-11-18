# HealthBridge India — Encryption Key Rotation Runbook (Day 9 Task 03)

**Orchestrator:** `apps/api/src/security/data-protection/key-rotation.service.ts` (`KeyRotationOrchestrator`)  
**Admin Trigger:** `POST /api/v1/admin/data-protection/rotate-key` (`ADMIN` only)

---

## 1. Safe Zero-Downtime Key Rotation Procedure

1. **Create New Active Version:** Call `keyManagementService.rotateKey(adminId)` (or KMS CreateKeyVersion). The previous active key transitions to `HISTORICAL_DECRYPT_ONLY`; all new encryptions immediately use the new active `keyId`.
2. **Historical Decryption Continuity:** Existing records retain their original `envelope.keyId` and decrypt transparently using `HISTORICAL_DECRYPT_ONLY` keys.
3. **Chunked Idempotent Batch Re-Encryption:** Run `keyRotationOrchestrator.reEncryptBatch(records, persistFn, { maxBatchSize })`:
   - Records already encrypted under the active `keyId` are counted in `skippedAlreadyCurrentCount` (fully idempotent).
   - Interrupted batches (`interrupted: true`) can be safely resumed without double-encrypting or corrupting records.
   - Records failing decryption or persistence are captured in `failedRecords` (never silently dropped) for investigation.
4. **Zero-Reference Verification Before Retirement:** Query every encrypted collection AND confirm backup retention expiry no longer requires the old key.
5. **Explicit Key Retirement:** Call `keyManagementService.retireKeySafely(oldKeyId, verifiedZeroReferences=true, adminId)`. Passing `verifiedZeroReferences=false` or attempting to retire the active key is rejected with `400 BAD_REQUEST`.

---

## 2. Verified Automated Test Coverage

Verified in `apps/api/tests/unit/data-protection.test.ts`:
- Current key encryption & unique IVs
- Historical key decryption after rotation
- Interrupted batch migration & idempotent resume
- Rejection of premature key retirement (`verifiedZeroReferences=false` or active key)
- Clean retirement once zero references are confirmed
