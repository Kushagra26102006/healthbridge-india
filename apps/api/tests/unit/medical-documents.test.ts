import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { fileSecurityService } from '../../src/security/file-security.service';
import {
  recordService,
  mapToFHIRDocumentReference,
} from '../../src/modules/records/services/record.service';
import { recordController } from '../../src/modules/records/controllers/record.controller';
import { MedicalRecordModel } from '../../src/modules/healthcare/models/medical-record.model';
import { consentEnforcementService } from '../../src/modules/consent/services/consent-enforcement.service';
import { securityAuditMonitor } from '../../src/security/security-audit.monitor';
import { AppError } from '../../src/shared/errors/app-error';
import { HEALTH_RECORD_TYPES } from '@healthbridge/config';

const VALID_PDF_BUFFER = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const VALID_JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const FAKE_EXE_BUFFER = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
const FAKE_HTML_BUFFER = Buffer.from('<html><script>alert(1)</script></html>');

describe('Phase 16 — Medical Document Management System Unit Tests', () => {
  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const recordId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(securityAuditMonitor, 'record').mockResolvedValue(undefined);
  });

  describe('1. Server-Side File Validation (MIME, Extension, Magic Bytes, Size)', () => {
    it('accepts valid PDF, PNG, and JPEG payloads with verified signatures and SHA-256 checksums', async () => {
      const pdf = await fileSecurityService.validateUpload({
        fileName: '../../report_2026.pdf',
        mimeType: 'application/pdf',
        fileSize: VALID_PDF_BUFFER.length,
        fileData: VALID_PDF_BUFFER.toString('base64'),
      });
      expect(pdf.signatureVerified).toBe(true);
      expect(pdf.safeFileName).toBe('report_2026.pdf');
      expect(pdf.storageId).toMatch(/^doc_.*\.pdf$/);
      expect(pdf.sha256Checksum).toHaveLength(64);
      expect(pdf.malwareScan.status).toBe('SCAN_NOT_CONFIGURED');

      const png = await fileSecurityService.validateUpload({
        fileName: 'xray_scan.png',
        mimeType: 'image/png',
        fileSize: VALID_PNG_BUFFER.length,
        fileData: VALID_PNG_BUFFER.toString('base64'),
      });
      expect(png.signatureVerified).toBe(true);

      const jpg = await fileSecurityService.validateUpload({
        fileName: 'prescription.jpeg',
        mimeType: 'image/jpeg',
        fileSize: VALID_JPEG_BUFFER.length,
        fileData: VALID_JPEG_BUFFER.toString('base64'),
      });
      expect(jpg.signatureVerified).toBe(true);
    });

    it('rejects disguised executable (MZ) and HTML/XSS payloads claiming to be PDF', async () => {
      await expect(
        fileSecurityService.validateUpload({
          fileName: 'spoofed.pdf',
          mimeType: 'application/pdf',
          fileData: FAKE_EXE_BUFFER.toString('base64'),
        })
      ).rejects.toThrow(/signature verification failed/i);

      await expect(
        fileSecurityService.validateUpload({
          fileName: 'xss.pdf',
          mimeType: 'application/pdf',
          fileData: FAKE_HTML_BUFFER.toString('base64'),
        })
      ).rejects.toThrow(/signature verification failed/i);
    });

    it('rejects mismatched extension, unsupported MIME types, and files exceeding 10MB', async () => {
      await expect(
        fileSecurityService.validateUpload({
          fileName: 'malware.exe',
          mimeType: 'application/pdf',
          fileData: VALID_PDF_BUFFER.toString('base64'),
        })
      ).rejects.toThrow(/extension/i);

      await expect(
        fileSecurityService.validateUpload({
          fileName: 'script.js',
          mimeType: 'application/javascript',
        })
      ).rejects.toThrow(/not permitted/i);

      await expect(
        fileSecurityService.validateUpload({
          fileName: 'huge.pdf',
          mimeType: 'application/pdf',
          fileSize: 12 * 1024 * 1024,
        })
      ).rejects.toThrow(/10MB/i);
    });
  });

  describe('2. Duplicate SHA-256 Detection & All 9 Canonical Categories', () => {
    it('maps all 9 canonical HEALTH_RECORD_TYPES to valid HL7 FHIR DocumentReference LOINC codes', () => {
      expect(HEALTH_RECORD_TYPES).toContain('IMAGING_REPORT');
      expect(HEALTH_RECORD_TYPES).toContain('MEDICAL_CERTIFICATE');
      expect(HEALTH_RECORD_TYPES).toContain('OTHER_MEDICAL_DOCUMENT');

      for (const recordType of HEALTH_RECORD_TYPES) {
        const fhir = mapToFHIRDocumentReference({
          _id: new Types.ObjectId(recordId),
          patientId: new Types.ObjectId(patientAId),
          recordType,
          title: `Sample ${recordType}`,
          source: 'MANUAL_ENTRY',
          recordDate: new Date(),
          verificationStatus: 'SELF_SUBMITTED',
          createdBy: new Types.ObjectId(patientAId),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        expect(fhir.resourceType).toBe('DocumentReference');
        const coding = (fhir.type as any).coding[0];
        expect(coding.code).toBeTruthy();
        expect(coding.display).toBeTruthy();
      }
    });

    it('flags duplicate file uploads via SHA-256 checksum with 409 DUPLICATE_DOCUMENT unless allowDuplicate is true', async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

      const existingId = new Types.ObjectId();
      vi.spyOn(MedicalRecordModel, 'findOne').mockReturnValue({
        select: () => ({
          lean: () =>
            Promise.resolve({
              _id: existingId,
              title: 'Existing Blood Panel',
              createdAt: new Date('2026-10-01T10:00:00Z'),
            }),
        }),
      } as any);
      vi.spyOn(MedicalRecordModel.prototype, 'save').mockResolvedValue({} as any);

      try {
        await expect(
          recordService.createPatientRecord(patientAId, patientAId, {
            title: 'Duplicate Blood Panel',
            recordType: 'DIAGNOSTIC_REPORT',
            recordDate: '2026-10-10',
            fileName: 'blood_panel.pdf',
            mimeType: 'application/pdf',
            fileSize: VALID_PDF_BUFFER.length,
            fileData: VALID_PDF_BUFFER.toString('base64'),
          })
        ).rejects.toMatchObject({ statusCode: 409, code: 'DUPLICATE_DOCUMENT' });

        // Explicitly allowing duplicate succeeds
        const created = await recordService.createPatientRecord(patientAId, patientAId, {
          title: 'Duplicate Blood Panel (Re-uploaded)',
          recordType: 'DIAGNOSTIC_REPORT',
          recordDate: '2026-10-10',
          fileName: 'blood_panel.pdf',
          mimeType: 'application/pdf',
          fileSize: VALID_PDF_BUFFER.length,
          fileData: VALID_PDF_BUFFER.toString('base64'),
          allowDuplicate: true,
        });
        expect(created.patientId).toBe(patientAId);
        expect(created.sha256Checksum).toHaveLength(64);
        expect(created.storageId).toMatch(/^doc_.*\.pdf$/);
      } finally {
        Object.defineProperty(mongoose.connection, 'readyState', {
          value: originalReadyState,
          configurable: true,
        });
      }
    });
  });

  describe('3. Short-Lived Signed Access Tokens, Ownership & Expiry Guards', () => {
    it('issues and verifies short-lived HMAC-signed access tokens and blocks tampering, wrong recordId, and expiry', async () => {
      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(recordId),
        patientId: new Types.ObjectId(patientAId),
        recordType: 'IMAGING_REPORT',
        title: 'Chest X-Ray PA View',
        fileName: 'chest_xray.png',
        mimeType: 'image/png',
        fileSize: VALID_PNG_BUFFER.length,
        source: 'MANUAL_ENTRY',
        recordDate: new Date(),
        verificationStatus: 'SELF_SUBMITTED',
        createdBy: new Types.ObjectId(patientAId),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const issued = await recordService.issueSignedAccessToken({
        recordId,
        patientId: patientAId,
        actorId: patientAId,
        actorRole: 'PATIENT',
        ttlSeconds: 120,
      });

      expect(issued.previewUrl).toContain(`/api/v1/records/${recordId}/preview?token=`);
      expect(issued.accessScope).toBe('OWNER');

      const verified = recordService.verifySignedAccessToken(recordId, issued.token);
      expect(verified.patientId).toBe(patientAId);
      expect(verified.actorId).toBe(patientAId);

      // Mismatched recordId -> 403 FORBIDDEN
      const otherRecordId = new Types.ObjectId().toString();
      expect(() => recordService.verifySignedAccessToken(otherRecordId, issued.token)).toThrow(
        /does not match/i
      );

      // Tampered token -> 401 UNAUTHORIZED
      const tampered = issued.token.slice(0, -4) + 'AAAA';
      expect(() => recordService.verifySignedAccessToken(recordId, tampered)).toThrow(
        /signature is invalid|malformed|invalid/i
      );

      // Expired token -> 410 GONE
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 500_000);
      expect(() => recordService.verifySignedAccessToken(recordId, issued.token)).toThrow(
        /expired/i
      );
    });

    it('blocks Patient B from obtaining access token or archiving Patient A documents (IDOR protection)', async () => {
      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(recordId),
        patientId: new Types.ObjectId(patientAId),
        recordType: 'MEDICAL_CERTIFICATE',
        title: 'Medical Fitness Certificate',
        source: 'MANUAL_ENTRY',
        recordDate: new Date(),
        verificationStatus: 'SELF_SUBMITTED',
        isArchived: false,
        createdBy: new Types.ObjectId(patientAId),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        recordService.issueSignedAccessToken({
          recordId,
          patientId: patientBId,
          actorId: patientBId,
          actorRole: 'PATIENT',
        })
      ).rejects.toMatchObject({ statusCode: 403 });

      await expect(
        recordService.archivePatientRecord(patientBId, patientBId, recordId)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('allows Patient A to safely soft-archive own document and hides it from subsequent reads', async () => {
      const mockDoc: any = {
        _id: new Types.ObjectId(recordId),
        patientId: new Types.ObjectId(patientAId),
        recordType: 'OTHER_MEDICAL_DOCUMENT',
        title: 'Old Insurance Referral',
        source: 'MANUAL_ENTRY',
        recordDate: new Date(),
        verificationStatus: 'SELF_SUBMITTED',
        isArchived: false,
        createdBy: new Types.ObjectId(patientAId),
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(undefined),
      };
      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue(mockDoc);

      const archived = await recordService.archivePatientRecord(patientAId, patientAId, recordId);
      expect(archived.isArchived).toBe(true);
      expect(mockDoc.isArchived).toBe(true);

      // Subsequent read must return 404 Not Found
      await expect(recordService.getPatientRecordById(patientAId, recordId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('4. Doctor Consent & Role Permission Enforcement', () => {
    it('enforces ABDM consent for Doctor access-token issuance and denies Pharmacy/Laboratory roles', async () => {
      vi.spyOn(recordService, 'getRecordDocument').mockResolvedValue({
        _id: new Types.ObjectId(recordId),
        patientId: new Types.ObjectId(patientAId),
        isArchived: false,
      } as any);

      const enforceSpy = vi
        .spyOn(consentEnforcementService, 'enforce')
        .mockRejectedValueOnce(AppError.forbidden('Active patient consent is required'));

      const next = vi.fn();
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        setHeader: vi.fn(),
        getHeader: vi.fn(),
        send: vi.fn(),
      };

      // 1. Unconsented doctor must be blocked
      recordController.issueAccessToken(
        {
          user: { userId: doctorId, role: 'DOCTOR' },
          params: { recordId },
        } as any,
        res,
        next
      );
      await new Promise((r) => setImmediate(r));
      expect(enforceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          requesterId: doctorId,
          requesterRole: 'DOCTOR',
          patientId: patientAId,
          dataCategory: 'MEDICAL_RECORDS',
        })
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));

      // 2. Pharmacy role must be strictly forbidden from general medical records
      next.mockClear();
      recordController.issueAccessToken(
        {
          user: { userId: new Types.ObjectId().toString(), role: 'PHARMACY' },
          params: { recordId },
        } as any,
        res,
        next
      );
      await new Promise((r) => setImmediate(r));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));

      // 3. Laboratory role must be strictly forbidden from general medical records
      next.mockClear();
      recordController.issueAccessToken(
        {
          user: { userId: new Types.ObjectId().toString(), role: 'LABORATORY' },
          params: { recordId },
        } as any,
        res,
        next
      );
      await new Promise((r) => setImmediate(r));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));

      // 4. Consented doctor succeeds and receives CONSENTED_DOCTOR scope token
      next.mockClear();
      vi.spyOn(consentEnforcementService, 'enforce').mockResolvedValueOnce({} as any);
      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(recordId),
        patientId: new Types.ObjectId(patientAId),
        recordType: 'DIAGNOSTIC_REPORT',
        title: 'Authorized Lab Report',
        fileName: 'lab.pdf',
        mimeType: 'application/pdf',
        source: 'EHR_SYNC',
        recordDate: new Date(),
        verificationStatus: 'VERIFIED',
        createdBy: new Types.ObjectId(patientAId),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      recordController.issueAccessToken(
        {
          user: { userId: doctorId, role: 'DOCTOR' },
          params: { recordId },
        } as any,
        res,
        next
      );
      await new Promise((r) => setImmediate(r));
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accessScope: 'CONSENTED_DOCTOR',
          }),
        })
      );
    });
  });
});
