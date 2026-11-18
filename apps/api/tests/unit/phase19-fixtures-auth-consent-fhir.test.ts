import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import {
  assertTestEnvironment,
  createSyntheticActorRoster,
  createSyntheticMedicalRecordPayload,
  createSyntheticAppointmentPayload,
  SYNTHETIC_FILES,
} from '../fixtures/synthetic-healthcare-fixtures';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { mapToFHIRDocumentReference } from '../../src/modules/records/services/record.service';
import { consentEnforcementService } from '../../src/modules/consent/services/consent-enforcement.service';
import { ConsentArtifactModel } from '../../src/modules/consent/models/consent-artifact.model';
import { ConsentRequestModel } from '../../src/modules/consent/models/consent-request.model';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';
import { fileSecurityService } from '../../src/security/file-security.service';

describe('Phase 19 Backend Unit Tests — Synthetic Fixtures, Auth Tokens, Consent & FHIR', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    consentEnforcementService.clearRevocationBarrier();
  });

  it('prevents synthetic test fixtures from ever running in production or non-test environments', () => {
    expect(() => assertTestEnvironment({ NODE_ENV: 'production' })).toThrow('SECURITY_BLOCK');
    expect(() => assertTestEnvironment({ NODE_ENV: 'development' })).toThrow('SECURITY_BLOCK');
    expect(() => assertTestEnvironment({})).toThrow('SECURITY_BLOCK');
    expect(() => assertTestEnvironment({ NODE_ENV: 'test' })).not.toThrow();

    const roster = createSyntheticActorRoster();
    expect(roster.patientA.email).toContain('@synthetic.healthbridge.test');
    expect(roster.doctorA.role).toBe('DOCTOR');
    expect(roster.pharmacyA.role).toBe('PHARMACY');
    expect(roster.laboratoryA.role).toBe('LABORATORY');
    expect(roster.adminA.role).toBe('ADMIN');
    expect(roster.patientA.id).not.toBe(roster.patientB.id);

    const appt = createSyntheticAppointmentPayload(roster.doctorA.id);
    expect(new Date(appt.scheduledAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects expired and signature-tampered JWT access tokens cleanly', () => {
    const roster = createSyntheticActorRoster();
    const verified = tokenService.verifyAccessToken(roster.patientA.token);
    expect(verified.sub).toBe(roster.patientA.id);
    expect(verified.role).toBe('PATIENT');

    const tampered = `${roster.patientA.token.slice(0, -6)}AAAAAA`;
    expect(() => tokenService.verifyAccessToken(tampered)).toThrow();

    const expired = jwt.sign(
      { sub: roster.patientA.id, role: 'PATIENT', email: roster.patientA.email },
      process.env.JWT_ACCESS_SECRET || 'healthbridge-india-dev-jwt-secret-key-min-32-chars!',
      { expiresIn: -10 }
    );
    expect(() => tokenService.verifyAccessToken(expired)).toThrow();
  });

  it('validates real PDF/PNG magic bytes and rejects spoofed executables disguised as PDFs', async () => {
    const pdfCheck = await fileSecurityService.validateUpload({
      fileName: 'synthetic-report.pdf',
      mimeType: 'application/pdf',
      fileData: `data:application/pdf;base64,${SYNTHETIC_FILES.validPdfBase64}`,
    });
    expect(pdfCheck.mimeType).toBe('application/pdf');
    expect(pdfCheck.signatureVerified).toBe(true);
    expect(pdfCheck.sha256Checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(pdfCheck.malwareScan.status).toBe('SCAN_NOT_CONFIGURED');

    await expect(
      fileSecurityService.validateUpload({
        fileName: 'malicious.pdf',
        mimeType: 'application/pdf',
        fileData: `data:application/pdf;base64,${SYNTHETIC_FILES.spoofedExecutableBase64}`,
      })
    ).rejects.toThrow();
  });

  it('maps all 9 canonical MedicalRecord types to valid NRCeS HL7 FHIR R4 DocumentReference profiles', () => {
    const payload = createSyntheticMedicalRecordPayload();
    const doc = {
      _id: new Types.ObjectId(),
      patientId: new Types.ObjectId(),
      recordType: payload.recordType,
      title: payload.title,
      recordDate: new Date(payload.recordDate),
      verificationStatus: 'VERIFIED',
      doctorName: payload.doctorName,
      facilityName: payload.facilityName,
      mimeType: payload.mimeType,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      source: 'MANUAL_ENTRY',
      updatedAt: new Date(),
    } as Parameters<typeof mapToFHIRDocumentReference>[0];

    const fhir = mapToFHIRDocumentReference(doc) as Record<string, any>;
    expect(fhir.resourceType).toBe('DocumentReference');
    expect(fhir.meta.profile[0]).toContain('nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentReference');
    expect(fhir.type.coding[0].system).toBe('http://loinc.org');
    expect(fhir.type.coding[0].code).toBe('11502-2');
    expect(fhir.docStatus).toBe('final');
    expect(fhir.subject.reference).toMatch(/^Patient\/[0-9a-f]{24}$/);
  });

  it('enforces synchronous fail-closed consent denial on missing, expired, or immediately revoked consents', async () => {
    const roster = createSyntheticActorRoster();
    const consentId = new Types.ObjectId().toString();

    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as any);
    vi.spyOn(ConsentRequestModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as any);

    // Self-access is always authorized
    const selfRes = await consentEnforcementService.validateAccess({
      requesterId: roster.patientA.id,
      requesterRole: 'PATIENT',
      patientId: roster.patientA.id,
      dataCategory: 'DIAGNOSTIC_REPORT',
    });
    expect(selfRes.authorized).toBe(true);

    // Unrelated doctor with no active consent fails closed
    const deniedRes = await consentEnforcementService.validateAccess({
      requesterId: roster.doctorB.id,
      requesterRole: 'DOCTOR',
      patientId: roster.patientA.id,
      dataCategory: 'DIAGNOSTIC_REPORT',
    });
    expect(deniedRes.authorized).toBe(false);

    // Immediate synchronous revocation blocks even if a stale replica returns an active artifact
    consentEnforcementService.invalidateConsentImmediately(
      roster.patientA.id,
      roster.doctorA.id,
      consentId
    );
    vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(consentId),
        status: 'ACTIVE',
        permittedDataTypes: ['DIAGNOSTIC_REPORT'],
        validityPeriod: {
          from: new Date(Date.now() - 60_000),
          to: new Date(Date.now() + 60_000),
        },
      }),
    } as any);

    const revokedRes = await consentEnforcementService.validateAccess({
      requesterId: roster.doctorA.id,
      requesterRole: 'DOCTOR',
      patientId: roster.patientA.id,
      dataCategory: 'DIAGNOSTIC_REPORT',
    });
    expect(revokedRes.authorized).toBe(false);
  });
});
