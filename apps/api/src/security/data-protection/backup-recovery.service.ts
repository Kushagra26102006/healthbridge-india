/**
 * HealthBridge India — Backup Verification, Restore Testing & Data Integrity Reconciliation (Day 9 Task 03)
 *
 * Tracks:
 *   - Backup metadata & SHA-256 manifest verification (honest about Atlas provider status)
 *   - Isolated restore-test runs (never touches production)
 *   - Post-restore referential & encryption key-version reconciliation
 *     (NEVER silently discards inconsistent records; records failures for investigation)
 */

import crypto from 'crypto';
import {
  keyManagementService,
  type KeyManagementService,
} from './key-management.service';

export interface BackupMetadataRecord {
  backupId: string;
  environment: 'LOCAL_ISOLATED_TEST' | 'STAGING' | 'PRODUCTION_UNVERIFIED';
  provider: 'MONGODB_ATLAS_NOT_VERIFIED_OFFLINE' | 'SYNTHETIC_SNAPSHOT_VERIFICATION';
  createdAt: string;
  manifestSha256: string;
  encryptedAtRest: boolean;
  keyVersionRefs: string[];
  verified: boolean;
  notes: string;
}

export interface RestoreTestRecord {
  restoreId: string;
  backupId: string;
  targetEnvironment: 'ISOLATED_TEST_DB' | 'STAGING';
  startedAt: string;
  completedAt: string;
  status: 'PASSED' | 'FAILED';
  reconciliationIssuesCount: number;
  failureReason?: string;
}

export interface ReconciliationDataset {
  patientIds: string[];
  encounters: Array<{ id: string; patientId: string }>;
  prescriptions: Array<{ id: string; patientId: string }>;
  labReports: Array<{ id: string; patientId: string }>;
  consents: Array<{ id: string; patientId: string }>;
  documents: Array<{ id: string; patientId: string; keyId: string }>;
}

export interface ReconciliationReport {
  checkedAt: string;
  totalEntitiesChecked: number;
  passed: boolean;
  failures: Array<{
    entityType: string;
    entityId: string;
    issueCode: 'ORPHAN_PATIENT_REF' | 'MISSING_ENCRYPTION_KEY' | 'RETIRED_ENCRYPTION_KEY';
    detail: string;
  }>;
}

export class BackupRecoveryGovernanceService {
  private readonly backups: BackupMetadataRecord[] = [];
  private readonly restoreTests: RestoreTestRecord[] = [];

  constructor(private readonly kms: KeyManagementService = keyManagementService) {}

  registerBackupMetadata(input: {
    backupId: string;
    environment: BackupMetadataRecord['environment'];
    provider: BackupMetadataRecord['provider'];
    manifestPayload: string;
    encryptedAtRest: boolean;
    keyVersionRefs: string[];
    notes: string;
  }): BackupMetadataRecord {
    const record: BackupMetadataRecord = {
      backupId: input.backupId,
      environment: input.environment,
      provider: input.provider,
      createdAt: new Date().toISOString(),
      manifestSha256: crypto.createHash('sha256').update(input.manifestPayload).digest('hex'),
      encryptedAtRest: input.encryptedAtRest,
      keyVersionRefs: input.keyVersionRefs,
      verified: true,
      notes: input.notes,
    };
    this.backups.unshift(record);
    return record;
  }

  verifyBackupChecksum(backupId: string, manifestPayload: string): boolean {
    const found = this.backups.find((b) => b.backupId === backupId);
    if (!found) return false;
    const computed = crypto.createHash('sha256').update(manifestPayload).digest('hex');
    return computed === found.manifestSha256;
  }

