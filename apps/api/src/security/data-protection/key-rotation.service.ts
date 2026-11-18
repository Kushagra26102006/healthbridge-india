/**
 * HealthBridge India — Idempotent Batch Key Rotation & Re-Encryption Service (Day 9 Task 03)
 *
 * Re-encrypts historical encrypted records onto the active key version in batches:
 *   - Idempotent: records already encrypted under the active keyId are safely skipped
 *   - Fault-tolerant: tracks failed record IDs without halting or discarding records
 *   - Resumable: interrupted batches can be re-run cleanly to finish remaining records
 */

import {
  keyManagementService,
  type EncryptedEnvelope,
  type KeyManagementService,
} from './key-management.service';

export interface ReEncryptableRecord {
  id: string;
  envelope: EncryptedEnvelope;
  aad?: string;
}

export interface BatchReEncryptionResult {
  targetKeyId: string;
  totalExamined: number;
  reEncryptedCount: number;
  skippedAlreadyCurrentCount: number;
  failedRecords: Array<{ id: string; reason: string }>;
  interrupted: boolean;
  completedAt: string;
}

export class KeyRotationOrchestrator {
  private lastRotationReport: BatchReEncryptionResult | null = null;

  constructor(private readonly kms: KeyManagementService = keyManagementService) {}

  getLastReport(): BatchReEncryptionResult | null {
    return this.lastRotationReport;
  }

  /**
   * Executes an idempotent batch re-encryption pass.
   * Optional `maxBatchSize` allows simulating or scheduling incremental chunked migrations.
   */
  async reEncryptBatch(
    records: ReEncryptableRecord[],
    persistUpdated: (id: string, nextEnvelope: EncryptedEnvelope) => Promise<void>,
    options?: { maxBatchSize?: number }
  ): Promise<BatchReEncryptionResult> {
    const { keyId: targetKeyId } = this.kms.getActiveKeyVersion();
    const limit = options?.maxBatchSize ?? records.length;

    let totalExamined = 0;
    let reEncryptedCount = 0;
    let skippedAlreadyCurrentCount = 0;
    const failedRecords: Array<{ id: string; reason: string }> = [];
    let interrupted = false;

    for (const rec of records) {
      if (totalExamined >= limit) {
        interrupted = true;
        break;
      }
      totalExamined += 1;

      if (rec.envelope.keyId === targetKeyId) {
        skippedAlreadyCurrentCount += 1;
        continue;
      }

      try {
        const { envelope, rotated } = this.kms.reEncrypt(rec.envelope, rec.aad);
        if (rotated) {
          await persistUpdated(rec.id, envelope);
          reEncryptedCount += 1;
        } else {
          skippedAlreadyCurrentCount += 1;
        }
      } catch (err) {
        failedRecords.push({
          id: rec.id,
          reason: err instanceof Error ? err.message : 'Re-encryption failure',
        });
      }
    }

    const report: BatchReEncryptionResult = {
      targetKeyId,
      totalExamined,
      reEncryptedCount,
      skippedAlreadyCurrentCount,
      failedRecords,
      interrupted,
      completedAt: new Date().toISOString(),
    };

    this.lastRotationReport = report;
    return report;
  }
}

export const keyRotationOrchestrator = new KeyRotationOrchestrator();
export default keyRotationOrchestrator;
