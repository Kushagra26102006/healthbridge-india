import mongoose, { Types } from 'mongoose';
import {
  QCProfileDto,
  CreateQCProfileDto,
  UpdateQCProfileDto,
  QCRunDto,
  CreateQCRunDto,
  QCInvestigationDto,
  QCRuleEvaluation,
} from '@healthbridge/shared-types';
import { QCProfileModel, IQCProfileDocument } from '../models/qc-profile.model';
import { QCRunModel, IQCRunDocument } from '../models/qc-run.model';
import { LabInstrumentModel } from '../models/lab-instrument.model';
import { ReagentLotModel } from '../models/reagent.model';
import { qualityIncidentCapaService } from './quality-incident-capa.service';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';
import crypto from 'crypto';

export class QualityControlService {
  /**
   * Create a new QC Profile.
   */
  async createQCProfile(
    laboratoryId: string,
    createdBy: { id: string; name: string },
    dto: CreateQCProfileDto
  ): Promise<QCProfileDto> {
    const labObjId = new Types.ObjectId(laboratoryId);

    let applicableInstrumentName: string | undefined;
    if (dto.applicableInstrumentId && Types.ObjectId.isValid(dto.applicableInstrumentId)) {
      const inst = await LabInstrumentModel.findById(dto.applicableInstrumentId);
      if (inst) applicableInstrumentName = inst.instrumentName;
    }

    const effectiveDate = dto.effectiveDate ? new Date(dto.effectiveDate) : new Date();

    const profileDoc = await QCProfileModel.create({
      laboratoryId: labObjId,
      profileName: dto.profileName,
      testCode: dto.testCode.toUpperCase(),
      testName: dto.testName,
      parameterName: dto.parameterName,
      controlMaterial: dto.controlMaterial,
      controlLevel: dto.controlLevel,
      dataType: dto.dataType,
      targetValue: dto.targetValue,
      acceptableMin: dto.acceptableMin,
      acceptableMax: dto.acceptableMax,
      qualitativeExpected: dto.qualitativeExpected,
      unit: dto.unit,
      applicableInstrumentId:
        dto.applicableInstrumentId && Types.ObjectId.isValid(dto.applicableInstrumentId)
          ? new Types.ObjectId(dto.applicableInstrumentId)
          : undefined,
      applicableInstrumentName,
      reagentLotRequirements: dto.reagentLotRequirements,
      runFrequency: dto.runFrequency || 'DAILY',
      version: 1,
      effectiveDate,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      versions: [
        {
          version: 1,
          effectiveDate,
          targetValue: dto.targetValue,
          acceptableMin: dto.acceptableMin,
          acceptableMax: dto.acceptableMax,
          qualitativeExpected: dto.qualitativeExpected,
          unit: dto.unit,
          notes: 'Initial QC Profile version',
          createdById: new Types.ObjectId(createdBy.id),
          createdAt: new Date(),
        },
      ],
      createdById: new Types.ObjectId(createdBy.id),
    });

    await this.logAudit({
      actorId: createdBy.id,
      action: 'QC_PROFILE_CREATED',
      resourceType: 'QC_PROFILE',
      resourceId: profileDoc._id.toString(),
      metadata: { profileName: dto.profileName, testCode: dto.testCode },
    });

    return this.mapProfile(profileDoc);
  }