  /**
   * Reconciles restored cross-module references & encryption key availability.
   * NEVER silently discards invalid records — explicitly captures every anomaly for investigation.
   */
  reconcileRestoredDataset(dataset: ReconciliationDataset): ReconciliationReport {
    const patientSet = new Set(dataset.patientIds);
    const keyMetaById = new Map(
      this.kms.getProviderSummary().keys.map((k) => [k.keyId, k])
    );

    const failures: ReconciliationReport['failures'] = [];

    const checkPatientRef = (entityType: string, items: Array<{ id: string; patientId: string }>) => {
      for (const item of items) {
        if (!patientSet.has(item.patientId)) {
          failures.push({
            entityType,
            entityId: item.id,
            issueCode: 'ORPHAN_PATIENT_REF',
            detail: `${entityType} '${item.id}' references missing patientId '${item.patientId}'.`,
          });
        }
      }
    };

    checkPatientRef('ENCOUNTER', dataset.encounters);
    checkPatientRef('PRESCRIPTION', dataset.prescriptions);
    checkPatientRef('LAB_REPORT', dataset.labReports);
    checkPatientRef('CONSENT', dataset.consents);

    for (const doc of dataset.documents) {
      if (!patientSet.has(doc.patientId)) {
        failures.push({
          entityType: 'DOCUMENT',
          entityId: doc.id,
          issueCode: 'ORPHAN_PATIENT_REF',
          detail: `Document '${doc.id}' references missing patientId '${doc.patientId}'.`,
        });
      }
      const keyMeta = keyMetaById.get(doc.keyId);
      if (!keyMeta) {
        failures.push({
          entityType: 'DOCUMENT',
          entityId: doc.id,
          issueCode: 'MISSING_ENCRYPTION_KEY',
          detail: `Document '${doc.id}' depends on unavailable keyId '${doc.keyId}'.`,
        });
      } else if (keyMeta.status === 'RETIRED') {
        failures.push({
          entityType: 'DOCUMENT',
          entityId: doc.id,
          issueCode: 'RETIRED_ENCRYPTION_KEY',
          detail: `Document '${doc.id}' depends on retired keyId '${doc.keyId}'.`,
        });
      }
    }

    const totalEntitiesChecked =
      dataset.encounters.length +
      dataset.prescriptions.length +
      dataset.labReports.length +
      dataset.consents.length +
      dataset.documents.length;

    return {
      checkedAt: new Date().toISOString(),
      totalEntitiesChecked,
      passed: failures.length === 0,
      failures,
    };
  }

  recordRestoreTestRun(input: {
    backupId: string;
    targetEnvironment: 'ISOLATED_TEST_DB' | 'STAGING';
    reconciliation: ReconciliationReport;
    failureReason?: string;
  }): RestoreTestRecord {
    const passed = input.reconciliation.passed && !input.failureReason;
    const now = new Date().toISOString();
    const record: RestoreTestRecord = {
      restoreId: `rst_${crypto.randomUUID()}`,
      backupId: input.backupId,
      targetEnvironment: input.targetEnvironment,
      startedAt: now,
      completedAt: now,
      status: passed ? 'PASSED' : 'FAILED',
      reconciliationIssuesCount: input.reconciliation.failures.length,
      failureReason: input.failureReason,
    };

    this.restoreTests.unshift(record);

    if (!passed) {
      this.kms.recordIncident({
        type: 'RESTORE_FAILURE',
        severity: 'CRITICAL',
        message: `Isolated restore verification failed for backup '${input.backupId}'.`,
        metadata: {
          restoreId: record.restoreId,
          issuesCount: record.reconciliationIssuesCount,
        },
      });
    }

    return record;
  }

  getBackupAndRecoverySummary() {
    const lastVerifiedBackup = this.backups.find((b) => b.verified) || null;
    return {
      atlasAutomatedBackupStatus: 'NOT_VERIFIED_IN_OFFLINE_ENVIRONMENT',
      drReadinessClassification: 'ARCHITECTURE_DEFINED_PENDING_PROVIDER_VERIFICATION',
      proposedTargets: {
        rtoTarget: '4 hours (requires multi-AZ Atlas M10+ & IaC redeployment pipeline)',
        rpoTarget: '15 minutes (requires MongoDB Atlas Continuous Backup / PITR)',
      },
      lastVerifiedBackup,
      backupHistory: this.backups.slice(0, 10),
      restoreTestHistory: this.restoreTests.slice(0, 10),
    };
  }
}

export const backupRecoveryService = new BackupRecoveryGovernanceService();
export default backupRecoveryService;
