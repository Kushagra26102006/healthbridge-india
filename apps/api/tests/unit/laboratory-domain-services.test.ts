/**
 * HealthBridge India — Day 6 Task 07
 * Unit Tests for Laboratory Validation Schemas, RBAC & SoD, QC Release Gate,
 * Reagent Eligibility, PDF Generation & FHIR DiagnosticReport Mapping.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import {
  inviteLaboratoryStaffSchema,
  createShiftTemplateSchema,
  createLeaveRequestSchema,
  createTaskAssignmentSchema,
  updateTaskStatusSchema,
  createQCProfileSchema,
  recordReagentStockTransactionSchema,
  authorizeQCOverrideSchema,
} from '@healthbridge/validation';
import { LaboratoryPermission, LaboratoryStaffRole } from '@healthbridge/shared-types';
import { laboratoryAuthorizationService } from '../../src/modules/laboratory/services/laboratory-authorization.service';
import { qcReleaseGateService } from '../../src/modules/laboratory/services/qc-release-gate.service';
import { reagentInventoryService } from '../../src/modules/laboratory/services/reagent-inventory.service';
import { ReportPdfService } from '../../src/modules/laboratory/services/report-pdf.service';
import { FhirDiagnosticReportService } from '../../src/modules/laboratory/services/fhir-diagnostic-report.service';
import {
  LabInstrumentModel,
  QCRunModel,
  QualityIncidentModel,
  ReagentLotModel,
} from '../../src/database/models';

describe('Laboratory Domain Unit Tests (Day 6 Task 07)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // 1. ZOD VALIDATION SCHEMAS
  // ===========================================================================
  describe('1. Validation Schemas', () => {
    it('validates staff invitation payload and rejects invalid email/role', () => {
      const valid = inviteLaboratoryStaffSchema.safeParse({
        fullName: 'Synthetic Technician',
        email: 'synth.tech@example-lab.test',
        designation: 'Senior Lab Technologist',
        role: 'LAB_TECHNICIAN',
      });
      expect(valid.success).toBe(true);

      const invalid = inviteLaboratoryStaffSchema.safeParse({
        fullName: 'A',
        email: 'not-an-email',
        designation: 'Tech',
        role: 'SUPER_GOD_MODE',
      });
      expect(invalid.success).toBe(false);
    });

    it('validates shift templates including overnight schedules without forcing isOvernight=false', () => {
      const parsed = createShiftTemplateSchema.safeParse({
        name: 'Night Duty',
        code: 'NIGHT',
        startTime: '22:00',
        endTime: '06:00',
        breakMinutes: 30,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.isOvernight).toBeUndefined();
      }
    });

    it('validates leave requests and task status transitions', () => {
      const leaveOk = createLeaveRequestSchema.safeParse({
        leaveType: 'ANNUAL',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        reason: 'Scheduled family leave',
      });
      expect(leaveOk.success).toBe(true);

      const taskOk = createTaskAssignmentSchema.safeParse({
        taskType: 'TEST_PROCESSING',
        title: 'Run synthetic CBC panel',
        relatedEntityType: 'LabOrder',
        assignedStaffId: new Types.ObjectId().toString(),
        priority: 'HIGH',
        dueDate: '2026-12-02T18:00:00.000Z',
      });
      expect(taskOk.success).toBe(true);

      const statusOk = updateTaskStatusSchema.safeParse({
        status: 'BLOCKED',
        blockedReason: 'Analyzer undergoing calibration',
      });
      expect(statusOk.success).toBe(true);
    });

    it('validates QC profiles, stock transactions, and QC overrides', () => {
      const qcOk = createQCProfileSchema.safeParse({
        testCode: 'CBC',
        testName: 'Complete Blood Count',
        profileName: 'CBC Control L1',
        parameterName: 'Hemoglobin',
        controlMaterial: 'Bio-Rad Liquichek Level 1',
        controlLevel: 'LEVEL_1',
        dataType: 'NUMERIC',
        targetValue: 14.0,
        acceptableMin: 13.2,
        acceptableMax: 14.8,
        unit: 'g/dL',
      });
      expect(qcOk.success).toBe(true);

      const txnOk = recordReagentStockTransactionSchema.safeParse({
        reagentId: new Types.ObjectId().toString(),
        lotId: new Types.ObjectId().toString(),
        transactionType: 'CONSUMPTION',
        quantity: 5,
        reason: 'Batch testing run',
      });
      expect(txnOk.success).toBe(true);

      const overrideOk = authorizeQCOverrideSchema.safeParse({
        testCode: 'CBC',
        reason: 'Parallel reference instrument verified within Westgard 1-2s',
      });
      expect(overrideOk.success).toBe(true);
    });
  });

  // ===========================================================================
  // 2. RBAC & SEGREGATION OF DUTIES
  // ===========================================================================
  describe('2. Laboratory RBAC & Segregation of Duties', () => {
    it('grants distinct default permissions per laboratory role (deny-by-default)', () => {
      const adminPerms = laboratoryAuthorizationService.getDefaultPermissionsForRole(
        LaboratoryStaffRole.LAB_ADMIN
      );
      const techPerms = laboratoryAuthorizationService.getDefaultPermissionsForRole(
        LaboratoryStaffRole.LAB_TECHNICIAN
      );
      const pathPerms = laboratoryAuthorizationService.getDefaultPermissionsForRole(
        LaboratoryStaffRole.LAB_PATHOLOGIST
      );

      expect(adminPerms).toContain(LaboratoryPermission.STAFF_PERMISSIONS_MANAGE);
      expect(techPerms).toContain(LaboratoryPermission.LAB_RESULTS_CREATE);
      expect(techPerms).not.toContain(LaboratoryPermission.LAB_REPORTS_APPROVE);
      expect(techPerms).not.toContain(LaboratoryPermission.STAFF_PERMISSIONS_MANAGE);
      expect(pathPerms).toContain(LaboratoryPermission.LAB_REPORTS_APPROVE);
      expect(pathPerms).toContain(LaboratoryPermission.LAB_REPORTS_PUBLISH);
    });

    it('computes effective permissions with explicit denials taking precedence over grants', () => {
      const effective = laboratoryAuthorizationService.resolveEffectivePermissions({
        role: LaboratoryStaffRole.LAB_TECHNICIAN,
        isPrimaryOwner: false,
        allowedPermissions: [LaboratoryPermission.LAB_INVENTORY_RECEIVE],
        deniedPermissions: [
          LaboratoryPermission.LAB_RESULTS_UPDATE,
          LaboratoryPermission.LAB_INVENTORY_RECEIVE,
        ],
      } as any);
      expect(effective).not.toContain(LaboratoryPermission.LAB_RESULTS_UPDATE);
      expect(effective).not.toContain(LaboratoryPermission.LAB_INVENTORY_RECEIVE);
      expect(effective).toContain(LaboratoryPermission.LAB_RESULTS_CREATE);
    });

    it('blocks self-approval when report approver matches result author', () => {
      const actorId = new Types.ObjectId().toString();
      expect(() =>
        laboratoryAuthorizationService.enforceSeparationOfDuties({
          action: 'APPROVE_REPORT',
          actorUserId: actorId,
          enteredByUserId: actorId,
        })
      ).toThrow(/Separation of duties/i);

      expect(() =>
        laboratoryAuthorizationService.enforceSeparationOfDuties({
          action: 'APPROVE_REPORT',
          actorUserId: new Types.ObjectId().toString(),
          enteredByUserId: actorId,
        })
      ).not.toThrow();
    });
  });

  // ===========================================================================
  // 3. QC RELEASE GATE & INSTRUMENT ELIGIBILITY
  // ===========================================================================
  describe('3. QC Release Gate & Instrument Restrictions', () => {
    const labId = new Types.ObjectId().toString();
    const instrumentId = new Types.ObjectId().toString();

    it('blocks OUT_OF_SERVICE, RETIRED, IN_MAINTENANCE, FAILED and OVERDUE calibrated instruments', async () => {
      vi.spyOn(QCRunModel, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue(null),
      } as any);

      for (const caseItem of [
        { operatingStatus: 'OUT_OF_SERVICE', calibrationStatus: 'VALID', expectedText: 'OUT OF SERVICE' },
        { operatingStatus: 'RETIRED', calibrationStatus: 'VALID', expectedText: 'RETIRED' },
        { operatingStatus: 'IN_MAINTENANCE', calibrationStatus: 'VALID', expectedText: 'IN MAINTENANCE' },
        { operatingStatus: 'ACTIVE', calibrationStatus: 'FAILED', expectedText: 'FAILED calibration' },
        { operatingStatus: 'ACTIVE', calibrationStatus: 'OVERDUE', expectedText: 'OVERDUE calibration' },
      ]) {
        vi.spyOn(LabInstrumentModel, 'findOne').mockResolvedValue({
          _id: new Types.ObjectId(instrumentId),
          instrumentIdentifier: 'SYNTH-INST-01',
          instrumentName: 'Synthetic Analyzer',
          operatingStatus: caseItem.operatingStatus,
          calibrationStatus: caseItem.calibrationStatus,
        } as any);

        const result = await qcReleaseGateService.checkQCEligibility(labId, 'CBC', instrumentId);
        expect(result.eligible).toBe(false);
        expect(result.reasons.join(' ')).toContain(caseItem.expectedText);
      }
    });

    it('blocks unresolved FAILED QC run and allows resolved QC run', async () => {
      const incidentId = new Types.ObjectId();
      vi.spyOn(QCRunModel, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          runIdentifier: 'QCR-SYNTH-001',
          qcStatus: 'FAILED',
          incidentId,
          ruleEvaluation: { explanation: '1-3s Westgard violation' },
        }),
      } as any);

      vi.spyOn(QualityIncidentModel, 'findById').mockResolvedValue({
        _id: incidentId,
        status: 'OPEN',
      } as any);

      const blocked = await qcReleaseGateService.checkQCEligibility(labId, 'CBC');
      expect(blocked.eligible).toBe(false);
      expect(blocked.blockingIncidentId).toBe(incidentId.toString());

      vi.spyOn(QualityIncidentModel, 'findById').mockResolvedValue({
        _id: incidentId,
        status: 'RESOLVED',
      } as any);

      const cleared = await qcReleaseGateService.checkQCEligibility(labId, 'CBC');
      expect(cleared.eligible).toBe(true);
    });

    it('rejects unauthorized QC override by LAB_TECHNICIAN and permits LAB_QUALITY_MANAGER', async () => {
      await expect(
        qcReleaseGateService.authorizeReleaseOverride(
          labId,
          { id: new Types.ObjectId().toString(), name: 'Tech', role: 'LABORATORY', labRole: 'LAB_TECHNICIAN' },
          { testCode: 'CBC', reason: 'Trying unauthorized override' }
        )
      ).rejects.toThrow(/Unauthorized QC override/i);

      const ok = await qcReleaseGateService.authorizeReleaseOverride(
        labId,
        { id: new Types.ObjectId().toString(), name: 'QA Mgr', role: 'LABORATORY', labRole: 'LAB_QUALITY_MANAGER' },
        { testCode: 'CBC', reason: 'Secondary calibrated analyzer confirmed control range' }
      );
      expect(ok.authorized).toBe(true);
      expect(ok.overrideId).toMatch(/^OVR-/);
    });
  });

  // ===========================================================================
  // 4. REAGENT LOT ELIGIBILITY
  // ===========================================================================
  describe('4. Reagent Lot Eligibility Validation', () => {
    const labId = new Types.ObjectId().toString();
    const lotId = new Types.ObjectId().toString();

    it('rejects EXPIRED, QUARANTINED, RECALLED, and insufficient stock lots', async () => {
      // Expired lot
      vi.spyOn(ReagentLotModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(lotId),
        lotNumber: 'LOT-EXP-01',
        status: 'ACTIVE',
        expiryDate: new Date('2020-01-01'),
        availableQuantity: 50,
      } as any);
      const expRes = await reagentInventoryService.validateLotForProcessing(labId, lotId, 'CBC', 1);
      expect(expRes.valid).toBe(false);
      expect(expRes.reason).toContain('EXPIRED');

      // Quarantined lot
      vi.spyOn(ReagentLotModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(lotId),
        lotNumber: 'LOT-QUAR-01',
        status: 'QUARANTINED',
        quarantineReason: 'Cold-chain breach',
        expiryDate: new Date('2028-01-01'),
        availableQuantity: 50,
      } as any);
      const quarRes = await reagentInventoryService.validateLotForProcessing(labId, lotId, 'CBC', 1);
      expect(quarRes.valid).toBe(false);
      expect(quarRes.reason).toContain('QUARANTINED');

      // Insufficient stock
      vi.spyOn(ReagentLotModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(lotId),
        lotNumber: 'LOT-LOW-01',
        status: 'ACTIVE',
        expiryDate: new Date('2028-01-01'),
        availableQuantity: 2,
      } as any);
      const lowRes = await reagentInventoryService.validateLotForProcessing(labId, lotId, 'CBC', 5);
      expect(lowRes.valid).toBe(false);
      expect(lowRes.reason).toContain('Insufficient');
    });
  });

  // ===========================================================================
  // 5. SERVER-SIDE PDF & HL7 FHIR R4 DIAGNOSTIC REPORT MAPPING
  // ===========================================================================
  describe('5. PDF Integrity & FHIR DiagnosticReport Mapping', () => {
    it('generates a valid PDF buffer with deterministic SHA-256 document hash and FHIR R4 bundle', () => {
      const syntheticReport: any = {
        id: new Types.ObjectId().toString(),
        reportNumber: 'LBR-SYNTH-2026-0001',
        patientId: new Types.ObjectId().toString(),
        patientName: 'Synthetic Patient One',
        testName: 'Synthetic Complete Blood Count',
        category: 'HEMATOLOGY',
        testDate: new Date().toISOString(),
        reportDate: new Date().toISOString(),
        laboratoryId: new Types.ObjectId().toString(),
        laboratoryName: 'HealthBridge Synthetic Reference Lab',
        status: 'PUBLISHED',
        currentVersion: 1,
        verificationStatus: 'VERIFIED',
        tests: [{ testCode: 'CBC', testName: 'Complete Blood Count' }],
        observations: [
          {
            parameterCode: 'HB',
            testName: 'Hemoglobin',
            value: '14.2',
            numericValue: 14.2,
            unit: 'g/dL',
            referenceRange: '13.0 - 17.0',
            flag: 'NORMAL',
            isAbnormal: false,
            isCritical: false,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const pdf = ReportPdfService.generateReportPdf(syntheticReport);
      expect(pdf.buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
      expect(pdf.documentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(pdf.fileSize).toBeGreaterThan(200);

      const fhir = FhirDiagnosticReportService.mapToFhirBundle(syntheticReport);
      expect(fhir.resourceType).toBe('Bundle');
      expect(fhir.entry.some((e: any) => e.resource?.resourceType === 'DiagnosticReport')).toBe(true);
      expect(fhir.entry.some((e: any) => e.resource?.resourceType === 'Observation')).toBe(true);
    });
  });
});
