/**
 * HealthBridge India — Medical Document & File Security Service (Day 9 Task 01)
 *
 * Enforces defense-in-depth validation on clinical document uploads and downloads:
 *   1. Strict MIME allowlist paired with extension verification
 *   2. Binary magic-byte file signature inspection (NEVER trusts client-provided MIME alone)
 *   3. Actual decoded byte-size enforcement (<= 10MB)
 *   4. Path-traversal & CRLF-safe filename sanitization + cryptographic random storage IDs
 *   5. Explicit Malware Scanning Integration Boundary (honest NOT_CONFIGURED status when AV
 *      infrastructure is absent — never falsely claims files are malware-scanned)
 */

import crypto from 'crypto';
import { RECORD_CONFIG } from '@healthbridge/config';
import { AppError } from '../shared/errors/app-error';

export type AllowedClinicalMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/webp';

export type MalwareScanStatus =
  | 'CLEAN'
  | 'INFECTED'
  | 'SCAN_NOT_CONFIGURED';

export interface MalwareScanResult {
  status: MalwareScanStatus;
  scannerEngine: string;
  scannedAt?: string;
  reason?: string;
}

export interface MalwareScannerAdapter {
  readonly engineName: string;
  scan(buffer: Buffer, mimeType: string): Promise<MalwareScanResult>;
}

/**
 * Default honest boundary adapter when no external ClamAV / cloud AV scanner is provisioned.
 */
class UnconfiguredMalwareScannerAdapter implements MalwareScannerAdapter {
  readonly engineName = 'UNCONFIGURED_LOCAL_BOUNDARY';

  async scan(_buffer: Buffer, _mimeType: string): Promise<MalwareScanResult> {
    return {
      status: 'SCAN_NOT_CONFIGURED',
      scannerEngine: this.engineName,
      reason: 'No external antivirus/malware scanner infrastructure configured in this environment.',
    };
  }
}

const ALLOWED_EXTENSION_BY_MIME: Record<AllowedClinicalMimeType, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const DANGEROUS_PREFIX_SIGNATURES: Array<{ label: string; test: (buf: Buffer) => boolean }> = [
  {
    label: 'Windows PE executable (MZ)',
    test: (buf) => buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a,
  },
  {
    label: 'ELF executable',
    test: (buf) =>
      buf.length >= 4 && buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46,
  },
  {
    label: 'HTML/Script payload',
    test: (buf) => {
      const head = buf.subarray(0, 64).toString('utf-8').trim().toLowerCase();
      return head.startsWith('<script') || head.startsWith('<!doctype html') || head.startsWith('<html') || head.startsWith('<svg');
    },
  },
];

export interface ValidatedFileUpload {
  safeFileName: string;
  storageId: string;
  mimeType: AllowedClinicalMimeType;
  byteSize: number;
  sha256Checksum: string;
  signatureVerified: boolean;
  malwareScan: MalwareScanResult;
}

export class FileSecurityService {
  constructor(
    private readonly malwareScanner: MalwareScannerAdapter = new UnconfiguredMalwareScannerAdapter()
  ) {}

  /**
   * Sanitizes untrusted client filenames against path traversal (../), null bytes,
   * control/CRLF header injection characters, and excessive lengths.
   */
  sanitizeFileName(rawName?: string, fallbackMime: string = 'application/pdf'): string {
    const defaultExt = fallbackMime === 'image/png' ? '.png' : fallbackMime.includes('jpeg') || fallbackMime.includes('jpg') ? '.jpg' : fallbackMime === 'image/webp' ? '.webp' : '.pdf';
    if (!rawName || typeof rawName !== 'string') {
      return `clinical_document${defaultExt}`;
    }

    // Strip directory components (Unix & Windows) and control characters
    const base = rawName
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/\\/g, '/')
      .split('/')
      .pop() || 'clinical_document';

