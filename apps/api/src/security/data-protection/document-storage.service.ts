/**
 * HealthBridge India — Secure Document Storage, Quarantine, Encryption & Signed Download Service (Day 9 Task 03)
 *
 * Extends Day 9 Task 01 FileSecurityService without duplicating validation logic:
 *   - Private storage abstraction (never exposes public URLs)
 *   - Quarantine & malware scanning state machine:
 *       UPLOADED -> QUARANTINED -> SCANNING -> CLEAN | INFECTED | SCAN_FAILED | REJECTED
 *     (Failed or unconfigured scanners NEVER auto-mark documents CLEAN)
 *   - Authenticated AES-256-GCM at-rest file encryption + SHA-256 integrity hash verification
 *   - Short-lived HMAC-signed private download tokens bound to (documentId, ownerId, expiresAt)
 */

import crypto from 'crypto';
import { AppError } from '../../shared/errors/app-error';
import { HttpStatus } from '../../shared/constants/http-status';
import {
  fileSecurityService,
  type AllowedClinicalMimeType,
  type FileSecurityService,
} from '../file-security.service';
import {
  keyManagementService,
  type EncryptedEnvelope,
  type KeyManagementService,
} from './key-management.service';
import { securityAuditMonitor } from '../security-audit.monitor';

export type DocumentScanLifecycleStatus =
  | 'UPLOADED'
  | 'QUARANTINED'
  | 'SCANNING'
  | 'CLEAN'
  | 'INFECTED'
  | 'SCAN_FAILED'
  | 'REJECTED';

export interface DocumentScannerPlugin {
  readonly scannerName: string;
  readonly isOperational: boolean;
  scanBuffer(buffer: Buffer, mimeType: string): Promise<{ status: 'CLEAN' | 'INFECTED' | 'SCAN_FAILED'; detail?: string }>;
}

/**
 * Default honest scanner boundary when ClamAV / cloud AV is not provisioned.
 * Keeps files in QUARANTINED / SCAN_FAILED state rather than faking CLEAN.
 */
class UnconfiguredDocumentScanner implements DocumentScannerPlugin {
  readonly scannerName = 'UNCONFIGURED_SCANNER_BOUNDARY';
  readonly isOperational = false;

  async scanBuffer(): Promise<{ status: 'SCAN_FAILED'; detail: string }> {
    return {
      status: 'SCAN_FAILED',
      detail: 'No external malware scanner configured in this environment.',
    };
  }
}

export interface StoredEncryptedDocument {
  documentId: string;
  storageId: string;
  ownerId: string;
  safeFileName: string;
  mimeType: AllowedClinicalMimeType;
  byteSize: number;
  sha256IntegrityHash: string;
  scanStatus: DocumentScanLifecycleStatus;
  scannerName: string;
  storageProvider: 'LOCAL_PRIVATE_DEVELOPMENT_STORE';
  encryptedPayload: EncryptedEnvelope;
  uploadedAt: string;
}

export class SecureDocumentStorageService {
  private readonly privateBucket = new Map<string, StoredEncryptedDocument>();
  private scanner: DocumentScannerPlugin = new UnconfiguredDocumentScanner();

  constructor(
    private readonly fileValidator: FileSecurityService = fileSecurityService,
    private readonly kms: KeyManagementService = keyManagementService
  ) {}

  setScanner(scanner: DocumentScannerPlugin): void {
    this.scanner = scanner;
  }

  getStorageHealthSummary() {
    const docs = Array.from(this.privateBucket.values());
    return {
      storageProvider: 'LOCAL_PRIVATE_DEVELOPMENT_STORE',
      publicAccessEnabled: false,
      atRestApplicationEncryption: 'AES-256-GCM',
      scannerName: this.scanner.scannerName,
      malwareScanningOperational: this.scanner.isOperational,
      storedDocumentCount: docs.length,
      quarantinedOrFailedCount: docs.filter((d) =>
        ['QUARANTINED', 'SCAN_FAILED', 'INFECTED', 'REJECTED'].includes(d.scanStatus)
      ).length,
      cleanCount: docs.filter((d) => d.scanStatus === 'CLEAN').length,
    };
  }