  /**
   * Update QC Profile and preserve historical version.
   */
  async updateQCProfile(
    laboratoryId: string,
    id: string,
    updatedBy: { id: string; name: string },
    dto: UpdateQCProfileDto
  ): Promise<QCProfileDto> {
    const doc = await QCProfileModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('QC Profile not found or access denied');

    if (dto.profileName) doc.profileName = dto.profileName;
    if (dto.targetValue !== undefined) doc.targetValue = dto.targetValue;
    if (dto.acceptableMin !== undefined) doc.acceptableMin = dto.acceptableMin;
    if (dto.acceptableMax !== undefined) doc.acceptableMax = dto.acceptableMax;
    if (dto.qualitativeExpected !== undefined) doc.qualitativeExpected = dto.qualitativeExpected;
    if (dto.unit !== undefined) doc.unit = dto.unit;
    if (dto.runFrequency) doc.runFrequency = dto.runFrequency;
    if (dto.isActive !== undefined) doc.isActive = dto.isActive;

    if (dto.applicableInstrumentId && Types.ObjectId.isValid(dto.applicableInstrumentId)) {
      doc.applicableInstrumentId = new Types.ObjectId(dto.applicableInstrumentId);
      const inst = await LabInstrumentModel.findById(dto.applicableInstrumentId);
      if (inst) doc.applicableInstrumentName = inst.instrumentName;
    }

    // Bump version and archive snapshot
    doc.version += 1;
    doc.effectiveDate = new Date();
    doc.updatedById = new Types.ObjectId(updatedBy.id);

    doc.versions.push({
      version: doc.version,
      effectiveDate: doc.effectiveDate,
      targetValue: doc.targetValue,
      acceptableMin: doc.acceptableMin,
      acceptableMax: doc.acceptableMax,
      qualitativeExpected: doc.qualitativeExpected,
      unit: doc.unit,
      notes: dto.changeReason || `Updated to version ${doc.version}`,
      createdById: new Types.ObjectId(updatedBy.id),
      createdAt: new Date(),
    });

    await doc.save();

    await this.logAudit({
      actorId: updatedBy.id,
      action: 'QC_PROFILE_UPDATED',
      resourceType: 'QC_PROFILE',
      resourceId: doc._id.toString(),
      metadata: { newVersion: doc.version, changeReason: dto.changeReason },
    });

    return this.mapProfile(doc);
  }