    const cleaned = base
      .replace(/\.\.+/g, '.')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^_+/, '')
      .slice(0, 120);

    if (!cleaned || cleaned === '.' || cleaned === '..') {
      return `clinical_document${defaultExt}`;
    }

    return cleaned;
  }

  /**
   * Generates an opaque cryptographic storage identifier so raw filenames never map to disk/object paths.
   */
  generateStorageId(mimeType: AllowedClinicalMimeType): string {
    const ext = ALLOWED_EXTENSION_BY_MIME[mimeType]?.[0] || '.bin';
    return `doc_${crypto.randomUUID()}${ext}`;
  }

  /**
   * Inspects binary magic bytes to verify the buffer genuinely matches the claimed MIME type.
   */
  verifyMagicBytes(buffer: Buffer, claimedMime: AllowedClinicalMimeType): boolean {
    if (!buffer || buffer.length < 4) {
      return false;
    }

    for (const danger of DANGEROUS_PREFIX_SIGNATURES) {
      if (danger.test(buffer)) {
        return false;
      }
    }

    switch (claimedMime) {
      case 'application/pdf':
        // %PDF-
        return (
          buffer[0] === 0x25 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x44 &&
          buffer[3] === 0x46 &&
          buffer[4] === 0x2d
        );
      case 'image/png':
        // 89 50 4E 47 0D 0A 1A 0A
        return (
          buffer.length >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47 &&
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a
        );
      case 'image/jpeg':
      case 'image/jpg':
        // FF D8 FF
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      case 'image/webp':
        // RIFF....WEBP
        return (
          buffer.length >= 12 &&
          buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
          buffer.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      default:
        return false;
    }
  }

  /**
   * Full validation pipeline for uploaded clinical document payloads.
   */
  async validateUpload(input: {
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    fileData?: string;
  }): Promise<ValidatedFileUpload> {
    const mimeType = (input.mimeType || 'application/pdf').toLowerCase() as AllowedClinicalMimeType;
    const allowedMimes = RECORD_CONFIG.allowedMimeTypes as readonly string[];

    if (!allowedMimes.includes(mimeType) || !ALLOWED_EXTENSION_BY_MIME[mimeType]) {
      throw AppError.badRequest(
        `File format '${mimeType}' is not permitted for clinical document uploads.`
      );
    }

    if (input.fileSize !== undefined && input.fileSize > RECORD_CONFIG.maxFileSize) {
      throw AppError.badRequest('File size exceeds maximum permitted limit of 10MB.');
    }

    const safeFileName = this.sanitizeFileName(input.fileName, mimeType);

    // If a filename extension is present, ensure it aligns with the allowed MIME type
    const dotIdx = safeFileName.lastIndexOf('.');
    if (dotIdx > 0) {
      const ext = safeFileName.slice(dotIdx).toLowerCase();
      if (!ALLOWED_EXTENSION_BY_MIME[mimeType].includes(ext)) {
        throw AppError.badRequest(
          `File extension '${ext}' does not match permitted content type '${mimeType}'.`
        );
      }
    }

    let decodedBuffer: Buffer | null = null;
    let signatureVerified = false;
    let byteSize = input.fileSize || 0;
    let sha256Checksum = '';
    let malwareScan: MalwareScanResult = {
      status: 'SCAN_NOT_CONFIGURED',
      scannerEngine: this.malwareScanner.engineName,
    };

    if (input.fileData) {
      const base64Body = input.fileData.includes('base64,')
        ? input.fileData.split('base64,')[1] || ''
        : input.fileData;

      decodedBuffer = Buffer.from(base64Body, 'base64');
      byteSize = decodedBuffer.length;

      if (byteSize === 0) {
        throw AppError.badRequest('Uploaded file payload is empty or invalid Base64.');
      }

      if (byteSize > RECORD_CONFIG.maxFileSize) {
        throw AppError.badRequest('Decoded file size exceeds maximum permitted limit of 10MB.');
      }

      if (!this.verifyMagicBytes(decodedBuffer, mimeType)) {
        throw AppError.badRequest(
          `File signature verification failed: binary content does not match declared type '${mimeType}'.`
        );
      }

      signatureVerified = true;
      sha256Checksum = crypto.createHash('sha256').update(decodedBuffer).digest('hex');
      malwareScan = await this.malwareScanner.scan(decodedBuffer, mimeType);

      if (malwareScan.status === 'INFECTED') {
        throw AppError.badRequest('File rejected by malware scanner policy.');
      }
    }

    return {
      safeFileName,
      storageId: this.generateStorageId(mimeType),
      mimeType,
      byteSize,
      sha256Checksum,
      signatureVerified,
      malwareScan,
    };
  }
}

export const fileSecurityService = new FileSecurityService();
export default fileSecurityService;
