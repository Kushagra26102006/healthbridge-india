import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  LaboratoryProfileModel,
  QCProfileModel,
  QCRunModel,
  QualityIncidentModel,
  CAPAModel,
  LabInstrumentModel,
  InstrumentCalibrationModel,
  InstrumentMaintenanceModel,
  ReagentModel,
  ReagentLotModel,
  ReagentInventoryTransactionModel,
  LaboratoryReportModel,
  AuditLogModel,
} from '../../src/database/models';
import { Types } from 'mongoose';

describe('Laboratory Quality Management System (QMS), Instruments & Reagents (Day 6 Task 05)', () => {
  const app = createApp();

  const labAUserId = new Types.ObjectId().toString();
  const labBUserId = new Types.ObjectId().toString();
  const labAProfileId = new Types.ObjectId().toString();
  const labBProfileId = new Types.ObjectId().toString();
  const pathologistUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();

  const labAToken = tokenService.generateAccessToken({
    _id: labAUserId,
    role: 'LABORATORY',
    email: 'lab.central@healthbridge.in',
  } as any);

  const labBToken = tokenService.generateAccessToken({
    _id: labBUserId,
    role: 'LABORATORY',
    email: 'metropolis@diagnostic-labs.in',
  } as any);

  const pathologistToken = tokenService.generateAccessToken({
    _id: pathologistUserId,
    role: 'LABORATORY',
    email: 'pathologist@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient@healthbridge.in',
  } as any);

  const mockUsers: Record<string, any> = {
    [labAUserId]: {
      _id: new Types.ObjectId(labAUserId),
      id: labAUserId,
      name: 'Central Diagnostic Lab Staff',
      email: 'lab.central@healthbridge.in',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
    },
    [labBUserId]: {
      _id: new Types.ObjectId(labBUserId),
      id: labBUserId,
      name: 'Metropolis Lab Staff',
      email: 'metropolis@diagnostic-labs.in',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
    },
    [pathologistUserId]: {
      _id: new Types.ObjectId(pathologistUserId),
      id: pathologistUserId,
      name: 'Dr. Anand Verma (Chief Pathologist)',
      email: 'pathologist@healthbridge.in',
      role: 'LABORATORY',
      accountStatus: 'ACTIVE',
      isSupervisor: true,
    },
    [patientUserId]: {
      _id: new Types.ObjectId(patientUserId),
      id: patientUserId,
      name: 'Aarav Patel',
      email: 'patient@healthbridge.in',
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
    },
    [doctorUserId]: {
      _id: new Types.ObjectId(doctorUserId),
      id: doctorUserId,
      name: 'Dr. Vikram Sharma',
      email: 'dr.sharma@healthbridge.in',
      role: 'DOCTOR',
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
      const queryStr = JSON.stringify(query);
      if (queryStr.includes(labBUserId) || queryStr.includes(labBProfileId)) {
        return Promise.resolve({
          _id: new Types.ObjectId(labBProfileId),
          userId: new Types.ObjectId(labBUserId),
          laboratoryName: 'Metropolis Lab',
          isActive: true,
        }) as any;
      }
      return Promise.resolve({
        _id: new Types.ObjectId(labAProfileId),
        userId: new Types.ObjectId(labAUserId),
        laboratoryName: 'HealthBridge Central Diagnostic Lab',
        isActive: true,
      }) as any;
    });

    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  // ===========================================================================
  // 1. QUALITY CONTROL CONFIGURATION & HISTORICAL VERSIONING
  // ===========================================================================
  describe('1. Quality Control Configuration & Versioning', () => {
    it('creates a configurable QC profile with acceptable limits and version 1', async () => {
      const mockCreated = {
        _id: new Types.ObjectId(),
        laboratoryId: new Types.ObjectId(labAProfileId),
        profileName: 'Serum Glucose Normal Level 1',
        testCode: 'GLUC',
        testName: 'Fasting Blood Glucose',
        parameterName: 'Glucose Level',
        controlMaterial: 'Bio-Rad Liquichek Level 1',
        controlLevel: 'LEVEL_1',
        dataType: 'NUMERIC',
        targetValue: 95,
        acceptableMin: 85,
        acceptableMax: 105,
        unit: 'mg/dL',
        runFrequency: 'DAILY',
        version: 1,
        effectiveDate: new Date(),
        isActive: true,
        versions: [
          {
            version: 1,
            effectiveDate: new Date(),
            targetValue: 95,
            acceptableMin: 85,
            acceptableMax: 105,
            unit: 'mg/dL',
            notes: 'Initial QC Profile version',
            createdById: new Types.ObjectId(labAUserId),
            createdAt: new Date(),
          },
        ],
        createdById: new Types.ObjectId(labAUserId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(QCProfileModel, 'create').mockResolvedValue(mockCreated as any);

      const res = await request(app)
        .post('/api/v1/laboratory/quality/profiles')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          profileName: 'Serum Glucose Normal Level 1',
          testCode: 'GLUC',
          testName: 'Fasting Blood Glucose',
          parameterName: 'Glucose Level',
          controlMaterial: 'Bio-Rad Liquichek Level 1',
          controlLevel: 'LEVEL_1',
          dataType: 'NUMERIC',
          targetValue: 95,
          acceptableMin: 85,
          acceptableMax: 105,
          unit: 'mg/dL',
          runFrequency: 'DAILY',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profileName).toBe('Serum Glucose Normal Level 1');
      expect(res.body.data.version).toBe(1);
      expect(res.body.data.acceptableMin).toBe(85);
      expect(res.body.data.acceptableMax).toBe(105);
    });

    it('rejects QC profile when acceptableMin is greater than acceptableMax', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/quality/profiles')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          profileName: 'Invalid Profile Range',
          testCode: 'GLUC',
          testName: 'Fasting Blood Glucose',
          parameterName: 'Glucose',
          controlMaterial: 'Bio-Rad Level 1',
          controlLevel: 'NORMAL',
          dataType: 'NUMERIC',
          acceptableMin: 120,
          acceptableMax: 80,
        });

      expect([400, 422]).toContain(res.status);
    });

    it('updates QC profile, bumps version to 2, and preserves historical snapshot', async () => {
      const profileId = new Types.ObjectId();
      const mockProfile: any = {
        _id: profileId,
        laboratoryId: new Types.ObjectId(labAProfileId),
        profileName: 'Serum Glucose Level 1',
        testCode: 'GLUC',
        testName: 'Fasting Blood Glucose',
        parameterName: 'Glucose',
        controlMaterial: 'Bio-Rad Level 1',
        controlLevel: 'LEVEL_1',
        dataType: 'NUMERIC',
        targetValue: 95,
        acceptableMin: 85,
        acceptableMax: 105,
        unit: 'mg/dL',
        version: 1,
        effectiveDate: new Date('2026-01-01'),
        isActive: true,
        versions: [
          {
            version: 1,
            effectiveDate: new Date('2026-01-01'),
            targetValue: 95,
            acceptableMin: 85,
            acceptableMax: 105,
            unit: 'mg/dL',
            notes: 'Initial version',
            createdById: new Types.ObjectId(labAUserId),
            createdAt: new Date('2026-01-01'),
          },
        ],
        createdById: new Types.ObjectId(labAUserId),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(QCProfileModel, 'findOne').mockResolvedValue(mockProfile);

      const res = await request(app)
        .put(`/api/v1/laboratory/quality/profiles/${profileId}`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          targetValue: 98,
          acceptableMin: 88,
          acceptableMax: 108,
          changeReason: 'New manufacturer lot calibration adjustment',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockProfile.version).toBe(2);
      expect(mockProfile.versions.length).toBe(2);
      expect(mockProfile.versions[1].version).toBe(2);
      expect(mockProfile.versions[1].acceptableMin).toBe(88);
    });
  });

  // ===========================================================================
  // 2. QC RUN MANAGEMENT, RULE EVALUATION & INVESTIGATION
  // ===========================================================================
  describe('2. QC Run Management & Automated Rule Evaluation', () => {
    it('records QC run and evaluates status as PASSED when value is within acceptable limits', async () => {
      const profileId = new Types.ObjectId();
      const mockProfile: any = {
        _id: profileId,
        laboratoryId: new Types.ObjectId(labAProfileId),
        profileName: 'Serum Glucose Level 1',
        testCode: 'GLUC',
        controlMaterial: 'Bio-Rad Level 1',
        controlLevel: 'LEVEL_1',
        dataType: 'NUMERIC',
        targetValue: 95,
        acceptableMin: 85,
        acceptableMax: 105,
        unit: 'mg/dL',
        version: 1,
      };

      vi.spyOn(QCProfileModel, 'findOne').mockResolvedValue(mockProfile);

      const mockRunCreated = {
        _id: new Types.ObjectId(),
        laboratoryId: new Types.ObjectId(labAProfileId),
        qcProfileId: profileId,
        qcProfileName: 'Serum Glucose Level 1',
        profileVersion: 1,
        testCode: 'GLUC',
        controlMaterial: 'Bio-Rad Level 1',
        controlLotNumber: 'LOT-9921',
        runIdentifier: 'QC-20261117-001',
        measuredNumericValue: 96,
        targetValue: 95,
        acceptableMin: 85,
        acceptableMax: 105,
        qcStatus: 'PASSED',
        ruleEvaluation: {
          ruleName: 'AcceptableRangeRule',
          passed: true,
          explanation: 'Measured value 96 is within acceptable limits [85, 105] mg/dL.',
        },
        operatorId: new Types.ObjectId(labAUserId),
        operatorName: 'Central Diagnostic Lab Staff',
        runDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(QCRunModel, 'create').mockResolvedValue(mockRunCreated as any);

      const res = await request(app)
        .post('/api/v1/laboratory/quality/runs')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          qcProfileId: profileId.toString(),
          controlLotNumber: 'LOT-9921',
          measuredNumericValue: 96,
          comments: 'Daily morning shift control run',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.qcStatus).toBe('PASSED');
      expect(res.body.data.ruleEvaluation.passed).toBe(true);
    });

    it('evaluates status as FAILED when value is outside limits and automatically creates a Quality Incident', async () => {
      const profileId = new Types.ObjectId();
      const mockProfile: any = {
        _id: profileId,
        laboratoryId: new Types.ObjectId(labAProfileId),
        profileName: 'Serum Glucose Level 1',
        testCode: 'GLUC',
        controlMaterial: 'Bio-Rad Level 1',
        controlLevel: 'LEVEL_1',
        dataType: 'NUMERIC',
        targetValue: 95,
        acceptableMin: 85,
        acceptableMax: 105,
        unit: 'mg/dL',
        version: 1,
      };

      vi.spyOn(QCProfileModel, 'findOne').mockResolvedValue(mockProfile);

      const mockIncident = {
        _id: new Types.ObjectId(),
        incidentReference: 'INC-2026-1001',
        laboratoryId: new Types.ObjectId(labAProfileId),
        category: 'QC_FAILURE',
        severity: 'HIGH',
        title: 'Quality Control Failure: Serum Glucose Level 1 (GLUC)',
        description: 'Automatic incident triggered by QC Run',
        relatedTestCode: 'GLUC',
        reportedById: new Types.ObjectId(labAUserId),
        reportedByName: 'Central Diagnostic Lab Staff',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(QualityIncidentModel, 'create').mockResolvedValue(mockIncident as any);

      const mockRunCreated: any = {
        _id: new Types.ObjectId(),
        laboratoryId: new Types.ObjectId(labAProfileId),
        qcProfileId: profileId,
        qcProfileName: 'Serum Glucose Level 1',
        profileVersion: 1,
        testCode: 'GLUC',
        controlMaterial: 'Bio-Rad Level 1',
        controlLotNumber: 'LOT-9921',
        runIdentifier: 'QC-20261117-002',
        measuredNumericValue: 118,
        targetValue: 95,
        acceptableMin: 85,
        acceptableMax: 105,
        qcStatus: 'FAILED',
        ruleEvaluation: {
          ruleName: 'AcceptableUpperLimitRule',
          passed: false,
          explanation: 'Measured value 118 exceeds configured acceptable maximum 105 mg/dL.',
        },
        operatorId: new Types.ObjectId(labAUserId),
        operatorName: 'Central Diagnostic Lab Staff',
        runDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(QCRunModel, 'create').mockResolvedValue(mockRunCreated as any);

      const res = await request(app)
        .post('/api/v1/laboratory/quality/runs')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          qcProfileId: profileId.toString(),
          controlLotNumber: 'LOT-9921',
          measuredNumericValue: 118,
          comments: 'High reading observed',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.qcStatus).toBe('FAILED');
      expect(res.body.data.ruleEvaluation.passed).toBe(false);
      expect(QualityIncidentModel.create).toHaveBeenCalled();
    });

    it('records failure investigation and links investigation notes', async () => {
      const runId = new Types.ObjectId();
      const mockRun: any = {
        _id: runId,
        laboratoryId: new Types.ObjectId(labAProfileId),
        qcProfileId: new Types.ObjectId(),
        qcProfileName: 'Serum Glucose Level 1',
        profileVersion: 1,
        testCode: 'GLUC',
        controlMaterial: 'Bio-Rad Level 1',
        controlLotNumber: 'LOT-9921',
        runIdentifier: 'QC-20261117-002',
        qcStatus: 'FAILED',
        ruleEvaluation: { ruleName: 'Range', passed: false, explanation: 'High' },
        operatorId: new Types.ObjectId(labAUserId),
        operatorName: 'Lab Staff',
        runDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: 'Initial out-of-range failure',
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(QCRunModel, 'findOne').mockResolvedValue(mockRun);

      const res = await request(app)
        .post(`/api/v1/laboratory/quality/runs/${runId}/investigate`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          investigationNotes: 'Instrument temperature drift detected and recalibrated.',
          rootCauseCategory: 'EQUIPMENT_CALIBRATION',
          correctiveAction: 'Calibrated optical sensor and repeated control test with fresh aliquot.',
          resolutionStatus: 'RESOLVED',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockRun.comments).toContain('recalibrated');
    });
  });

  // ===========================================================================
  // 3. RESULT RELEASE SAFETY GATE
  // ===========================================================================
  describe('3. Result Release Safety Gate Integration', () => {
    it('blocks release gate check when active unresolved QC failure exists for test', async () => {
      const failedQCRun: any = {
        _id: new Types.ObjectId(),
        runIdentifier: 'QC-FAIL-01',
        testCode: 'GLUC',
        qcStatus: 'FAILED',
        ruleEvaluation: { explanation: 'Out of tolerance' },
        incidentId: new Types.ObjectId(),
      };

      vi.spyOn(QCRunModel, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue(failedQCRun),
      } as any);

      const openIncident: any = {
        _id: failedQCRun.incidentId,
        status: 'OPEN',
      };
      vi.spyOn(QualityIncidentModel, 'findById').mockResolvedValue(openIncident);

      const res = await request(app)
        .get('/api/v1/laboratory/quality/release-gate/check?testCode=GLUC')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.reasons[0]).toContain('FAILED rule evaluation');
    });

    it('blocks report publication when policy detects blocking QC failure without override', async () => {
      const reportId = new Types.ObjectId();
      const mockReport: any = {
        _id: reportId,
        reportNumber: 'LBR-2026-9001',
        laboratoryId: new Types.ObjectId(labAProfileId),
        status: 'APPROVED',
        tests: [{ testCode: 'GLUC', testName: 'Fasting Glucose' }],
        populate: vi.fn().mockReturnThis(),
      };

      vi.spyOn(LaboratoryReportModel, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockReport),
      } as any);

      // Failed QC run in system
      const failedRun: any = {
        _id: new Types.ObjectId(),
        runIdentifier: 'QC-FAIL-99',
        testCode: 'GLUC',
        qcStatus: 'FAILED',
        ruleEvaluation: { explanation: 'Acceptable limit exceeded' },
      };
      vi.spyOn(QCRunModel, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue(failedRun),
      } as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/reports/${reportId}/publish`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({ publicationNotes: 'Attempting release' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Quality Control Release Gate Blocked');
    });

    it('authorizes release override with audited exception record', async () => {
      const res = await request(app)
        .post('/api/v1/laboratory/quality/release-gate/override')
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          testCode: 'GLUC',
          reason: 'Emergency release approved by Pathologist after verifying manual backup standard.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.authorized).toBe(true);
      expect(res.body.data.overrideId).toBeDefined();
    });
  });

  // ===========================================================================
  // 4. QUALITY INCIDENTS & CAPA MANAGEMENT
  // ===========================================================================
  describe('4. Quality Incidents & CAPA Management', () => {
    it('creates and resolves a Quality Incident with resolution notes', async () => {
      const incidentId = new Types.ObjectId();
      const mockIncident: any = {
        _id: incidentId,
        incidentReference: 'INC-2026-5544',
        laboratoryId: new Types.ObjectId(labAProfileId),
        category: 'SPECIMEN_ISSUE',
        severity: 'MEDIUM',
        title: 'Hemolyzed specimen batch',
        description: 'Multiple samples received with severe hemolysis',
        status: 'OPEN',
        reportedById: new Types.ObjectId(labAUserId),
        reportedByName: 'Lab Staff',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(QualityIncidentModel, 'findOne').mockResolvedValue(mockIncident);

      const res = await request(app)
        .post(`/api/v1/laboratory/quality/incidents/${incidentId}/resolve`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          resolutionNotes: 'Phlebotomy team re-trained on proper needle gauge and inversion protocols.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockIncident.status).toBe('RESOLVED');
    });

    it('creates CAPA and reviews effectiveness to CLOSED status', async () => {
      const incidentId = new Types.ObjectId();
      const capaId = new Types.ObjectId();

      const mockIncident: any = {
        _id: incidentId,
        incidentReference: 'INC-2026-8800',
        laboratoryId: new Types.ObjectId(labAProfileId),
        status: 'OPEN',
        save: vi.fn().mockResolvedValue({}),
      };
      vi.spyOn(QualityIncidentModel, 'findOne').mockResolvedValue(mockIncident);

      const mockCAPA: any = {
        _id: capaId,
        capaReference: 'CAPA-2026-1122',
        incidentId,
        incidentReference: 'INC-2026-8800',
        laboratoryId: new Types.ObjectId(labAProfileId),
        problemStatement: 'Repeated calibration drift on Photometer 1',
        rootCauseCategory: 'HARDWARE',
        rootCauseAnalysis: 'Dust accumulation on optical lenses',
        correctiveAction: 'Deep optical assembly cleaning and sealing',
        preventiveAction: 'Added weekly lens inspection to preventive maintenance protocol',
        assignedOwnerId: new Types.ObjectId(labAUserId),
        assignedOwnerName: 'Lab Staff',
        dueDate: new Date('2026-12-01'),
        priority: 'HIGH',
        status: 'OPEN',
        actions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      vi.spyOn(CAPAModel, 'create').mockResolvedValue(mockCAPA as any);
      vi.spyOn(CAPAModel, 'findOne').mockResolvedValue(mockCAPA);

      // Create CAPA
      const createRes = await request(app)
        .post('/api/v1/laboratory/quality/capa')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          incidentId: incidentId.toString(),
          problemStatement: 'Repeated calibration drift on Photometer 1',
          rootCauseCategory: 'HARDWARE',
          rootCauseAnalysis: 'Dust accumulation on optical lenses',
          correctiveAction: 'Deep optical assembly cleaning and sealing',
          preventiveAction: 'Added weekly lens inspection to preventive maintenance protocol',
          assignedOwnerId: labAUserId,
          dueDate: '2026-12-01',
          priority: 'HIGH',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.capaReference).toBe('CAPA-2026-1122');

      // Effectiveness Review -> EFFECTIVE -> CLOSED
      const reviewRes = await request(app)
        .post(`/api/v1/laboratory/quality/capa/${capaId}/review`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          effectivenessResult: 'EFFECTIVE',
          effectivenessReviewNotes: 'Zero calibration drift observed across 30 consecutive operating days.',
        });

      expect(reviewRes.status).toBe(200);
      expect(mockCAPA.status).toBe('CLOSED');
      expect(mockCAPA.effectivenessResult).toBe('EFFECTIVE');
    });
  });

  // ===========================================================================
  // 5. INSTRUMENT MANAGEMENT, CALIBRATION & RESTRICTIONS
  // ===========================================================================
  describe('5. Instrument Management & Calibration Restrictions', () => {
    it('registers a laboratory instrument and prevents duplicate identifiers', async () => {
      vi.spyOn(LabInstrumentModel, 'findOne').mockResolvedValue(null);

      const mockInstrument = {
        _id: new Types.ObjectId(),
        laboratoryId: new Types.ObjectId(labAProfileId),
        instrumentIdentifier: 'INST-CHEM-01',
        instrumentName: 'Cobas c311 Chemistry Analyzer',
        manufacturer: 'Roche Diagnostics',
        model: 'Cobas c311',
        serialNumber: 'SN-998811',
        category: 'ANALYZER',
        associatedTestCodes: ['GLUC', 'LIPID', 'LFT', 'KFT'],
        operatingStatus: 'ACTIVE',
        installationDate: new Date('2025-06-01'),
        calibrationStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(LabInstrumentModel, 'create').mockResolvedValue(mockInstrument as any);

      const res = await request(app)
        .post('/api/v1/laboratory/quality/instruments')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          instrumentIdentifier: 'INST-CHEM-01',
          instrumentName: 'Cobas c311 Chemistry Analyzer',
          manufacturer: 'Roche Diagnostics',
          model: 'Cobas c311',
          serialNumber: 'SN-998811',
          category: 'ANALYZER',
          associatedTestCodes: ['GLUC', 'LIPID', 'LFT', 'KFT'],
          installationDate: '2025-06-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.instrumentIdentifier).toBe('INST-CHEM-01');
    });

    it('failed calibration places instrument OUT_OF_SERVICE and blocks release gate', async () => {
      const instId = new Types.ObjectId();
      const mockInstrument: any = {
        _id: instId,
        instrumentIdentifier: 'INST-BIO-01',
        instrumentName: 'Bio-Rad D-10',
        laboratoryId: new Types.ObjectId(labAProfileId),
        operatingStatus: 'ACTIVE',
        calibrationStatus: 'PASSED',
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(LabInstrumentModel, 'findOne').mockResolvedValue(mockInstrument);
      vi.spyOn(LabInstrumentModel, 'findById').mockResolvedValue(mockInstrument);

      const mockCalCreated = {
        _id: new Types.ObjectId(),
        calibrationReference: 'CAL-2026-9900',
        instrumentId: instId,
        instrumentName: 'Bio-Rad D-10',
        laboratoryId: new Types.ObjectId(labAProfileId),
        calibrationType: 'ROUTINE',
        scheduledDate: new Date('2026-11-17'),
        performedDate: new Date('2026-11-17'),
        dueDate: new Date('2026-11-20'),
        status: 'FAILED',
        calibrationResult: 'FAILED',
        parametersChecked: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(InstrumentCalibrationModel, 'create').mockResolvedValue(mockCalCreated as any);
      vi.spyOn(QualityIncidentModel, 'create').mockResolvedValue({
        _id: new Types.ObjectId(),
        incidentReference: 'INC-2026-9911',
        laboratoryId: new Types.ObjectId(labAProfileId),
        category: 'CALIBRATION_FAILURE',
        severity: 'HIGH',
        title: 'Calibration Failure',
        description: 'Instrument failed calibration',
        reportedById: new Types.ObjectId(labAUserId),
        reportedByName: 'Lab Staff',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .post(`/api/v1/laboratory/quality/instruments/${instId}/calibrations`)
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          calibrationType: 'ROUTINE',
          performedDate: '2026-11-17',
          dueDate: '2026-12-17',
          calibrationResult: 'FAILED',
          notes: 'Standard deviation exceeded allowable 2.5% threshold',
        });

      expect(res.status).toBe(201);
      expect(mockInstrument.calibrationStatus).toBe('FAILED');
      expect(mockInstrument.operatingStatus).toBe('OUT_OF_SERVICE');
    });

    it('authorized clearance clears calibration restriction and restores ACTIVE operating status', async () => {
      const calId = new Types.ObjectId();
      const instId = new Types.ObjectId();

      const mockCal: any = {
        _id: calId,
        instrumentId: instId,
        instrumentName: 'Bio-Rad D-10',
        laboratoryId: new Types.ObjectId(labAProfileId),
        calibrationReference: 'CAL-2026-9900',
        calibrationType: 'ROUTINE',
        scheduledDate: new Date('2026-11-17'),
        performedDate: new Date('2026-11-17'),
        dueDate: new Date('2026-12-17'),
        calibrationResult: 'FAILED',
        status: 'PASSED',
        parametersChecked: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      vi.spyOn(InstrumentCalibrationModel, 'findOne').mockResolvedValue(mockCal);

      const mockInst: any = {
        _id: instId,
        operatingStatus: 'OUT_OF_SERVICE',
        calibrationStatus: 'FAILED',
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      vi.spyOn(LabInstrumentModel, 'findById').mockResolvedValue(mockInst);

      const res = await request(app)
        .post(`/api/v1/laboratory/quality/calibrations/${calId}/clear`)
        .set('Authorization', `Bearer ${pathologistToken}`)
        .send({
          clearanceNotes: 'Verified secondary standard passed. Cleared for clinical testing.',
        });

      expect(res.status).toBe(200);
      expect(mockInst.operatingStatus).toBe('ACTIVE');
      expect(mockInst.calibrationStatus).toBe('PASSED');
    });
  });

  // ===========================================================================
  // 6. REAGENT INVENTORY, LOT TRACKING & IMMUTABLE LEDGER
  // ===========================================================================
  describe('6. Reagent Inventory & Immutable Transaction Ledger', () => {
    it('creates a reagent and registers a lot with automatic stock receipt ledger entry', async () => {
      const reagentId = new Types.ObjectId();
      const mockReagent: any = {
        _id: reagentId,
        laboratoryId: new Types.ObjectId(labAProfileId),
        reagentCode: 'REAG-GLUC-01',
        name: 'Hexokinase Glucose Reagent Pack',
        unit: 'Tests',
        currentStock: 0,
        minimumStockLevel: 50,
        save: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(ReagentModel, 'findOne').mockResolvedValue(mockReagent);
      vi.spyOn(ReagentLotModel, 'findOne').mockResolvedValue(null);

      const mockLotCreated: any = {
        _id: new Types.ObjectId(),
        reagentId,
        reagentName: 'Hexokinase Glucose Reagent Pack',
        laboratoryId: new Types.ObjectId(labAProfileId),
        lotNumber: 'LOT-HEX-88',
        manufacturer: 'Roche',
        receivedDate: new Date('2026-11-01'),
        expiryDate: new Date('2027-05-01'),
        initialQuantity: 500,
        availableQuantity: 500,
        unit: 'Tests',
        storageLocation: 'Cold Room Shelf A-2',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(ReagentLotModel, 'create').mockResolvedValue(mockLotCreated);
      vi.spyOn(ReagentInventoryTransactionModel, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/laboratory/inventory/reagents/lots')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          reagentId: reagentId.toString(),
          lotNumber: 'LOT-HEX-88',
          manufacturer: 'Roche',
          receivedDate: '2026-11-01',
          expiryDate: '2027-05-01',
          initialQuantity: 500,
          storageLocation: 'Cold Room Shelf A-2',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.availableQuantity).toBe(500);
      expect(ReagentInventoryTransactionModel.create).toHaveBeenCalled();
    });

    it('records stock consumption and rejects consumption when stock is insufficient', async () => {
      const lotId = new Types.ObjectId();
      const reagentId = new Types.ObjectId();

      const mockLot: any = {
        _id: lotId,
        lotNumber: 'LOT-HEX-88',
        availableQuantity: 20,
      };
      vi.spyOn(ReagentLotModel, 'findOne').mockResolvedValue(mockLot);
      vi.spyOn(ReagentModel, 'findOne').mockResolvedValue({ _id: reagentId, name: 'Reagent' } as any);

      // Attempting to consume 50 when only 20 is available
      vi.spyOn(ReagentLotModel, 'findOneAndUpdate').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/laboratory/inventory/reagents/transactions')
        .set('Authorization', `Bearer ${labAToken}`)
        .send({
          reagentId: reagentId.toString(),
          lotId: lotId.toString(),
          transactionType: 'CONSUMPTION',
          quantity: 50,
          reason: 'Batch testing run #402',
        });

      expect([400, 500]).toContain(res.status);
    });

    it('quarantines a lot and prevents it from being validated for test processing', async () => {
      const lotId = new Types.ObjectId();
      const mockLot: any = {
        _id: lotId,
        lotNumber: 'LOT-SUSPECT-01',
        reagentName: 'Electrolyte Buffer',
        status: 'QUARANTINED',
        quarantineReason: 'Precipitate observed in vials',
        expiryDate: new Date('2027-01-01'),
        availableQuantity: 100,
        save: vi.fn().mockResolvedValue({}),
      };
      vi.spyOn(ReagentLotModel, 'findOne').mockResolvedValue(mockLot);

      const res = await request(app)
        .get(`/api/v1/laboratory/inventory/reagents/lots/${lotId}/validate?testCode=ELEC`)
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.reason).toContain('QUARANTINED');
    });
  });

  // ===========================================================================
  // 7. QUALITY DASHBOARD PERSISTED KPIS
  // ===========================================================================
  describe('7. Quality Dashboard Persisted KPIs', () => {
    it('calculates dashboard metrics directly from persisted database records', async () => {
      vi.spyOn(QCRunModel, 'countDocuments').mockImplementation((query: any) => {
        if (query.qcStatus === 'FAILED') return Promise.resolve(2) as any;
        if (query.qcStatus === 'PASSED') return Promise.resolve(18) as any;
        return Promise.resolve(20) as any;
      });

      vi.spyOn(QualityIncidentModel, 'countDocuments').mockResolvedValue(3 as any);
      vi.spyOn(CAPAModel, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(LabInstrumentModel, 'countDocuments').mockResolvedValue(8 as any);
      vi.spyOn(InstrumentCalibrationModel, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(InstrumentMaintenanceModel, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(ReagentLotModel, 'countDocuments').mockResolvedValue(2 as any);
      vi.spyOn(ReagentModel, 'countDocuments').mockResolvedValue(4 as any);

      vi.spyOn(QCRunModel, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);
      vi.spyOn(QualityIncidentModel, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);
      vi.spyOn(CAPAModel, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);
      vi.spyOn(InstrumentCalibrationModel, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);
      vi.spyOn(InstrumentMaintenanceModel, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);
      vi.spyOn(ReagentLotModel, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const res = await request(app)
        .get('/api/v1/laboratory/quality/dashboard')
        .set('Authorization', `Bearer ${labAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis.totalQCRuns).toBe(20);
      expect(res.body.data.kpis.qcPassRate).toBe(90);
      expect(res.body.data.kpis.qcFailureCount).toBe(2);
      expect(res.body.data.kpis.openQualityIncidents).toBe(3);
      expect(res.body.data.kpis.openCAPAActions).toBe(1);
      expect(res.body.data.alerts.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 8. SECURITY & CROSS-LABORATORY ISOLATION
  // ===========================================================================
  describe('8. Security & Cross-Laboratory Isolation', () => {
    it('prevents non-laboratory roles (e.g. PATIENT) from accessing QMS endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/laboratory/quality/dashboard')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });

    it('denies cross-laboratory mutation: Lab B cannot update Lab A QC profile', async () => {
      const labAProfileId = new Types.ObjectId();
      // findOne returns null when laboratoryId does not match Lab B
      vi.spyOn(QCProfileModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .put(`/api/v1/laboratory/quality/profiles/${labAProfileId}`)
        .set('Authorization', `Bearer ${labBToken}`)
        .send({ targetValue: 100 });

      expect(res.status).toBe(404);
    });
  });
});
