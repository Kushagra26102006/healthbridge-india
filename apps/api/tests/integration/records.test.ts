import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { MedicalRecordModel } from '../../src/modules/healthcare/models/medical-record.model';
import { Types } from 'mongoose';

describe('Patient Health Records API & Security Isolation Integration Tests', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();

  const patientAToken = tokenService.generateAccessToken({
    _id: patientAId,
    role: 'PATIENT',
    email: 'patient.a@healthbridge.in',
  } as any);

  const patientBToken = tokenService.generateAccessToken({
    _id: patientBId,
    role: 'PATIENT',
    email: 'patient.b@healthbridge.in',
  } as any);

  const recordOfPatientBId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock UserModel for authentication token validation
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === patientAId) {
        return Promise.resolve({
          _id: new Types.ObjectId(patientAId),
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          email: 'patient.a@healthbridge.in',
        } as any);
      }
      if (idStr === patientBId) {
        return Promise.resolve({
          _id: new Types.ObjectId(patientBId),
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          email: 'patient.b@healthbridge.in',
        } as any);
      }
      return Promise.resolve(null);
    }) as any);
  });

  describe('Authentication & Access Control', () => {
    it('should reject unauthenticated request to /api/v1/records with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/records');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should allow authenticated patient to query records list', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
    });

    it('should allow authenticated patient to get summary metric counts', async () => {
      const res = await request(app)
        .get('/api/v1/records/summary')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalRecords');
      expect(res.body.data).toHaveProperty('clinicalDocuments');
      expect(res.body.data).toHaveProperty('prescriptions');
      expect(res.body.data).toHaveProperty('labReports');
    });
  });

  describe('Patient Privacy & Cross-Patient Data Isolation', () => {
    it("should strictly forbid Patient A from accessing Patient B's medical record (403 FORBIDDEN)", async () => {
      // Mock MedicalRecordModel.findById to return Patient B's record
      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(recordOfPatientBId),
        patientId: new Types.ObjectId(patientBId), // Belongs to Patient B!
        recordType: 'OP_CONSULTATION',
        title: 'Sensitive Psychiatric Consultation Note',
        description: 'Highly confidential clinical notes.',
        source: 'MANUAL_ENTRY',
        recordDate: new Date(),
        verificationStatus: 'VERIFIED',
        createdBy: new Types.ObjectId(patientBId),
      } as any);

      // Patient A attempts to view Patient B's record
      const res = await request(app)
        .get(`/api/v1/records/${recordOfPatientBId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toContain('Access denied');
    });

    it("should strictly forbid Patient A from downloading Patient B's medical document (403 FORBIDDEN)", async () => {
      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(recordOfPatientBId),
        patientId: new Types.ObjectId(patientBId), // Belongs to Patient B
        recordType: 'DIAGNOSTIC_REPORT',
        title: 'Confidential Pathology Report',
        fileName: 'biopsy_report.pdf',
        mimeType: 'application/pdf',
        fileData: Buffer.from('Confidential report content').toString('base64'),
        recordDate: new Date(),
        verificationStatus: 'VERIFIED',
        createdBy: new Types.ObjectId(patientBId),
      } as any);

      // Patient A attempts to download Patient B's file
      const res = await request(app)
        .get(`/api/v1/records/${recordOfPatientBId}/download`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid MongoDB ObjectId in recordId route parameter with 422 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/v1/records/invalid-not-an-id')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('FHIR R4 Compatibility & Detail Retrieval', () => {
    it('should allow Patient A to view their own record and include HL7 FHIR DocumentReference mapping', async () => {
      const ownRecordId = new Types.ObjectId().toString();

      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(ownRecordId),
        patientId: new Types.ObjectId(patientAId),
        recordType: 'OP_CONSULTATION',
        title: 'Routine Health Checkup',
        description: 'Vitals stable. BP 120/80.',
        source: 'MANUAL_ENTRY',
        resourceReference: 'HIE-CM-REC-TEST01',
        recordDate: new Date('2026-10-15T10:00:00Z'),
        doctorName: 'Dr. Ramesh Sharma',
        facilityName: 'City Healthcare Clinic',
        verificationStatus: 'VERIFIED',
        createdBy: new Types.ObjectId(patientAId),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .get(`/api/v1/records/${ownRecordId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(ownRecordId);
      expect(res.body.data.title).toBe('Routine Health Checkup');

      // Verify FHIR R4 DocumentReference compatibility mapping
      expect(res.body.data).toHaveProperty('fhirResource');
      const fhir = res.body.data.fhirResource;
      expect(fhir.resourceType).toBe('DocumentReference');
      expect(fhir.status).toBe('current');
      expect(fhir.docStatus).toBe('final');
      expect(fhir.subject.reference).toBe(`Patient/${patientAId}`);
      expect(fhir.author[0].display).toBe('Dr. Ramesh Sharma');
    });

    it('should allow Patient A to download authorized document stream', async () => {
      const ownRecordId = new Types.ObjectId().toString();

      vi.spyOn(MedicalRecordModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(ownRecordId),
        patientId: new Types.ObjectId(patientAId),
        recordType: 'OP_CONSULTATION',
        title: 'Routine Health Checkup',
        fileName: 'routine_checkup.pdf',
        mimeType: 'application/pdf',
        fileData: Buffer.from('SAMPLE MEDICAL REPORT CONTENT').toString('base64'),
        recordDate: new Date(),
        verificationStatus: 'VERIFIED',
        createdBy: new Types.ObjectId(patientAId),
      } as any);

      const res = await request(app)
        .get(`/api/v1/records/${ownRecordId}/download`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['cache-control']).toContain('no-store');
      const bodyContent = res.text || (res.body ? res.body.toString('utf-8') : '');
      expect(bodyContent).toContain('SAMPLE MEDICAL REPORT CONTENT');
    });
  });

  describe('Record Creation & Upload Validation', () => {
    it('should create a valid patient record and automatically bind ownership to req.user.userId', async () => {
      const validPayload = {
        title: 'Self-Monitored Blood Pressure Log',
        recordType: 'WELLNESS_RECORD',
        recordDate: '2026-11-10T09:00:00Z',
        description: 'Morning systolic 124, diastolic 82.',
        doctorName: 'Self Recorded',
        facilityName: 'Home Health Monitoring',
      };

      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patientId).toBe(patientAId);
      expect(res.body.data.verificationStatus).toBe('SELF_SUBMITTED');
      expect(res.body.data.source).toBe('MANUAL_ENTRY');
      expect(res.body.data.title).toBe(validPayload.title);
    });

    it('should reject record creation when title is too short (<3 chars)', async () => {
      const invalidPayload = {
        title: 'AB',
        recordType: 'WELLNESS_RECORD',
        recordDate: '2026-11-10',
      };

      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject record creation when file size exceeds 10MB limit', async () => {
      const oversizedPayload = {
        title: 'Large MRI Scan Archive',
        recordType: 'DIAGNOSTIC_REPORT',
        recordDate: '2026-11-10',
        fileSize: 15 * 1024 * 1024, // 15MB > 10MB
        mimeType: 'application/pdf',
      };

      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(oversizedPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject record creation when mime type is unsupported (e.g. text/html or exe)', async () => {
      const unsupportedMimePayload = {
        title: 'Potentially malicious file',
        recordType: 'DIAGNOSTIC_REPORT',
        recordDate: '2026-11-10',
        mimeType: 'application/x-msdownload',
      };

      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(unsupportedMimePayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });
});
