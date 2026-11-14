import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { ConsentRequestModel } from '../../src/modules/consent/models/consent-request.model';
import { ConsentArtifactModel } from '../../src/modules/consent/models/consent-artifact.model';
import { consentEnforcementService } from '../../src/modules/consent/services/consent-enforcement.service';
import { Types } from 'mongoose';

describe('Patient Consent Management & Access Control Integration Tests', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();

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

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorId,
    role: 'DOCTOR',
    email: 'doctor.verma@aiims.gov.in',
  } as any);

  beforeEach(() => {
    vi.restoreAllMocks();

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
      if (idStr === doctorId) {
        return Promise.resolve({
          _id: new Types.ObjectId(doctorId),
          role: 'DOCTOR',
          accountStatus: 'ACTIVE',
          email: 'doctor.verma@aiims.gov.in',
        } as any);
      }
      return Promise.resolve(null);
    }) as any);
  });

  describe('Authentication & Access Control', () => {
    it('should reject unauthenticated request to /api/v1/consent with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/consent');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should forbid DOCTOR role from accessing patient consent management routes with 403', async () => {
      const res = await request(app)
        .get('/api/v1/consent')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow PATIENT to query their consent records', async () => {
      const res = await request(app)
        .get('/api/v1/consent')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow PATIENT to query consent summary metrics', async () => {
      const res = await request(app)
        .get('/api/v1/consent/summary')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pendingRequests');
      expect(res.body.data).toHaveProperty('activePermissions');
      expect(res.body.data).toHaveProperty('expiringSoon');
      expect(res.body.data).toHaveProperty('revokedPermissions');
    });

    it('should allow PATIENT to query consent requests list', async () => {
      const res = await request(app)
        .get('/api/v1/consent/requests')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow PATIENT to query consent history timeline', async () => {
      const res = await request(app)
        .get('/api/v1/consent/history')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Cross-Patient Security & IDOR Isolation', () => {
    it('should forbid Patient B from viewing Patient A consent request (403 FORBIDDEN)', async () => {
      const patientAConsentId = '651111111111111111110001';

      vi.spyOn(ConsentRequestModel, 'findById').mockResolvedValueOnce({
        _id: new Types.ObjectId(patientAConsentId),
        patientId: new Types.ObjectId(patientAId),
        requesterId: new Types.ObjectId(doctorId),
        requesterName: 'Dr. Rajesh Verma',
        organization: 'AIIMS New Delhi',
        purpose: 'CAREMGT',
        requestedDataTypes: ['MEDICAL_RECORDS'],
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      const res = await request(app)
        .get(`/api/v1/consent/${patientAConsentId}`)
        .set('Authorization', `Bearer ${patientBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow Patient A to view their own consent request details', async () => {
      const consentId = '651111111111111111110002';

      vi.spyOn(ConsentRequestModel, 'findById').mockResolvedValueOnce({
        _id: new Types.ObjectId(consentId),
        patientId: new Types.ObjectId(patientAId),
        requesterId: new Types.ObjectId(doctorId),
        requesterName: 'Dr. Priya Sharma',
        organization: 'Max Healthcare',
        purpose: 'CAREMGT',
        requestedDataTypes: ['LAB_REPORTS'],
        dateRange: { from: new Date(), to: new Date(Date.now() + 86400000) },
        requestedAt: new Date(),
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      } as any);

      const res = await request(app)
        .get(`/api/v1/consent/${consentId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(consentId);
      expect(res.body.data.patientId).toBe(patientAId);
    });
  });

  describe('Approval, Rejection & Revocation Lifecycle', () => {
    it('should successfully approve a pending consent request and issue active artifact', async () => {
      const pendingConsentId = '651111111111111111110002';
      const mockSave = vi.fn().mockResolvedValue(true);

      const mockRequest = {
        _id: new Types.ObjectId(pendingConsentId),
        patientId: new Types.ObjectId(patientAId),
        requesterId: new Types.ObjectId(doctorId),
        requesterName: 'Dr. Priya Sharma',
        organization: 'Max Healthcare',
        purpose: 'CAREMGT',
        requestedDataTypes: ['LAB_REPORTS'],
        dateRange: { from: new Date(), to: new Date(Date.now() + 86400000) },
        requestedAt: new Date(),
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
        save: mockSave,
        isExpired: () => false,
      };

      vi.spyOn(ConsentRequestModel, 'findById')
        .mockResolvedValueOnce(mockRequest as any) // in approveConsent
        .mockResolvedValueOnce({ ...mockRequest, status: 'APPROVED', approvedAt: new Date() } as any); // in getPatientConsentById

      vi.spyOn(ConsentArtifactModel, 'findOneAndUpdate').mockResolvedValueOnce({} as any);

      const res = await request(app)
        .post(`/api/v1/consent/${pendingConsentId}/approve`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({ signature: 'PATIENT_A_DIGITAL_SIG' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('should reject approval of an already approved request with 400 Bad Request', async () => {
      const approvedConsentId = '651111111111111111110001';

      vi.spyOn(ConsentRequestModel, 'findById').mockResolvedValueOnce({
        _id: new Types.ObjectId(approvedConsentId),
        patientId: new Types.ObjectId(patientAId),
        requesterId: new Types.ObjectId(doctorId),
        status: 'APPROVED',
        expiresAt: new Date(Date.now() + 86400000),
        isExpired: () => false,
      } as any);

      const res = await request(app)
        .post(`/api/v1/consent/${approvedConsentId}/approve`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already been approved/i);
    });

    it('should successfully reject a pending consent request with optional reason', async () => {
      const pendingConsentId = '651111111111111111110002';
      const mockSave = vi.fn().mockResolvedValue(true);

      const mockRequest = {
        _id: new Types.ObjectId(pendingConsentId),
        patientId: new Types.ObjectId(patientAId),
        requesterId: new Types.ObjectId(doctorId),
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
        save: mockSave,
        isExpired: () => false,
      };

      vi.spyOn(ConsentRequestModel, 'findById')
        .mockResolvedValueOnce(mockRequest as any)
        .mockResolvedValueOnce({
          ...mockRequest,
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: 'Not currently seeking treatment',
        } as any);

      const res = await request(app)
        .post(`/api/v1/consent/${pendingConsentId}/reject`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({ reason: 'Not currently seeking treatment' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REJECTED');
    });

    it('should successfully revoke an active approved consent', async () => {
      const activeConsentId = '651111111111111111110001';
      const mockSave = vi.fn().mockResolvedValue(true);

      const mockRequest = {
        _id: new Types.ObjectId(activeConsentId),
        patientId: new Types.ObjectId(patientAId),
        requesterId: new Types.ObjectId(doctorId),
        status: 'APPROVED',
        expiresAt: new Date(Date.now() + 86400000),
        save: mockSave,
      };

      vi.spyOn(ConsentRequestModel, 'findById')
        .mockResolvedValueOnce(mockRequest as any)
        .mockResolvedValueOnce({
          ...mockRequest,
          status: 'REVOKED',
          revokedAt: new Date(),
          revocationReason: 'Consultation concluded',
        } as any);

      vi.spyOn(ConsentArtifactModel, 'updateMany').mockResolvedValueOnce({} as any);

      const res = await request(app)
        .post(`/api/v1/consent/${activeConsentId}/revoke`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({ reason: 'Consultation concluded' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REVOKED');
    });
  });

  describe('Centralized Backend Consent Enforcement', () => {
    it('should allow patient self-access without checking consent artifacts', async () => {
      const result = await consentEnforcementService.validateAccess({
        requesterId: patientAId,
        requesterRole: 'PATIENT',
        patientId: patientAId,
        dataCategory: 'MEDICAL_RECORDS',
      });

      expect(result.authorized).toBe(true);
    });

    it('should fail closed when doctor has no consent record for patient', async () => {
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
        sort: () => Promise.resolve(null),
      } as any);

      vi.spyOn(ConsentRequestModel, 'findOne').mockReturnValue({
        sort: () => Promise.resolve(null),
      } as any);

      const result = await consentEnforcementService.validateAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId: patientAId,
        dataCategory: 'MEDICAL_RECORDS',
      });

      expect(result.authorized).toBe(false);
      expect(result.reason).toMatch(/no consent/i);
    });

    it('should fail closed when doctor attempts to access patient data after consent is REVOKED', async () => {
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
        sort: () =>
          Promise.resolve({
            id: 'art-001',
            consentStatus: 'REVOKED',
            permittedDataTypes: ['MEDICAL_RECORDS'],
            validityPeriod: { from: new Date(), to: new Date(Date.now() + 86400000) },
          }),
      } as any);

      const result = await consentEnforcementService.validateAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId: patientAId,
        dataCategory: 'MEDICAL_RECORDS',
      });

      expect(result.authorized).toBe(false);
      expect(result.reason).toMatch(/revoked/i);
    });

    it('should fail closed when consent validity window has EXPIRED', async () => {
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
        sort: () =>
          Promise.resolve({
            id: 'art-002',
            consentStatus: 'ACTIVE',
            permittedDataTypes: ['MEDICAL_RECORDS'],
            validityPeriod: {
              from: new Date(Date.now() - 86400000 * 5),
              to: new Date(Date.now() - 86400000), // in the past
            },
          }),
      } as any);

      const result = await consentEnforcementService.validateAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId: patientAId,
        dataCategory: 'MEDICAL_RECORDS',
      });

      expect(result.authorized).toBe(false);
      expect(result.reason).toMatch(/expired/i);
    });

    it('should fail closed when requested category is not authorized in consent scope', async () => {
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
        sort: () =>
          Promise.resolve({
            id: 'art-003',
            consentStatus: 'ACTIVE',
            permittedDataTypes: ['LAB_REPORTS'], // only LAB_REPORTS, NOT MEDICAL_RECORDS
            validityPeriod: {
              from: new Date(Date.now() - 86400000),
              to: new Date(Date.now() + 86400000 * 10),
            },
          }),
      } as any);

      const result = await consentEnforcementService.validateAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId: patientAId,
        dataCategory: 'MEDICAL_RECORDS',
      });

      expect(result.authorized).toBe(false);
      expect(result.reason).toMatch(/does not authorize category/i);
    });

    it('should authorize access when active valid consent matches requested category', async () => {
      vi.spyOn(ConsentArtifactModel, 'findOne').mockReturnValue({
        sort: () =>
          Promise.resolve({
            id: 'art-004',
            consentStatus: 'ACTIVE',
            permittedDataTypes: ['MEDICAL_RECORDS', 'PRESCRIPTIONS'],
            validityPeriod: {
              from: new Date(Date.now() - 86400000),
              to: new Date(Date.now() + 86400000 * 30),
            },
            purpose: 'CAREMGT',
          }),
      } as any);

      const result = await consentEnforcementService.validateAccess({
        requesterId: doctorId,
        requesterRole: 'DOCTOR',
        patientId: patientAId,
        dataCategory: 'MEDICAL_RECORDS',
      });

      expect(result.authorized).toBe(true);
      expect(result.consentArtifactId).toBe('art-004');
    });
  });
});