  /**
   * List QC Profiles.
   */
  async listQCProfiles(
    laboratoryId: string,
    query: { testCode?: string; isActive?: boolean; search?: string }
  ): Promise<QCProfileDto[]> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.testCode) filter.testCode = query.testCode.toUpperCase();
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) {
      filter.$or = [
        { profileName: { $regex: query.search, $options: 'i' } },
        { controlMaterial: { $regex: query.search, $options: 'i' } },
        { testCode: { $regex: query.search, $options: 'i' } },
      ];
    }

    const profiles = await QCProfileModel.find(filter).sort({ testCode: 1, profileName: 1 });
    return profiles.map((p) => this.mapProfile(p));
  }

  /**
   * Get QC Profile by ID.
   */
  async getQCProfileById(laboratoryId: string, id: string): Promise<QCProfileDto | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await QCProfileModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    return doc ? this.mapProfile(doc) : null;
  }

  /**
   * Record QC Run & Execute Automated Rule Evaluation.
   */
  async recordQCRun(
    laboratoryId: string,
    operator: { id: string; name: string },
    dto: CreateQCRunDto
  ): Promise<QCRunDto> {
    const labObjId = new Types.ObjectId(laboratoryId);
    const profile = await QCProfileModel.findOne({
      _id: new Types.ObjectId(dto.qcProfileId),
      laboratoryId: labObjId,
    });
    if (!profile) throw AppError.notFound('QC Profile not found or access denied');

    let instrumentName: string | undefined;
    const instrumentId = dto.instrumentId || profile.applicableInstrumentId?.toString();
    if (instrumentId && Types.ObjectId.isValid(instrumentId)) {
      const inst = await LabInstrumentModel.findById(instrumentId);
      if (inst) instrumentName = inst.instrumentName;
    }

    let reagentLotNumber: string | undefined;
    if (dto.reagentLotId && Types.ObjectId.isValid(dto.reagentLotId)) {
      const lot = await ReagentLotModel.findById(dto.reagentLotId);
      if (lot) reagentLotNumber = lot.lotNumber;
    }

    // Automated Rule Evaluation
    const ruleEvaluation = this.evaluateQCRule(profile, dto);
    const qcStatus = ruleEvaluation.passed ? 'PASSED' : 'FAILED';

    const runIdentifier = `QC-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12)}-${Math.floor(100 + Math.random() * 900)}`;

    const runDoc = await QCRunModel.create({
      laboratoryId: labObjId,
      qcProfileId: profile._id,
      qcProfileName: profile.profileName,
      profileVersion: profile.version,
      testCode: profile.testCode,
      instrumentId: instrumentId && Types.ObjectId.isValid(instrumentId) ? new Types.ObjectId(instrumentId) : undefined,
      instrumentName,
      controlMaterial: profile.controlMaterial,
      controlLotNumber: dto.controlLotNumber,
      reagentLotId: dto.reagentLotId && Types.ObjectId.isValid(dto.reagentLotId) ? new Types.ObjectId(dto.reagentLotId) : undefined,
      reagentLotNumber,
      runIdentifier,
      measuredNumericValue: dto.measuredNumericValue,
      measuredQualitativeValue: dto.measuredQualitativeValue,
      targetValue: profile.targetValue,
      acceptableMin: profile.acceptableMin,
      acceptableMax: profile.acceptableMax,
      qualitativeExpected: profile.qualitativeExpected,
      unit: profile.unit,
      qcStatus,
      ruleEvaluation,
      operatorId: new Types.ObjectId(operator.id),
      operatorName: operator.name,
      runDate: new Date(),
      comments: dto.comments,
    });

    // If FAILED, automatically trigger Quality Incident creation
    if (qcStatus === 'FAILED') {
      const incident = await qualityIncidentCapaService.createIncident(
        laboratoryId,
        operator,
        {
          category: 'QC_FAILURE',
          severity: 'HIGH',
          title: `Quality Control Failure: ${profile.profileName} (${profile.testCode})`,
          description: `Automatic incident triggered by QC Run ${runIdentifier}. ${ruleEvaluation.explanation}. Measured value: ${dto.measuredNumericValue ?? dto.measuredQualitativeValue}, Target: ${profile.targetValue ?? profile.qualitativeExpected}. Acceptable limits: [${profile.acceptableMin ?? 'N/A'} - ${profile.acceptableMax ?? 'N/A'}].`,
          relatedTestCode: profile.testCode,
          relatedInstrumentId: instrumentId,
          relatedReagentLotId: dto.reagentLotId,
          relatedQCRunId: runDoc._id.toString(),
        }
      );

      runDoc.incidentId = new Types.ObjectId(incident.id);
      await runDoc.save();
    }

    await this.logAudit({
      actorId: operator.id,
      action: 'QC_RUN_RECORDED',
      resourceType: 'QC_RUN',
      resourceId: runDoc._id.toString(),
      metadata: {
        runIdentifier,
        testCode: profile.testCode,
        qcStatus,
        passed: ruleEvaluation.passed,
      },
    });

    return this.mapRun(runDoc);
  }

  /**
   * Evaluate QC Rules based on persisted profile version.
   */
  private evaluateQCRule(
    profile: IQCProfileDocument,
    dto: CreateQCRunDto
  ): QCRuleEvaluation {
    if (profile.dataType === 'NUMERIC') {
      const value = dto.measuredNumericValue;
      if (value === undefined || value === null) {
        return {
          ruleName: 'NumericValueRequired',
          passed: false,
          explanation: 'Measured numeric value is required for numeric QC profile.',
        };
      }

      const min = profile.acceptableMin;
      const max = profile.acceptableMax;
      const target = profile.targetValue;

      const deviation = target !== undefined ? value - target : undefined;
      const deviationPercentage =
        target !== undefined && target !== 0
          ? Math.round(((value - target) / target) * 1000) / 10
          : undefined;

      if (min !== undefined && value < min) {
        return {
          ruleName: 'AcceptableLowerLimitRule',
          passed: false,
          explanation: `Measured value ${value} is below configured acceptable minimum ${min} ${profile.unit || ''}.`,
          deviation,
          deviationPercentage,
        };
      }

      if (max !== undefined && value > max) {
        return {
          ruleName: 'AcceptableUpperLimitRule',
          passed: false,
          explanation: `Measured value ${value} exceeds configured acceptable maximum ${max} ${profile.unit || ''}.`,
          deviation,
          deviationPercentage,
        };
      }

      return {
        ruleName: 'AcceptableRangeRule',
        passed: true,
        explanation: `Measured value ${value} is within acceptable limits [${min ?? '-∞'}, ${max ?? '+∞'}] ${profile.unit || ''}.`,
        deviation,
        deviationPercentage,
      };
    } else {
      // Qualitative / Boolean check
      const expected = profile.qualitativeExpected?.trim().toLowerCase();
      const observed = dto.measuredQualitativeValue?.trim().toLowerCase();

      if (!observed) {
        return {
          ruleName: 'QualitativeValueRequired',
          passed: false,
          explanation: 'Measured qualitative value is required for qualitative QC profile.',
        };
      }

      if (expected && observed !== expected) {
        return {
          ruleName: 'QualitativeExpectationMatchRule',
          passed: false,
          explanation: `Observed value "${dto.measuredQualitativeValue}" does not match expected result "${profile.qualitativeExpected}".`,
        };
      }

      return {
        ruleName: 'QualitativeExpectationMatchRule',
        passed: true,
        explanation: `Observed value matches expected "${profile.qualitativeExpected}".`,
      };
    }
  }

  /**
   * List QC Runs with filtering and pagination.
   */
  async listQCRuns(
    laboratoryId: string,
    query: {
      qcProfileId?: string;
      testCode?: string;
      instrumentId?: string;
      controlLotNumber?: string;
      qcStatus?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: QCRunDto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.qcProfileId) filter.qcProfileId = new Types.ObjectId(query.qcProfileId);
    if (query.testCode) filter.testCode = query.testCode.toUpperCase();
    if (query.instrumentId) filter.instrumentId = new Types.ObjectId(query.instrumentId);
    if (query.controlLotNumber) filter.controlLotNumber = query.controlLotNumber;
    if (query.qcStatus) filter.qcStatus = query.qcStatus;
    if (query.startDate || query.endDate) {
      filter.runDate = {};
      if (query.startDate) filter.runDate.$gte = new Date(query.startDate);
      if (query.endDate) filter.runDate.$lte = new Date(query.endDate);
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      QCRunModel.find(filter).sort({ runDate: -1 }).skip(skip).limit(limit),
      QCRunModel.countDocuments(filter),
    ]);

    return {
      items: items.map((r) => this.mapRun(r)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get QC Run by ID.
   */
  async getQCRunById(laboratoryId: string, id: string): Promise<QCRunDto | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await QCRunModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    return doc ? this.mapRun(doc) : null;
  }

  /**
   * Investigate QC Failure.
   */
  async investigateQCFailure(
    laboratoryId: string,
    runId: string,
    operator: { id: string; name: string },
    dto: QCInvestigationDto
  ): Promise<QCRunDto> {
    const doc = await QCRunModel.findOne({
      _id: new Types.ObjectId(runId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('QC Run not found or access denied');

    if (dto.resolutionStatus === 'INVALIDATED') {
      doc.qcStatus = 'INVALIDATED';
    } else if (dto.resolutionStatus === 'UNDER_INVESTIGATION') {
      doc.qcStatus = 'UNDER_INVESTIGATION';
    }

    doc.comments = `${doc.comments ? doc.comments + ' | ' : ''}Investigation: ${dto.investigationNotes} [Root Cause: ${dto.rootCauseCategory}] [Action: ${dto.correctiveAction}]`;
    await doc.save();

    // If linked to an incident, update incident too
    if (doc.incidentId) {
      await qualityIncidentCapaService.updateIncident(laboratoryId, doc.incidentId.toString(), operator, {
        investigationNotes: dto.investigationNotes,
        rootCauseCategory: dto.rootCauseCategory,
        status: dto.resolutionStatus === 'RESOLVED' ? 'RESOLVED' : 'UNDER_INVESTIGATION',
        resolutionNotes: dto.correctiveAction,
      });
    }

    await this.logAudit({
      actorId: operator.id,
      action: 'QC_FAILURE_INVESTIGATED',
      resourceType: 'QC_RUN',
      resourceId: doc._id.toString(),
      metadata: { runIdentifier: doc.runIdentifier, resolutionStatus: dto.resolutionStatus },
    });

    return this.mapRun(doc);
  }

  private mapProfile(doc: IQCProfileDocument): QCProfileDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      profileName: doc.profileName,
      testCode: doc.testCode,
      testName: doc.testName,
      parameterName: doc.parameterName,
      controlMaterial: doc.controlMaterial,
      controlLevel: doc.controlLevel,
      dataType: doc.dataType,
      targetValue: doc.targetValue,
      acceptableMin: doc.acceptableMin,
      acceptableMax: doc.acceptableMax,
      qualitativeExpected: doc.qualitativeExpected,
      unit: doc.unit,
      applicableInstrumentId: doc.applicableInstrumentId?.toString(),
      applicableInstrumentName: doc.applicableInstrumentName,
      reagentLotRequirements: doc.reagentLotRequirements,
      runFrequency: doc.runFrequency,
      version: doc.version,
      effectiveDate: (doc.effectiveDate.toISOString().split('T')[0] as string),
      isActive: doc.isActive,
      versions: (doc.versions || []).map((v) => ({
        version: v.version,
        effectiveDate: (v.effectiveDate.toISOString().split('T')[0] as string),
        targetValue: v.targetValue,
        acceptableMin: v.acceptableMin,
        acceptableMax: v.acceptableMax,
        qualitativeExpected: v.qualitativeExpected,
        unit: v.unit,
        notes: v.notes,
        createdById: v.createdById.toString(),
        createdAt: v.createdAt.toISOString(),
      })),
      createdById: doc.createdById.toString(),
      updatedById: doc.updatedById?.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapRun(doc: IQCRunDocument): QCRunDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      qcProfileId: doc.qcProfileId.toString(),
      qcProfileName: doc.qcProfileName,
      profileVersion: doc.profileVersion,
      testCode: doc.testCode,
      instrumentId: doc.instrumentId?.toString(),
      instrumentName: doc.instrumentName,
      controlMaterial: doc.controlMaterial,
      controlLotNumber: doc.controlLotNumber,
      reagentLotId: doc.reagentLotId?.toString(),
      reagentLotNumber: doc.reagentLotNumber,
      runIdentifier: doc.runIdentifier,
      measuredNumericValue: doc.measuredNumericValue,
      measuredQualitativeValue: doc.measuredQualitativeValue,
      targetValue: doc.targetValue,
      acceptableMin: doc.acceptableMin,
      acceptableMax: doc.acceptableMax,
      qualitativeExpected: doc.qualitativeExpected,
      unit: doc.unit,
      qcStatus: doc.qcStatus,
      ruleEvaluation: doc.ruleEvaluation,
      operatorId: doc.operatorId.toString(),
      operatorName: doc.operatorName,
      runDate: doc.runDate.toISOString(),
      comments: doc.comments,
      incidentId: doc.incidentId?.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private async logAudit(params: {
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await AuditLogModel.create({
          actorId:
            params.actorId && Types.ObjectId.isValid(params.actorId)
              ? new Types.ObjectId(params.actorId)
              : undefined,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          timestamp: new Date(),
          requestId: crypto.randomUUID(),
          outcome: 'SUCCESS',
          metadata: params.metadata || {},
        });
      }
    } catch {
      // Safe catch
    }
  }
}

export const qualityControlService = new QualityControlService();
