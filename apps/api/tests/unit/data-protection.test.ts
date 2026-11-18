/**
 * HealthBridge India — Encryption, Key Rotation, Document Storage & Backup Recovery Unit Tests (Day 9 Task 03)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DevelopmentLocalKeyProvider,
  KeyManagementService,
  KeyRotationOrchestrator,
  SecureDocumentStorageService,
  BackupRecoveryGovernanceService,
  UnconfiguredCloudKmsAdapter,
} from '../../src/security/data-protection';
import { FileSecurityService } from '../../src/security/file-security.service';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';

describe('Data Encryption, Key Management, Document Storage & Recovery — Unit Tests (Day 9 Task 03)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  describe('1. Authenticated AES-256-GCM Encryption & Failure Modes', () => {
    it('encrypts with unique IVs, versioned envelope, and decrypts cleanly with matching AAD', () => {
      const kms = new KeyManagementService(new DevelopmentLocalKeyProvider());
      const env1 = kms.encrypt('12-3456-7890-1234', 'patient:p1');
      const env2 = kms.encrypt('12-3456-7890-1234', 'patient:p1');

      expect(env1.version).toBe(1);
      expect(env1.algorithm).toBe('aes-256-gcm');
      expect(env1.keyId).toBe('hb-dev-kms-v1');
      expect(env1.iv).not.toBe(env2.iv); // Unique IV every call
      expect(env1.ciphertext).not.toBe(env2.ciphertext);

      expect(kms.decrypt(env1, 'patient:p1')).toBe('12-3456-7890-1234');
    });

    it('rejects wrong key/AAD, corrupted ciphertext, invalid authTag, and missing key with ZERO plaintext fallback', () => {
      const kms = new KeyManagementService(new DevelopmentLocalKeyProvider());
      const env = kms.encrypt('Sensitive ABHA Mapping', 'patient:p1');

      // Wrong AAD
      expect(() => kms.decrypt(env, 'patient:p2')).toThrow(/decryption failed/i);

      // Corrupted authTag
      const badTag = {
        ...env,
        authTag: Buffer.from('0000000000000000').toString('base64'),
      };
      expect(() => kms.decrypt(badTag, 'patient:p1')).toThrow(/decryption failed/i);

      // Corrupted ciphertext
      const flippedBytes = Buffer.from(env.ciphertext, 'base64');
      flippedBytes[0] = flippedBytes[0] ^ 0xff;
      const badCipher = { ...env, ciphertext: flippedBytes.toString('base64') };
      expect(() => kms.decrypt(badCipher, 'patient:p1')).toThrow(/decryption failed/i);

      // Missing key ID
      const missingKeyEnv = { ...env, keyId: 'non-existent-key-v99' };
      expect(() => kms.decrypt(missingKeyEnv, 'patient:p1')).toThrow(/not found/i);

      // Unconfigured cloud KMS fails closed
      const cloudKms = new KeyManagementService(new UnconfiguredCloudKmsAdapter('AWS_KMS'));
      expect(() => cloudKms.encrypt('test')).toThrow(/not configured/i);
    });
  });

  describe('2. Key Rotation, Historical Decryption, Idempotent Batch Migration & Safe Retirement', () => {
    it('supports historical key decryption, resumable interrupted batch re-encryption, idempotency, and safe retirement guards', async () => {
      const kms = new KeyManagementService(new DevelopmentLocalKeyProvider());
      const orchestrator = new KeyRotationOrchestrator(kms);

      // Encrypt 3 records under v1
      const store = new Map([
        ['r1', { id: 'r1', envelope: kms.encrypt('Record 1'), aad: undefined }],
        ['r2', { id: 'r2', envelope: kms.encrypt('Record 2'), aad: undefined }],
        ['r3', { id: 'r3', envelope: kms.encrypt('Record 3'), aad: undefined }],
      ]);

      // Rotate to v2
      const v2 = kms.rotateKey('admin-1');
      expect(v2.keyId).toBe('hb-dev-kms-v2');
      expect(kms.getActiveKeyVersion().keyId).toBe('hb-dev-kms-v2');

      // Historical v1 records still decrypt seamlessly
      expect(kms.decrypt(store.get('r1')!.envelope)).toBe('Record 1');

      // Cannot retire v1 without explicit zero-reference verification
      expect(() => kms.retireKeySafely('hb-dev-kms-v1', false)).toThrow(/zero active records/i);
      // Cannot retire currently active v2
      expect(() => kms.retireKeySafely('hb-dev-kms-v2', true)).toThrow(/currently active/i);

      // Simulate interrupted migration (maxBatchSize: 2)
      const pass1 = await orchestrator.reEncryptBatch(
        Array.from(store.values()),
        async (id, nextEnv) => {
          store.get(id)!.envelope = nextEnv;
        },
        { maxBatchSize: 2 }
      );
      expect(pass1.interrupted).toBe(true);
      expect(pass1.reEncryptedCount).toBe(2);

      // Resume migration (idempotent: first 2 already on v2 are skipped, 3rd rotates to v2)
      const pass2 = await orchestrator.reEncryptBatch(
        Array.from(store.values()),
        async (id, nextEnv) => {
          store.get(id)!.envelope = nextEnv;
        }
      );
      expect(pass2.interrupted).toBe(false);
      expect(pass2.skippedAlreadyCurrentCount).toBe(2);
      expect(pass2.reEncryptedCount).toBe(1);
      expect(pass2.failedRecords).toHaveLength(0);

      // Verify all 3 records decrypt cleanly after migration
      expect(kms.decrypt(store.get('r1')!.envelope)).toBe('Record 1');
      expect(kms.decrypt(store.get('r2')!.envelope)).toBe('Record 2');
      expect(kms.decrypt(store.get('r3')!.envelope)).toBe('Record 3');

      // Safe retirement succeeds once zero references verified
      const retired = kms.retireKeySafely('hb-dev-kms-v1', true, 'admin-1');
      expect(retired.status).toBe('RETIRED');
    });
  });

  describe('3. Secure Document Storage, Quarantine, Signed URL Expiry & Integrity Verification', () => {
    it('holds unscanned files safely (never auto-CLEAN), blocks infected files, enforces signed URL ownership/expiry, and detects SHA-256 tampering', async () => {
      const kms = new KeyManagementService(new DevelopmentLocalKeyProvider());
      const docStorage = new SecureDocumentStorageService(new FileSecurityService(), kms);
      const validPdf = Buffer.from('%PDF-1.7\nHealthBridge Encrypted Clinical Report');

      // Default unconfigured scanner keeps file in SCAN_FAILED (NOT CLEAN)
      const unconfiguredUpload = await docStorage.uploadPrivateDocument({
        ownerId: 'patient-A',
        fileName: '../../path/report.pdf',
        mimeType: 'application/pdf',
        buffer: validPdf,
      });
      expect(unconfiguredUpload.scanStatus).toBe('SCAN_FAILED');
      expect(unconfiguredUpload.safeFileName).toBe('report.pdf');

      const tokenUnscanned = docStorage.issueSignedDownloadToken(unconfiguredUpload.documentId, 'patient-A', 60);
      await expect(
        docStorage.downloadWithSignedToken(unconfiguredUpload.documentId, 'patient-A', tokenUnscanned.token)
      ).rejects.toThrow(/SCAN_FAILED/i);

      // Configure operational mock scanner returning CLEAN
      docStorage.setScanner({
        scannerName: 'TEST_AV_SCANNER',
        isOperational: true,
        scanBuffer: async () => ({ status: 'CLEAN' }),
      });

      const cleanDoc = await docStorage.uploadPrivateDocument({
        ownerId: 'patient-A',
        fileName: 'lab_result.pdf',
        mimeType: 'application/pdf',
        buffer: validPdf,
      });
      expect(cleanDoc.scanStatus).toBe('CLEAN');

      // Cross-patient signed URL request rejected (403)
      expect(() =>
        docStorage.issueSignedDownloadToken(cleanDoc.documentId, 'patient-B', 60)
      ).toThrow(/do not own/i);

      // Owner downloads decrypted verified file successfully
      const signed = docStorage.issueSignedDownloadToken(cleanDoc.documentId, 'patient-A', 60);
      const downloaded = await docStorage.downloadWithSignedToken(
        cleanDoc.documentId,
        'patient-A',
        signed.token
      );
      expect(downloaded.buffer.toString('utf-8')).toBe(validPdf.toString('utf-8'));

      // Expired signed URL rejected (410)
      const expired = docStorage.issueSignedDownloadToken(cleanDoc.documentId, 'patient-A', -5);
      await expect(
        docStorage.downloadWithSignedToken(cleanDoc.documentId, 'patient-A', expired.token)
      ).rejects.toThrow(/expired/i);

      // Tampering with stored SHA-256 hash triggers INTEGRITY_MISMATCH failure
      const rawStored = docStorage.getStoredRecordInternal(cleanDoc.documentId)!;
      rawStored.sha256IntegrityHash = '0'.repeat(64);
      await expect(
        docStorage.downloadWithSignedToken(cleanDoc.documentId, 'patient-A', signed.token)
      ).rejects.toThrow(/integrity verification failed/i);

      // Infected document quarantined & blocked from download
      docStorage.setScanner({
        scannerName: 'TEST_AV_SCANNER',
        isOperational: true,
        scanBuffer: async () => ({ status: 'INFECTED', detail: 'EICAR test signature' }),
      });
      const infectedDoc = await docStorage.uploadPrivateDocument({
        ownerId: 'patient-A',
        fileName: 'infected.pdf',
        mimeType: 'application/pdf',
        buffer: validPdf,
      });
      expect(infectedDoc.scanStatus).toBe('INFECTED');
      expect(() =>
        docStorage.issueSignedDownloadToken(infectedDoc.documentId, 'patient-A', 60)
      ).toThrow(/quarantined/i);
    });
  });

  describe('4. Backup Verification, Isolated Restore & Data Integrity Reconciliation', () => {
    it('verifies backup manifest checksums, passes clean isolated restores, and detects orphan references & missing keys without discarding records', () => {
      const kms = new KeyManagementService(new DevelopmentLocalKeyProvider());
      const recovery = new BackupRecoveryGovernanceService(kms);

      const manifest = JSON.stringify({ collections: ['users', 'medicalRecords'], count: 42 });
      recovery.registerBackupMetadata({
        backupId: 'bkp-isolated-001',
        environment: 'LOCAL_ISOLATED_TEST',
        provider: 'SYNTHETIC_SNAPSHOT_VERIFICATION',
        manifestPayload: manifest,
        encryptedAtRest: true,
        keyVersionRefs: ['hb-dev-kms-v1'],
        notes: 'Isolated synthetic restore verification',
      });

      expect(recovery.verifyBackupChecksum('bkp-isolated-001', manifest)).toBe(true);
      expect(recovery.verifyBackupChecksum('bkp-isolated-001', '{"tampered":true}')).toBe(false);

      // Clean dataset reconciliation passes
      const cleanReport = recovery.reconcileRestoredDataset({
        patientIds: ['p1'],
        encounters: [{ id: 'enc1', patientId: 'p1' }],
        prescriptions: [{ id: 'rx1', patientId: 'p1' }],
        labReports: [{ id: 'lab1', patientId: 'p1' }],
        consents: [{ id: 'con1', patientId: 'p1' }],
        documents: [{ id: 'doc1', patientId: 'p1', keyId: 'hb-dev-kms-v1' }],
      });
      expect(cleanReport.passed).toBe(true);
      expect(cleanReport.failures).toHaveLength(0);

      const cleanRestore = recovery.recordRestoreTestRun({
        backupId: 'bkp-isolated-001',
        targetEnvironment: 'ISOLATED_TEST_DB',
        reconciliation: cleanReport,
      });
      expect(cleanRestore.status).toBe('PASSED');

      // Missing patient ref + missing encryption key recorded explicitly (not silently discarded)
      const brokenReport = recovery.reconcileRestoredDataset({
        patientIds: ['p1'],
        encounters: [{ id: 'enc-orphan', patientId: 'p-missing' }],
        prescriptions: [],
        labReports: [],
        consents: [],
        documents: [{ id: 'doc-lost-key', patientId: 'p1', keyId: 'missing-key-v99' }],
      });
      expect(brokenReport.passed).toBe(false);
      expect(brokenReport.failures.map((f) => f.issueCode)).toEqual([
        'ORPHAN_PATIENT_REF',
        'MISSING_ENCRYPTION_KEY',
      ]);

      const failedRestore = recovery.recordRestoreTestRun({
        backupId: 'bkp-isolated-001',
        targetEnvironment: 'ISOLATED_TEST_DB',
        reconciliation: brokenReport,
      });
      expect(failedRestore.status).toBe('FAILED');
      expect(failedRestore.reconciliationIssuesCount).toBe(2);
    });
  });
});
