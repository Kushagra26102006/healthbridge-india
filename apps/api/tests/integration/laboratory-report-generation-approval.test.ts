import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  LaboratoryProfileModel,
  LaboratoryOrderModel,
  LabSampleModel,
  LaboratoryReportModel,
  TestResultModel,
  LabReportVersionModel,
  AuditLogModel,
} from '../../src/database/models';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { Types } from 'mongoose';

describe('Laboratory Report Generation, Review, Approval, Publication & Secure Access (Day 6 Task 04)', () => {
  const app = createApp();

  const labAUserId = new Types.ObjectId().toString();
  const labBUserId = new Types.ObjectId().toString();
  const pathologistUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const unauthorizedDoctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const otherPatientUserId = new Types.ObjectId().toString();
  const pharmacyUserId = new Types.ObjectId().toString();

  const labAToken = tokenService.generateAccessToken({
    _id: labAUserId,
    role: 'LABORATORY',
    email: 'pathology@healthbridge-labs.in',
  } as any);

  const labBToken = tokenService.generateAccessToken({
    _id: labBUserId,
    role: 'LABORATORY',
    email: 'metropolis@diagnostic-labs.in',
  } as any);

  const pathologistToken = tokenService.generateAccessToken({
    _id: pathologistUserId,
    role: 'LABORATORY',
    email: 'chief.pathologist@healthbridge-labs.in',
  } as any);

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.sharma@healthbridge.in',
  } as any);

  const unauthorizedDoctorToken = tokenService.generateAccessToken({
    _id: unauthorizedDoctorUserId,
    role: 'DOCTOR',
    email: 'dr.unauthorized@hospital.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.aarav@healthbridge.in',
  } as any);

  const otherPatientToken = tokenService.generateAccessToken({
    _id: otherPatientUserId,
    role: 'PATIENT',
    email: 'other.patient@healthbridge.in',
  } as any);

  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'apollo.cp@healthbridge.in',
  } as any);

  const mockUsers: Record<string, any> = {
    [labAUserId]: {
      _id: new Types.ObjectId(labAUserId),
      id: labAUserId,
      name: 'HealthBridge Central Lab - Tech Staff',
      email: 'pathology@healthbridge-labs.in',
      phone: '9811223344',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
    },
    [labBUserId]: {
      _id: new Types.ObjectId(labBUserId),
      id: labBUserId,
      name: 'Metropolis Diagnostic Centre',
      email: 'metropolis@diagnostic-labs.in',
      phone: '9811225566',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
    },
    [pathologistUserId]: {
      _id: new Types.ObjectId(pathologistUserId),
      id: pathologistUserId,
      name: 'Dr. Anand Verma (Chief Pathologist)',
      email: 'chief.pathologist@healthbridge-labs.in',
      phone: '9811227788',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
      isSupervisor: true,
    },
    [doctorUserId]: {
      _id: new Types.ObjectId(doctorUserId),
      id: doctorUserId,
      name: 'Dr. Vikram Sharma',
      email: 'dr.sharma@healthbridge.in',
      phone: '9811001122',
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
    },
    [unauthorizedDoctorUserId]: {
      _id: new Types.ObjectId(unauthorizedDoctorUserId),
      id: unauthorizedDoctorUserId,
      name: 'Dr. Ananya Ray',
      email: 'dr.unauthorized@hospital.in',
      phone: '9811003344',
      role: 'DOCTOR',
      accountStatus: 'ACTIVE',
    },
    [patientUserId]: {
      _id: new Types.ObjectId(patientUserId),
      id: patientUserId,
      name: 'Aarav Patel',
      email: 'patient.aarav@healthbridge.in',
      phone: '9811998877',
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      gender: 'MALE',
      dateOfBirth: '1990-05-15',
    },
    [otherPatientUserId]: {
      _id: new Types.ObjectId(otherPatientUserId),
      id: otherPatientUserId,
      name: 'Meera Deshmukh',
      email: 'other.patient@healthbridge.in',
      phone: '9811991122',
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
    },
    [pharmacyUserId]: {
      _id: new Types.ObjectId(pharmacyUserId),
      id: pharmacyUserId,
      name: 'Apollo Pharmacy',
      email: 'apollo.cp@healthbridge.in',
      role: 'PHARMACY',
      accountStatus: 'ACTIVE',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) => {
      const idStr = id?.toString();
      const user = mockUsers[idStr];
      return {
        lean: vi.fn().mockResolvedValue(user || null),
        exec: vi.fn().mockResolvedValue(user || null),
        then: (resolve: any) => resolve(user || null),
      } as any;
    });

    vi.spyOn(LaboratoryProfileModel, 'findOne').mockImplementation((query: any) => {
      const ownerIdStr = query.userId?.toString();
      if (ownerIdStr === labAUserId || ownerIdStr === pathologistUserId) {
        return Promise.resolve({
          _id: new Types.ObjectId(labAUserId),
          userId: new Types.ObjectId(labAUserId),
          labName: 'HealthBridge Central Diagnostic Lab',
          nablAccreditationNumber: 'NABL-MC-9941',
          isActive: true,
        }) as any;
      }
      return Promise.resolve(null) as any;
    });

    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);
  });

  describe('1. Laboratory Test Result Recording & Draft Generation', () => {
    it('records structured test result parameters with abnormal and critical flags', async () => {
      const orderId = new Types.ObjectId();
      const mockOrder = {
        _id: orderId,
        orderNumber: 'LBO-2026-9001',
        laboratoryId: new Types.ObjectId(labAUserId),
        patientId: new Types.ObjectId(patientUserId),
        orderedBy: new Types.ObjectId(doctorUserId),
        status: 'IN_PROGRESS',
      };

      vi.spyOn(LaboratoryOrderModel, 'findById').mockResolvedValue(mockOrder as any);

      const mockSavedResult = {
        _id: new Types.ObjectId(),
        orderId,
        testCode: 'CBC',
        testName: 'Complete Blood Count',
        overallFlag: 'HIGH',
        hasAbnormalResults: true,
        hasCriticalResults: false,
        status: 'COMPLETED',
        enteredById: new Types.ObjectId(labAUserId),
        parameters: [
          {
            parameterCode: 'HB',
            parameterName: 'Hemoglobin',
            numericValue: 18.5,
            unit: 'g/dL',
            flag: 'HIGH',
            isAbnormal: true,
            isCritical: false,
          },
        ],
      };

      vi.spyOn(TestResultModel, 'findOneAndUpdate').mockResolvedValue(mockSavedResult as any);

      const res = await request(app)
        .post('/api/v1/laboratory/reports/test-results')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          orderId: orderId.toString(),
          testCode: 'CBC',
          testName: 'Complete Blood Count',
          parameters: [
            {
              parameterCode: 'HB',
              parameterName: 'Hemoglobin',
              numericValue: 18.5,
              unit: 'g/dL',
              referenceRangeSnapshot: { normalMin: 13.0, normalMax: 17.0, criticalHigh: 20.0, unit: 'g/dL' },
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.testCode).toBe('CBC');
      expect(res.body.data.hasAbnormalResults).toBe(true);
    });

    it('rejects report draft generation if order does not exist', async () => {
      vi.spyOn(LaboratoryOrderModel, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/laboratory/reports/draft')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({ orderId: new Types.ObjectId().toString() });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Laboratory order not found');
    });

    it('rejects report draft generation if an associated specimen was rejected', async () => {
      const orderId = new Types.ObjectId();
      vi.spyOn(LaboratoryOrderModel, 'findById').mockResolvedValue({
        _id: orderId,
        orderNumber: 'LBO-2026-9002',
        laboratoryId: new Types.ObjectId(labAUserId),
        status: 'IN_PROGRESS',
      } as any);

      vi.spyOn(LabSampleModel, 'find').mockResolvedValue([
        {
          sampleNumber: 'SMP-9002',
          status: 'REJECTED',
          rejectionReason: 'Specimen hemolyzed during transit',
        },
      ] as any);

      const res = await request(app)
        .post('/api/v1/laboratory/reports/draft')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({ orderId: orderId.toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('rejected');
    });

    it('rejects report draft generation if no completed test results exist', async () => {
      const orderId = new Types.ObjectId();
      vi.spyOn(LaboratoryOrderModel, 'findById').mockResolvedValue({
        _id: orderId,
        orderNumber: 'LBO-2026-9003',
        laboratoryId: new Types.ObjectId(labAUserId),
        status: 'IN_PROGRESS',
      } as any);

      vi.spyOn(LabSampleModel, 'find').mockResolvedValue([
        { sampleNumber: 'SMP-9003', status: 'ACCESSIONED' },
      ] as any);

      vi.spyOn(TestResultModel, 'find').mockResolvedValue([]);

      const res = await request(app)
        .post('/api/v1/laboratory/reports/draft')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({ orderId: orderId.toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No completed test results found');
    });

    it('successfully creates report draft from persisted results', async () => {
      const orderId = new Types.ObjectId();
      const mockOrder = {
        _id: orderId,
        orderNumber: 'LBO-2026-9004',
        laboratoryId: new Types.ObjectId(labAUserId),
        patientId: new Types.ObjectId(patientUserId),
        orderedBy: new Types.ObjectId(doctorUserId),
        status: 'IN_PROGRESS',
        tests: [{ testCode: 'CBC', testName: 'Complete Blood Count', category: 'HEMATOLOGY' }],
      };

      vi.spyOn(LaboratoryOrderModel, 'findById').mockResolvedValue(mockOrder as any);
      vi.spyOn(LabSampleModel, 'find').mockResolvedValue([{ sampleNumber: 'SMP-9004', status: 'ACCESSIONED' }] as any);
      vi.spyOn(TestResultModel, 'find').mockResolvedValue([
        {
          testCode: 'CBC',
          testName: 'Complete Blood Count',
          parameters: [
            {
              parameterCode: 'HB',
              parameterName: 'Hemoglobin',
              numericValue: 14.5,
              unit: 'g/dL',
              referenceRangeSnapshot: { normalMin: 13.0, normalMax: 17.0 },
              flag: 'NORMAL',
            },
          ],
        },
      ] as any);

      vi.spyOn(LaboratoryReportModel, 'findOne').mockResolvedValue(null);

      const createdReport = {
        _id: new Types.ObjectId(),
        reportNumber: 'LBR-2026-1004',
        patientId: mockOrder.patientId,
        laboratoryId: mockOrder.laboratoryId,
        orderId,
        doctorId: mockOrder.orderedBy,
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        status: 'DRAFT',
        currentVersion: 1,
        observations: [
          {
            parameterCode: 'HB',
            testName: 'Complete Blood Count - Hemoglobin',
            value: '14.5',
            unit: 'g/dL',
            referenceRange: '13.0 - 17.0',
            interpretation: 'NORMAL',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(LaboratoryReportModel, 'create').mockResolvedValue(createdReport as any);
      vi.spyOn(LaboratoryOrderModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/laboratory/reports/draft')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          orderId: orderId.toString(),
          clinicalNotes: 'Routine wellness panel',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.currentVersion).toBe(1);
      expect(res.body.data.observations.length).toBe(1);
    });
  });

  describe('2. Review Workspace & Separation of Duties', () => {
    it('allows submitting draft report for review', async () => {
      const reportId = new Types.ObjectId();
      const mockReport = {
        _id: reportId,
        reportNumber: 'LBR-2026-1005',
        status: 'DRAFT',
        createdAt: new Date(),
        testDate: new Date(),
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        observations: [],
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(LaboratoryReportModel, 'findById').mockResolvedValue(mockReport as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/submit-review`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({ notes: 'Ready for senior pathologist review' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockReport.status).toBe('PENDING_REVIEW');
    });

    it('enforces separation of duties: technician who entered results cannot self-approve without supervisor delegation', async () => {
      const reportId = new Types.ObjectId();
      const orderId = new Types.ObjectId();

      const mockReport = {
        _id: reportId,
        orderId,
        reportNumber: 'LBR-2026-1006',
        status: 'PENDING_REVIEW',
        createdAt: new Date(),
        testDate: new Date(),
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        observations: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(LaboratoryReportModel, 'findById').mockResolvedValue(mockReport as any);
      // Mock that technician labA entered results for this order
      vi.spyOn(TestResultModel, 'exists').mockResolvedValue(true as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/review`)
        .set('Authorization', `Bearer ${labAToken}`) // labAToken is the technician who entered results
        .send({
          decision: 'APPROVED',
          comments: 'Self-approval attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Separation of duties violation');
    });

    it('allows independent pathologist supervisor to review and approve report', async () => {
      const reportId = new Types.ObjectId();
      const orderId = new Types.ObjectId();

      const mockReport = {
        _id: reportId,
        orderId,
        reportNumber: 'LBR-2026-1007',
        status: 'PENDING_REVIEW',
        patientId: new Types.ObjectId(patientUserId),
        laboratoryId: new Types.ObjectId(labAUserId),
        doctorId: new Types.ObjectId(doctorUserId),
        testName: 'Lipid Profile',
        category: 'BIOCHEMISTRY',
        observations: [],
        currentVersion: 1,
        createdAt: new Date(),
        testDate: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(LaboratoryReportModel, 'findById').mockResolvedValue(mockReport as any);
      // Chief pathologist did NOT enter the results
      vi.spyOn(TestResultModel, 'exists').mockResolvedValue(false as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/review`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          decision: 'APPROVED',
          comments: 'Parameters clinically coherent. Formally approved.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockReport.status).toBe('APPROVED');
      expect(mockReport.verificationStatus).toBe('VERIFIED');
    });

    it('enforces mandatory comments when rejecting or requesting correction', async () => {
      const reportId = new Types.ObjectId();
      const mockReport = {
        _id: reportId,
        status: 'PENDING_REVIEW',
        createdAt: new Date(),
        testDate: new Date(),
        testName: 'Lipid Profile',
        category: 'BIOCHEMISTRY',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(LaboratoryReportModel, 'findById').mockResolvedValue(mockReport as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/review`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          decision: 'REJECTED',
          comments: 'No', // Too short
        });

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('3. Report Publication, Cryptographic Seal & Idempotency', () => {
    it('rejects publishing an unapproved report', async () => {
      const reportId = new Types.ObjectId();
      const mockReport = {
        _id: reportId,
        status: 'PENDING_REVIEW', // Not approved
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/publish`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({ publicationNotes: 'Immediate release' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only APPROVED reports can be published');
    });

    it('successfully publishes approved report with cryptographic document hash and privacy-safe notifications', async () => {
      const reportId = new Types.ObjectId();
      const orderId = new Types.ObjectId();

      const mockReport: any = {
        _id: reportId,
        reportNumber: 'LBR-2026-2001',
        orderId,
        patientId: {
          _id: new Types.ObjectId(patientUserId),
          name: 'Aarav Patel',
          abhaId: 'aarav.patel@abdm',
        },
        doctorId: {
          _id: new Types.ObjectId(doctorUserId),
          name: 'Dr. Vikram Sharma',
        },
        laboratoryId: {
          _id: new Types.ObjectId(labAUserId),
          name: 'HealthBridge Central Lab',
          address: 'Sector 18, New Delhi',
        },
        testName: 'Lipid Profile',
        category: 'BIOCHEMISTRY',
        status: 'APPROVED',
        currentVersion: 1,
        createdAt: new Date(),
        testDate: new Date(),
        approvalDetails: {
          approvedById: new Types.ObjectId(pathologistUserId),
          approvedByName: 'Dr. Anand Verma',
        },
        observations: [
          {
            testName: 'Total Cholesterol',
            value: '190',
            unit: 'mg/dL',
            referenceRange: '< 200',
            interpretation: 'NORMAL',
          },
        ],
        save: vi.fn().mockResolvedValue(true),
        toObject: vi.fn().mockReturnValue({ reportNumber: 'LBR-2026-2001' }),
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);
      vi.spyOn(LabReportVersionModel, 'findOneAndUpdate').mockResolvedValue({} as any);
      vi.spyOn(LaboratoryOrderModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/publish`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({ publicationNotes: 'Formal NABL diagnostic publication' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockReport.status).toBe('PUBLISHED');
      expect(mockReport.documentHash).toBeDefined();
      expect(mockReport.signatureMetadata.verificationStatus).toBe('VERIFIED_INTERNAL');

      // Verify privacy-safe notifications were dispatched to patient and doctor
      expect(notificationService.publishEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Report Amendments and Version Ledger (v1 -> v2)', () => {
    it('rejects amendment on a draft report', async () => {
      const reportId = new Types.ObjectId();
      vi.spyOn(LaboratoryReportModel, 'findById').mockResolvedValue({
        _id: reportId,
        status: 'DRAFT',
      } as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/amend`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          amendmentReason: 'Analyzer recalibration adjustment',
          explanation: 'Secondary validation run revealed +5% bias in hematocrit computation.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Only published or previously amended reports');
    });

    it('archives v1 snapshot, increments version to v2, and reverts status to DRAFT for mandatory re-review', async () => {
      const reportId = new Types.ObjectId();
      const mockPublishedReport: any = {
        _id: reportId,
        reportNumber: 'LBR-2026-3001',
        status: 'PUBLISHED',
        currentVersion: 1,
        documentHash: 'abc123hash',
        patientId: new Types.ObjectId(patientUserId),
        laboratoryId: new Types.ObjectId(labAUserId),
        testName: 'Lipid Profile',
        category: 'BIOCHEMISTRY',
        observations: [],
        createdAt: new Date(),
        testDate: new Date(),
        clinicalNotes: 'Initial publication notes',
        save: vi.fn().mockResolvedValue(true),
        toObject: vi.fn().mockReturnValue({ reportNumber: 'LBR-2026-3001', version: 1 }),
      };

      vi.spyOn(LaboratoryReportModel, 'findById').mockResolvedValue(mockPublishedReport as any);
      vi.spyOn(LabReportVersionModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(LabReportVersionModel, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/amend`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          amendmentReason: 'Pre-analytical correction of patient gender reference bracket',
          explanation: 'Patient reference range adjusted following clinical encounter review.',
          changedResultCodes: ['CHOL'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockPublishedReport.currentVersion).toBe(2);
      expect(mockPublishedReport.status).toBe('DRAFT');
      expect(mockPublishedReport.amendmentDetails.isAmended).toBe(true);
      expect(mockPublishedReport.amendmentDetails.supersededVersion).toBe(1);
    });

    it('returns immutable version history ledger', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        id: reportId.toString(),
        reportNumber: 'LBR-2026-3001',
        laboratoryId: new Types.ObjectId(labAUserId),
        patientId: new Types.ObjectId(patientUserId),
        doctorId: new Types.ObjectId(doctorUserId),
        testName: 'Lipid Profile',
        category: 'BIOCHEMISTRY',
        observations: [],
        createdAt: new Date(),
        testDate: new Date(),
        status: 'PUBLISHED',
        currentVersion: 2,
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const mockVersions = [
        {
          _id: new Types.ObjectId(),
          reportId,
          reportNumber: 'LBR-2026-3001',
          version: 1,
          status: 'PUBLISHED',
          contentSnapshot: {},
          documentHash: 'hash-v1',
          createdBy: new Types.ObjectId(pathologistUserId),
          createdAt: new Date('2026-11-10T10:00:00Z'),
        },
        {
          _id: new Types.ObjectId(),
          reportId,
          reportNumber: 'LBR-2026-3001',
          version: 2,
          status: 'AMENDED',
          contentSnapshot: {},
          documentHash: 'hash-v2',
          createdBy: new Types.ObjectId(pathologistUserId),
          createdAt: new Date('2026-11-11T12:00:00Z'),
          amendmentReason: 'Reference range correction',
        },
      ];

      vi.spyOn(LabReportVersionModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockVersions),
      } as any);

      const res = await request(app)
        .get(`/api/v1/laboratory/reports/${reportId}/versions`)
        .set('Authorization', `Bearer ${pathologistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].version).toBe(1);
      expect(res.body.data[1].version).toBe(2);
    });
  });

  describe('5. Multi-Role RBAC & Secure Document Access', () => {
    it('prevents Patient from accessing DRAFT or unpublished reports', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        patientId: new Types.ObjectId(patientUserId),
        status: 'DRAFT', // Drafts must be invisible to patients!
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${reportId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Draft or unpublished laboratory reports are not accessible');
    });

    it('allows Patient to view their own PUBLISHED report', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        id: reportId.toString(),
        reportNumber: 'LBR-2026-4001',
        patientId: new Types.ObjectId(patientUserId),
        laboratoryId: new Types.ObjectId(labAUserId),
        status: 'PUBLISHED',
        currentVersion: 1,
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        observations: [],
        createdAt: new Date(),
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${reportId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportNumber).toBe('LBR-2026-4001');
    });

    it('rejects Patient attempting to view another patient report', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        patientId: new Types.ObjectId(otherPatientUserId), // Belongs to Meera
        status: 'PUBLISHED',
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${reportId}`)
        .set('Authorization', `Bearer ${patientToken}`); // Aarav trying to view Meera's report

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('rejects unauthorized Doctor without clinical relationship', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        doctorId: new Types.ObjectId(doctorUserId), // Ordered by Dr. Vikram Sharma
        patientId: new Types.ObjectId(patientUserId),
        status: 'PUBLISHED',
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${reportId}`)
        .set('Authorization', `Bearer ${unauthorizedDoctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('enforces tenant isolation: Laboratory B cannot access Laboratory A reports', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        laboratoryId: new Types.ObjectId(labAUserId), // Issued by Lab A
        patientId: new Types.ObjectId(patientUserId),
        status: 'PUBLISHED',
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const res = await request(app)
        .get(`/api/v1/laboratory/reports/${reportId}`)
        .set('Authorization', `Bearer ${labBToken}`); // Lab B attempting access

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('You do not belong to the issuing laboratory');
    });

    it('blocks Pharmacy role from accessing laboratory clinical reports', async () => {
      const reportId = new Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/laboratory/reports/${reportId}`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('6. PDF Report Delivery & HL7 FHIR R4 Bundle Mapping', () => {
    it('streams valid PDF with SHA-256 integrity header', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        id: reportId.toString(),
        reportNumber: 'LBR-2026-5001',
        patientId: new Types.ObjectId(patientUserId),
        patientName: 'Aarav Patel',
        laboratoryId: new Types.ObjectId(labAUserId),
        laboratoryName: 'HealthBridge Central Lab',
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        status: 'PUBLISHED',
        currentVersion: 1,
        observations: [
          {
            testName: 'Hemoglobin',
            value: '14.2',
            unit: 'g/dL',
            referenceRange: '13.0 - 17.0',
            flag: 'NORMAL',
          },
        ],
        createdAt: new Date(),
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${reportId}/download`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['x-document-sha256']).toBeDefined();
      expect(res.body).toBeInstanceOf(Buffer);
    });

    it('generates standard HL7 FHIR R4 DiagnosticReport Bundle', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        id: reportId.toString(),
        reportNumber: 'LBR-2026-6001',
        patientId: new Types.ObjectId(patientUserId),
        patientName: 'Aarav Patel',
        laboratoryId: new Types.ObjectId(labAUserId),
        laboratoryName: 'HealthBridge Central Lab',
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        status: 'PUBLISHED',
        currentVersion: 1,
        observations: [
          {
            parameterCode: 'HB',
            testName: 'Hemoglobin',
            value: '14.0',
            numericValue: 14.0,
            unit: 'g/dL',
            referenceRange: '13.0 - 17.0',
            flag: 'NORMAL',
          },
        ],
        createdAt: new Date(),
      };

      const populateChain: any = {
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      };
      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue(populateChain);

      const res = await request(app)
        .get(`/api/v1/lab-reports/${reportId}/fhir`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resourceType).toBe('Bundle');
      expect(res.body.data.type).toBe('document');

      const diagReport = res.body.data.entry.find(
        (e: any) => e.resource.resourceType === 'DiagnosticReport'
      )?.resource;
      expect(diagReport).toBeDefined();
      expect(diagReport.status).toBe('final');

      const obsResource = res.body.data.entry.find(
        (e: any) => e.resource.resourceType === 'Observation'
      )?.resource;
      expect(obsResource).toBeDefined();
      expect(obsResource.valueQuantity.value).toBe(14.0);
    });
  });
});