  private getSigningSecret(): string {
    return (
      process.env.COOKIE_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      'hb-dev-signed-url-secret'
    );
  }

  /**
   * Uploads, validates signature/MIME/size, places into private quarantine, invokes configured
   * scanner boundary, encrypts payload with AES-256-GCM + AAD, and records SHA-256 integrity hash.
   */
  async uploadPrivateDocument(input: {
    ownerId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    requestId?: string;
  }): Promise<Omit<StoredEncryptedDocument, 'encryptedPayload'>> {
    // 1. Reuse Day 9 Task 01 FileSecurityService (magic bytes, MIME/ext, 10MB cap, filename sanitization)
    const validated = await this.fileValidator.validateUpload({
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.buffer.length,
      fileData: input.buffer.toString('base64'),
    });

    const documentId = `docrec_${crypto.randomUUID()}`;
    let scanStatus: DocumentScanLifecycleStatus = 'QUARANTINED';

    // 2. Run malware scanner boundary (NEVER auto-marks CLEAN on failure or unconfigured scanner)
    scanStatus = 'SCANNING';
    try {
      const scanOutcome = await this.scanner.scanBuffer(input.buffer, validated.mimeType);
      scanStatus = scanOutcome.status;
      if (scanStatus === 'INFECTED') {
        this.kms.recordIncident(
          {
            type: 'MALWARE_SCAN_ALERT',
            severity: 'CRITICAL',
            message: 'Uploaded medical document flagged INFECTED and held in quarantine.',
            metadata: { documentId, scannerName: this.scanner.scannerName },
          },
          { actorId: input.ownerId, actorRole: 'PATIENT' }
        );
      }
    } catch {
      scanStatus = 'SCAN_FAILED';
    }

    // 3. Encrypt file contents at rest with AES-256-GCM bound to documentId + ownerId AAD
    const aad = `${documentId}:${input.ownerId}`;
    const encryptedPayload = this.kms.encrypt(input.buffer, aad);

    const record: StoredEncryptedDocument = {
      documentId,
      storageId: validated.storageId,
      ownerId: input.ownerId,
      safeFileName: validated.safeFileName,
      mimeType: validated.mimeType,
      byteSize: validated.byteSize,
      sha256IntegrityHash: validated.sha256Checksum,
      scanStatus,
      scannerName: this.scanner.scannerName,
      storageProvider: 'LOCAL_PRIVATE_DEVELOPMENT_STORE',
      encryptedPayload,
      uploadedAt: new Date().toISOString(),
    };

    this.privateBucket.set(documentId, record);

    await securityAuditMonitor.record({
      actorId: input.ownerId,
      action: 'DOCUMENT_UPLOADED',
      resourceType: 'PRIVATE_DOCUMENT',
      resourceId: documentId,
      requestId: input.requestId,
      outcome: scanStatus === 'INFECTED' ? 'BLOCKED' : 'SUCCESS',
      metadata: {
        storageId: record.storageId,
        mimeType: record.mimeType,
        byteSize: record.byteSize,
        scanStatus,
        keyId: encryptedPayload.keyId,
      },
    });

    const { encryptedPayload: _hidden, ...publicMeta } = record;
    return publicMeta;
  }

  /**
   * Issues a short-lived HMAC-signed download token bound strictly to documentId + requesterId.
   */
  issueSignedDownloadToken(
    documentId: string,
    requesterId: string,
    ttlSeconds = 60
  ): { token: string; expiresAt: string } {
    const doc = this.privateBucket.get(documentId);
    if (!doc) {
      throw AppError.notFound('Document not found.');
    }
    if (doc.ownerId !== requesterId) {
      this.kms.recordIncident(
        {
          type: 'UNAUTHORIZED_DOCUMENT_ACCESS',
          severity: 'HIGH',
          message: 'Blocked signed download URL issuance for non-owner.',
          metadata: { documentId },
        },
        { actorId: requesterId, actorRole: 'PATIENT' }
      );
      throw AppError.forbidden('Access denied: You do not own this medical document.');
    }
    if (doc.scanStatus === 'INFECTED' || doc.scanStatus === 'REJECTED') {
      throw AppError.forbidden('Document is quarantined due to security policy and cannot be downloaded.');
    }

    const expMs = Date.now() + ttlSeconds * 1000;
    const payload = `${documentId}.${requesterId}.${expMs}`;
    const sig = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(payload)
      .digest('hex');

    return {
      token: Buffer.from(`${payload}.${sig}`).toString('base64url'),
      expiresAt: new Date(expMs).toISOString(),
    };
  }

