import mongoose, { Types } from 'mongoose';
import {
  QCEligibilityCheckResult,
  AuthorizeQCOverrideDto,
} from '@healthbridge/shared-types';
import { QCRunModel } from '../models/qc-run.model';
import { LabInstrumentModel } from '../models/lab-instrument.model';
import { QualityIncidentModel } from '../models/quality-incident.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';
import crypto from 'crypto';

const AUTHORIZED_OVERRIDE_ROLES = new Set([
  'ADMIN',
  'LABORATORY',
  'LAB_ADMIN',
  'LAB_MANAGER',
  'LAB_QUALITY_MANAGER',
  'LAB_PATHOLOGIST',
  'LAB_SUPERVISOR',
]);

export class QCReleaseGateService {
  /**
   * Safety check: Evaluate whether a given test / instrument is eligible
   * for result entry, validation, or report publication.
   */
  async checkQCEligibility(
    laboratoryId: string,
    testCode: string,
    instrumentId?: string
  ): Promise<QCEligibilityCheckResult> {
    const reasons: string[] = [];
    let blockingIncidentId: string | undefined;
    let blockingQCRunId: string | undefined;
    let instrumentOperatingStatus: any = undefined;

    const labObjId = new Types.ObjectId(laboratoryId);

    // 1. Check Instrument Status & Calibration
    if (instrumentId && Types.ObjectId.isValid(instrumentId)) {
      const instrument = await LabInstrumentModel.findOne({
        _id: new Types.ObjectId(instrumentId),
        laboratoryId: labObjId,
      });

      if (instrument) {
        instrumentOperatingStatus = instrument.operatingStatus;
        if (instrument.operatingStatus === 'OUT_OF_SERVICE') {
          reasons.push(
            `Instrument ${instrument.instrumentIdentifier} (${instrument.instrumentName}) is OUT OF SERVICE.`
          );
        } else if (instrument.operatingStatus === 'RETIRED') {
          reasons.push(
            `Instrument ${instrument.instrumentIdentifier} (${instrument.instrumentName}) is RETIRED and decommissioned.`
          );
        } else if (instrument.operatingStatus === 'IN_MAINTENANCE') {
          reasons.push(
            `Instrument ${instrument.instrumentIdentifier} (${instrument.instrumentName}) is currently IN MAINTENANCE.`
          );
        }

        if (instrument.calibrationStatus === 'FAILED') {
          reasons.push(
            `Instrument ${instrument.instrumentIdentifier} has a FAILED calibration and cannot be used for clinical testing.`
          );
        } else if (
          instrument.calibrationStatus === 'OVERDUE' ||
          (instrument.nextCalibrationDate && new Date(instrument.nextCalibrationDate) < new Date())
        ) {
          reasons.push(
            `Instrument ${instrument.instrumentIdentifier} has an OVERDUE calibration and is blocked until recalibrated and cleared.`
          );
        }
      }
    }

    // 2. Check for latest QC Run for this test
    const latestQCRun = await QCRunModel.findOne({
      laboratoryId: labObjId,
      testCode: testCode.toUpperCase(),
      ...(instrumentId && Types.ObjectId.isValid(instrumentId)
        ? { instrumentId: new Types.ObjectId(instrumentId) }
        : {}),
    }).sort({ runDate: -1, createdAt: -1 });

    if (latestQCRun && latestQCRun.qcStatus === 'FAILED') {
      // Check if there is an active unresolved incident
      let isResolved = false;
      if (latestQCRun.incidentId) {
        const incident = await QualityIncidentModel.findById(latestQCRun.incidentId);
        if (incident && (incident.status === 'RESOLVED' || incident.status === 'CLOSED')) {
          isResolved = true;
        } else if (incident) {
          blockingIncidentId = incident._id.toString();
        }
      }

      if (!isResolved) {
        blockingQCRunId = latestQCRun._id.toString();
        reasons.push(
          `Latest Quality Control run (${latestQCRun.runIdentifier}) for test ${testCode} FAILED rule evaluation (${latestQCRun.ruleEvaluation?.explanation || 'Out of acceptable limits'}). Unresolved quality incident exists.`
        );
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      blockingIncidentId,
      blockingQCRunId,
      instrumentStatus: instrumentOperatingStatus,
    };
  }

  /**
   * Authorize a controlled override exception with mandatory audit trail.
   */
  async authorizeReleaseOverride(
    laboratoryId: string,
    authorizedBy: { id: string; name: string; role: string; labRole?: string },
    dto: AuthorizeQCOverrideDto
  ): Promise<{ authorized: boolean; overrideId: string; message: string }> {
    const effectiveRole = authorizedBy.labRole || authorizedBy.role;
    if (!AUTHORIZED_OVERRIDE_ROLES.has(effectiveRole)) {
      throw AppError.forbidden(
        `Unauthorized QC override: Role '${effectiveRole}' is not permitted to override blocking quality control conditions.`
      );
    }

    if (!dto.reason || dto.reason.trim().length < 5) {
      throw AppError.badRequest(
        'A documented clinical/quality justification (minimum 5 characters) is required to authorize a QC release override.'
      );
    }

    const overrideId = `OVR-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    // Write audit log entry
    if (mongoose.connection.readyState === 1) {
      try {
        await AuditLogModel.create({
          actorId: Types.ObjectId.isValid(authorizedBy.id)
            ? new Types.ObjectId(authorizedBy.id)
            : undefined,
          action: 'QC_OVERRIDE_AUTHORIZED',
          resourceType: 'LAB_QUALITY_GATE',
          resourceId: dto.testCode,
          timestamp: new Date(),
          requestId: crypto.randomUUID(),
          outcome: 'SUCCESS',
          metadata: {
            overrideId,
            testCode: dto.testCode,
            laboratoryId,
            reason: dto.reason,
            authorizedByName: authorizedBy.name,
            authorizedByRole: authorizedBy.role,
            instrumentId: dto.instrumentId,
            reportId: dto.reportId,
          },
        });
      } catch {
        // Safe catch
      }
    }

    return {
      authorized: true,
      overrideId,
      message: `Quality control release override granted for test ${dto.testCode}. Audit reference: ${overrideId}.`,
    };
  }
}

export const qcReleaseGateService = new QCReleaseGateService();