  /**
   * Verifies signed download token, ownership, quarantine state, authenticated decryption,
   * AND SHA-256 integrity hash before releasing decrypted document bytes.
   */
  async downloadWithSignedToken(
    documentId: string,
    requesterId: string,
    signedToken: string,
    options?: { allowUnscannedInDev?: boolean; requestId?: string }
  ): Promise<{ fileName: string; mimeType: string; buffer: Buffer }> {
    const decoded = Buffer.from(signedToken, 'base64url').toString('utf-8');
    const parts = decoded.split('.');
    if (parts.length !== 4) {
      throw AppError.unauthorized('Invalid signed download token.');
    }
    const tokenDocId = parts[0] || '';
    const tokenOwnerId = parts[1] || '';
    const expStr = parts[2] || '';
    const providedSig = parts[3] || '';
    const expectedSig = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(`${tokenDocId}.${tokenOwnerId}.${expStr}`)
      .digest('hex');

    if (
      !providedSig ||
      providedSig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig))
    ) {
      throw AppError.unauthorized('Signed download token signature is invalid.');
    }

    if (Date.now() > Number(expStr)) {
      throw new AppError('Signed download URL has expired.', HttpStatus.GONE);
    }

    if (tokenDocId !== documentId || tokenOwnerId !== requesterId) {
      throw AppError.forbidden('Signed download token does not match requested document or actor.');
    }

    const doc = this.privateBucket.get(documentId);
    if (!doc) {
      throw AppError.notFound('Document not found.');
    }
    if (doc.ownerId !== requesterId) {
      throw AppError.forbidden('Access denied: You do not own this medical document.');
    }
    if (doc.scanStatus === 'INFECTED' || doc.scanStatus === 'REJECTED') {
      throw AppError.forbidden('Quarantined infected document cannot be released.');
    }
    if (doc.scanStatus !== 'CLEAN' && !options?.allowUnscannedInDev) {
      throw AppError.forbidden(
        `Document is held in '${doc.scanStatus}' state until malware scanning completes.`
      );
    }

    // Decrypt using authenticated AES-256-GCM + AAD
    const aad = `${doc.documentId}:${doc.ownerId}`;
    const plaintextBuffer = this.kms.decryptToBuffer(doc.encryptedPayload, aad);

    // Verify SHA-256 cryptographic integrity hash
    const actualSha256 = crypto.createHash('sha256').update(plaintextBuffer).digest('hex');
    if (actualSha256 !== doc.sha256IntegrityHash) {
      this.kms.recordIncident(
        {
          type: 'INTEGRITY_MISMATCH',
          severity: 'CRITICAL',
          message: 'SHA-256 integrity verification failed on decrypted document.',
          metadata: { documentId },
        },
        { actorId: requesterId, actorRole: 'PATIENT' }
      );
      throw new AppError('Document integrity verification failed.', 500);
    }

    await securityAuditMonitor.record({
      actorId: requesterId,
      action: 'DOCUMENT_DOWNLOADED',
      resourceType: 'PRIVATE_DOCUMENT',
      resourceId: documentId,
      requestId: options?.requestId,
      outcome: 'SUCCESS',
      metadata: { byteSize: plaintextBuffer.length, keyId: doc.encryptedPayload.keyId },
    });

    return {
      fileName: doc.safeFileName,
      mimeType: doc.mimeType,
      buffer: plaintextBuffer,
    };
  }

  /**
   * Test/diagnostic helper to inspect raw stored record (e.g., for corruption integrity tests).
   */
  getStoredRecordInternal(documentId: string): StoredEncryptedDocument | undefined {
    return this.privateBucket.get(documentId);
  }

  clearForTests(): void {
    this.privateBucket.clear();
  }
}

export const secureDocumentStorageService = new SecureDocumentStorageService();
export default secureDocumentStorageService;
