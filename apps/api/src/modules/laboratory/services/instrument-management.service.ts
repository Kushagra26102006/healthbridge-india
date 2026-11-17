import mongoose, { Types } from 'mongoose';
import {
  LabInstrumentDto,
  CreateLabInstrumentDto,
  UpdateLabInstrumentDto,
  InstrumentOperatingStatus,
  InstrumentCalibrationDto,
  RecordCalibrationDto,
  ClearCalibrationDto,
  InstrumentMaintenanceDto,
  ScheduleMaintenanceDto,
  CompleteMaintenanceDto,
  TestInstrumentMappingDto,
  ConfigureTestInstrumentMappingDto,
} from '@healthbridge/shared-types';
import { LabInstrumentModel, ILabInstrumentDocument } from '../models/lab-instrument.model';
import {
  InstrumentCalibrationModel,
  IInstrumentCalibrationDocument,
} from '../models/instrument-calibration.model';
import {
  InstrumentMaintenanceModel,
  IInstrumentMaintenanceDocument,
} from '../models/instrument-maintenance.model';
import {
  TestInstrumentMappingModel,
} from '../models/test-instrument-mapping.model';
import { qualityIncidentCapaService } from './quality-incident-capa.service';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';
import crypto from 'crypto';

export class InstrumentManagementService {
  /**
   * Register a new laboratory instrument.
   */
  async createInstrument(
    laboratoryId: string,
    createdBy: { id: string; name: string },
    dto: CreateLabInstrumentDto
  ): Promise<LabInstrumentDto> {
    const labObjId = new Types.ObjectId(laboratoryId);

    const existing = await LabInstrumentModel.findOne({
      laboratoryId: labObjId,
      instrumentIdentifier: dto.instrumentIdentifier.toUpperCase(),
    });
    if (existing) {
      throw AppError.conflict(
        `Instrument with identifier ${dto.instrumentIdentifier} already exists in this laboratory.`
      );
    }

    const doc = await LabInstrumentModel.create({
      laboratoryId: labObjId,
      instrumentIdentifier: dto.instrumentIdentifier.toUpperCase(),
      instrumentName: dto.instrumentName,
      manufacturer: dto.manufacturer,
      model: dto.model,
      serialNumber: dto.serialNumber,
      category: dto.category,
      department: dto.department,
      associatedTestCodes: (dto.associatedTestCodes || []).map((t) => t.toUpperCase()),
      operatingStatus: dto.operatingStatus || 'ACTIVE',
      installationDate: new Date(dto.installationDate),
      warrantyExpiryDate: dto.warrantyExpiryDate ? new Date(dto.warrantyExpiryDate) : undefined,
      nextCalibrationDate: dto.nextCalibrationDate ? new Date(dto.nextCalibrationDate) : undefined,
      nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : undefined,
      calibrationStatus: 'PENDING',
      maintenanceProvider: dto.maintenanceProvider,
    });

    await this.logAudit({
      actorId: createdBy.id,
      action: 'INSTRUMENT_REGISTERED',
      resourceType: 'LAB_INSTRUMENT',
      resourceId: doc._id.toString(),
      metadata: {
        identifier: dto.instrumentIdentifier,
        name: dto.instrumentName,
      },
    });

    return this.mapInstrument(doc);
  }

  /**
   * Update Instrument details.
   */
  async updateInstrument(
    laboratoryId: string,
    id: string,
    updatedBy: { id: string; name: string },
    dto: UpdateLabInstrumentDto
  ): Promise<LabInstrumentDto> {
    const doc = await LabInstrumentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Instrument not found or access denied');

    if (dto.instrumentName) doc.instrumentName = dto.instrumentName;
    if (dto.category) doc.category = dto.category;
    if (dto.department !== undefined) doc.department = dto.department;
    if (dto.associatedTestCodes)
      doc.associatedTestCodes = dto.associatedTestCodes.map((t) => t.toUpperCase());
    if (dto.operatingStatus) doc.operatingStatus = dto.operatingStatus;
    if (dto.statusReason !== undefined) doc.statusReason = dto.statusReason;
    if (dto.warrantyExpiryDate) doc.warrantyExpiryDate = new Date(dto.warrantyExpiryDate);
    if (dto.nextCalibrationDate) doc.nextCalibrationDate = new Date(dto.nextCalibrationDate);
    if (dto.nextMaintenanceDate) doc.nextMaintenanceDate = new Date(dto.nextMaintenanceDate);
    if (dto.maintenanceProvider !== undefined) doc.maintenanceProvider = dto.maintenanceProvider;

    await doc.save();

    await this.logAudit({
      actorId: updatedBy.id,
      action: 'INSTRUMENT_UPDATED',
      resourceType: 'LAB_INSTRUMENT',
      resourceId: doc._id.toString(),
      metadata: { operatingStatus: doc.operatingStatus },
    });

    return this.mapInstrument(doc);
  }

  /**
   * Change instrument operating status.
   */
  async changeOperatingStatus(
    laboratoryId: string,
    id: string,
    updatedBy: { id: string; name: string },
    operatingStatus: InstrumentOperatingStatus,
    statusReason: string
  ): Promise<LabInstrumentDto> {
    const doc = await LabInstrumentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Instrument not found or access denied');

    doc.operatingStatus = operatingStatus;
    doc.statusReason = statusReason;
    await doc.save();

    await this.logAudit({
      actorId: updatedBy.id,
      action: 'INSTRUMENT_STATUS_CHANGED',
      resourceType: 'LAB_INSTRUMENT',
      resourceId: doc._id.toString(),
      metadata: { operatingStatus, statusReason },
    });

    return this.mapInstrument(doc);
  }

  /**
   * List instruments.
   */
  async listInstruments(
    laboratoryId: string,
    query: {
      category?: string;
      operatingStatus?: string;
      testCode?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: LabInstrumentDto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.category) filter.category = query.category;
    if (query.operatingStatus) filter.operatingStatus = query.operatingStatus;
    if (query.testCode) filter.associatedTestCodes = query.testCode.toUpperCase();
    if (query.search) {
      filter.$or = [
        { instrumentIdentifier: { $regex: query.search, $options: 'i' } },
        { instrumentName: { $regex: query.search, $options: 'i' } },
        { manufacturer: { $regex: query.search, $options: 'i' } },
        { model: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      LabInstrumentModel.find(filter).sort({ instrumentName: 1 }).skip(skip).limit(limit),
      LabInstrumentModel.countDocuments(filter),
    ]);

    return {
      items: items.map((i) => this.mapInstrument(i)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get instrument by ID.
   */
  async getInstrumentById(laboratoryId: string, id: string): Promise<LabInstrumentDto | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await LabInstrumentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    return doc ? this.mapInstrument(doc) : null;
  }

  /**
   * Schedule Calibration.
   */
  async scheduleCalibration(
    laboratoryId: string,
    instrumentId: string,
    _scheduledBy: { id: string; name: string },
    scheduledDate: string,
    dueDate: string,
    calibrationType: 'ROUTINE' | 'POST_REPAIR' | 'INITIAL' | 'VERIFICATION' = 'ROUTINE'
  ): Promise<InstrumentCalibrationDto> {
    const instrument = await LabInstrumentModel.findOne({
      _id: new Types.ObjectId(instrumentId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!instrument) throw AppError.notFound('Instrument not found or access denied');

    const calibrationReference = `CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const doc = await InstrumentCalibrationModel.create({
      calibrationReference,
      instrumentId: instrument._id,
      instrumentName: instrument.instrumentName,
      laboratoryId: new Types.ObjectId(laboratoryId),
      calibrationType,
      scheduledDate: new Date(scheduledDate),
      dueDate: new Date(dueDate),
      status: 'SCHEDULED',
      parametersChecked: [],
    });

    return this.mapCalibration(doc);
  }

  /**
   * Record Calibration Activity and Outcome.
   */
  async recordCalibration(
    laboratoryId: string,
    instrumentId: string,
    performedBy: { id: string; name: string },
    dto: RecordCalibrationDto
  ): Promise<InstrumentCalibrationDto> {
    const instrument = await LabInstrumentModel.findOne({
      _id: new Types.ObjectId(instrumentId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!instrument) throw AppError.notFound('Instrument not found or access denied');

    const calibrationReference = `CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = dto.calibrationResult === 'PASSED' ? 'PASSED' : 'FAILED';

    const doc = await InstrumentCalibrationModel.create({
      calibrationReference,
      instrumentId: instrument._id,
      instrumentName: instrument.instrumentName,
      laboratoryId: new Types.ObjectId(laboratoryId),
      calibrationType: dto.calibrationType,
      scheduledDate: new Date(),
      performedDate: new Date(dto.performedDate),
      dueDate: new Date(dto.dueDate),
      performedById: new Types.ObjectId(performedBy.id),
      performedByName: performedBy.name,
      calibrationResult: dto.calibrationResult,
      status,
      standardsUsed: dto.standardsUsed,
      parametersChecked: dto.parametersChecked || [],
      certificateNumber: dto.certificateNumber,
      certificateUrl: dto.certificateUrl,
      notes: dto.notes,
    });

    // Update Instrument State
    if (dto.calibrationResult === 'FAILED') {
      instrument.calibrationStatus = 'FAILED';
      instrument.operatingStatus = 'OUT_OF_SERVICE';
      instrument.statusReason = `Calibration failed on ${dto.performedDate}: ${dto.notes || 'Out of tolerance'}. Instrument restricted from test processing.`;

      // Trigger automatic incident
      await qualityIncidentCapaService.createIncident(laboratoryId, performedBy, {
        category: 'CALIBRATION_FAILURE',
        severity: 'HIGH',
        title: `Calibration Failure: ${instrument.instrumentName} (${instrument.instrumentIdentifier})`,
        description: `Instrument failed calibration (${calibrationReference}). Parameters checked: ${dto.parametersChecked?.length || 0}. Notes: ${dto.notes || 'None'}. Instrument placed OUT_OF_SERVICE.`,
        relatedInstrumentId: instrument._id.toString(),
      });
    } else {
      instrument.calibrationStatus = 'PASSED';
      instrument.lastCalibrationDate = new Date(dto.performedDate);
      instrument.nextCalibrationDate = new Date(dto.dueDate);
      if (instrument.operatingStatus === 'OUT_OF_SERVICE' && instrument.statusReason?.includes('Calibration')) {
        instrument.operatingStatus = 'ACTIVE';
        instrument.statusReason = undefined;
      }
    }

    await instrument.save();

    await this.logAudit({
      actorId: performedBy.id,
      action: 'CALIBRATION_RECORDED',
      resourceType: 'CALIBRATION',
      resourceId: doc._id.toString(),
      metadata: {
        instrumentIdentifier: instrument.instrumentIdentifier,
        result: dto.calibrationResult,
      },
    });

    return this.mapCalibration(doc);
  }

  /**
   * Clear Calibration Restriction with authorized sign-off.
   */
  async clearCalibrationRestriction(
    laboratoryId: string,
    calibrationId: string,
    clearedBy: { id: string; name: string },
    dto: ClearCalibrationDto
  ): Promise<InstrumentCalibrationDto> {
    const doc = await InstrumentCalibrationModel.findOne({
      _id: new Types.ObjectId(calibrationId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Calibration record not found or access denied');

    doc.clearedById = new Types.ObjectId(clearedBy.id);
    doc.clearedByName = clearedBy.name;
    doc.clearedAt = new Date();
    doc.clearanceNotes = dto.clearanceNotes;
    await doc.save();

    // Restore instrument
    const instrument = await LabInstrumentModel.findById(doc.instrumentId);
    if (instrument) {
      instrument.calibrationStatus = 'PASSED';
      instrument.operatingStatus = 'ACTIVE';
      instrument.statusReason = `Calibration restriction cleared by ${clearedBy.name}: ${dto.clearanceNotes}`;
      await instrument.save();
    }

    await this.logAudit({
      actorId: clearedBy.id,
      action: 'CALIBRATION_RESTRICTION_CLEARED',
      resourceType: 'CALIBRATION',
      resourceId: doc._id.toString(),
      metadata: { clearanceNotes: dto.clearanceNotes },
    });

    return this.mapCalibration(doc);
  }

  /**
   * List Calibration Records.
   */
  async listCalibrations(
    laboratoryId: string,
    query: { instrumentId?: string; status?: string; page?: number; limit?: number }
  ): Promise<{ items: InstrumentCalibrationDto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.instrumentId) filter.instrumentId = new Types.ObjectId(query.instrumentId);
    if (query.status) filter.status = query.status;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InstrumentCalibrationModel.find(filter).sort({ dueDate: 1 }).skip(skip).limit(limit),
      InstrumentCalibrationModel.countDocuments(filter),
    ]);

    return {
      items: items.map((c) => this.mapCalibration(c)),
      total,
      page,
      limit,
    };
  }

  /**
   * Schedule Maintenance.
   */
  async scheduleMaintenance(
    laboratoryId: string,
    instrumentId: string,
    _scheduledBy: { id: string; name: string },
    dto: ScheduleMaintenanceDto
  ): Promise<InstrumentMaintenanceDto> {
    const instrument = await LabInstrumentModel.findOne({
      _id: new Types.ObjectId(instrumentId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!instrument) throw AppError.notFound('Instrument not found or access denied');

    const maintenanceReference = `MNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const doc = await InstrumentMaintenanceModel.create({
      maintenanceReference,
      instrumentId: instrument._id,
      instrumentName: instrument.instrumentName,
      laboratoryId: new Types.ObjectId(laboratoryId),
      maintenanceType: dto.maintenanceType,
      workDescription: dto.workDescription,
      scheduledDate: new Date(dto.scheduledDate),
      serviceProvider: dto.serviceProvider,
      status: 'SCHEDULED',
      partsReplaced: [],
    });

    if (dto.maintenanceType === 'BREAKDOWN') {
      instrument.operatingStatus = 'IN_MAINTENANCE';
      instrument.statusReason = `Unexpected breakdown: ${dto.workDescription}`;
      await instrument.save();
    }

    return this.mapMaintenance(doc);
  }

  /**
   * Complete Maintenance.
   */
  async completeMaintenance(
    laboratoryId: string,
    maintenanceId: string,
    completedBy: { id: string; name: string },
    dto: CompleteMaintenanceDto
  ): Promise<InstrumentMaintenanceDto> {
    const doc = await InstrumentMaintenanceModel.findOne({
      _id: new Types.ObjectId(maintenanceId),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Maintenance record not found or access denied');

    doc.completedDate = new Date(dto.completedDate);
    doc.technicianName = dto.technicianName;
    doc.maintenanceNotes = dto.maintenanceNotes;
    doc.downtimeHours = dto.downtimeHours;
    doc.partsReplaced = dto.partsReplaced || [];
    doc.nextScheduledDate = dto.nextScheduledDate ? new Date(dto.nextScheduledDate) : undefined;
    doc.cost = dto.cost;
    doc.status = 'COMPLETED';
    doc.completedById = new Types.ObjectId(completedBy.id);
    doc.completedByName = completedBy.name;

    await doc.save();

    // Update instrument
    const instrument = await LabInstrumentModel.findById(doc.instrumentId);
    if (instrument) {
      instrument.lastMaintenanceDate = new Date(dto.completedDate);
      if (dto.nextScheduledDate) {
        instrument.nextMaintenanceDate = new Date(dto.nextScheduledDate);
      }
      if (dto.restoreToActiveStatus) {
        instrument.operatingStatus = 'ACTIVE';
        instrument.statusReason = undefined;
      }
      await instrument.save();
    }

    await this.logAudit({
      actorId: completedBy.id,
      action: 'MAINTENANCE_COMPLETED',
      resourceType: 'MAINTENANCE',
      resourceId: doc._id.toString(),
      metadata: { maintenanceReference: doc.maintenanceReference, cost: dto.cost },
    });

    return this.mapMaintenance(doc);
  }

  /**
   * List Maintenance Records.
   */
  async listMaintenance(
    laboratoryId: string,
    query: { instrumentId?: string; status?: string; page?: number; limit?: number }
  ): Promise<{ items: InstrumentMaintenanceDto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.instrumentId) filter.instrumentId = new Types.ObjectId(query.instrumentId);
    if (query.status) filter.status = query.status;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InstrumentMaintenanceModel.find(filter).sort({ scheduledDate: -1 }).skip(skip).limit(limit),
      InstrumentMaintenanceModel.countDocuments(filter),
    ]);

    return {
      items: items.map((m) => this.mapMaintenance(m)),
      total,
      page,
      limit,
    };
  }

  /**
   * Configure Test-Instrument Mapping.
   */
  async configureTestInstrumentMapping(
    laboratoryId: string,
    dto: ConfigureTestInstrumentMappingDto
  ): Promise<TestInstrumentMappingDto> {
    const labObjId = new Types.ObjectId(laboratoryId);

    const instrument = await LabInstrumentModel.findOne({
      _id: new Types.ObjectId(dto.instrumentId),
      laboratoryId: labObjId,
    });
    if (!instrument) throw AppError.notFound('Instrument not found or access denied');

    let mapping = await TestInstrumentMappingModel.findOne({
      laboratoryId: labObjId,
      testCode: dto.testCode.toUpperCase(),
      instrumentId: instrument._id,
    });

    const reagentRequirements = (dto.reagentRequirements || []).map((r) => ({
      reagentId: new Types.ObjectId(r.reagentId),
      requiredQuantityPerTest: r.requiredQuantityPerTest,
    }));

    if (mapping) {
      mapping.isPrimary = dto.isPrimary ?? mapping.isPrimary;
      mapping.reagentRequirements = reagentRequirements;
      mapping.qcProfileId = dto.qcProfileId ? new Types.ObjectId(dto.qcProfileId) : undefined;
      mapping.isActive = dto.isActive ?? mapping.isActive;
      await mapping.save();
    } else {
      mapping = await TestInstrumentMappingModel.create({
        laboratoryId: labObjId,
        testCode: dto.testCode.toUpperCase(),
        instrumentId: instrument._id,
        isPrimary: dto.isPrimary ?? false,
        reagentRequirements,
        qcProfileId: dto.qcProfileId ? new Types.ObjectId(dto.qcProfileId) : undefined,
        isActive: dto.isActive ?? true,
      });
    }

    return {
      id: mapping._id.toString(),
      laboratoryId: mapping.laboratoryId.toString(),
      testCode: mapping.testCode,
      testName: mapping.testCode,
      instrumentId: mapping.instrumentId.toString(),
      instrumentName: instrument.instrumentName,
      isPrimary: mapping.isPrimary,
      qcProfileId: mapping.qcProfileId?.toString(),
      isActive: mapping.isActive,
      createdAt: mapping.createdAt.toISOString(),
      updatedAt: mapping.updatedAt.toISOString(),
    };
  }

  private mapInstrument(doc: ILabInstrumentDocument): LabInstrumentDto {
    return {
      id: doc._id.toString(),
      laboratoryId: doc.laboratoryId.toString(),
      instrumentIdentifier: doc.instrumentIdentifier,
      instrumentName: doc.instrumentName,
      manufacturer: doc.manufacturer,
      model: doc.model,
      serialNumber: doc.serialNumber,
      category: doc.category,
      department: doc.department,
      associatedTestCodes: doc.associatedTestCodes || [],
      operatingStatus: doc.operatingStatus,
      statusReason: doc.statusReason,
      installationDate: (doc.installationDate.toISOString().split('T')[0] as string),
      warrantyExpiryDate: doc.warrantyExpiryDate?.toISOString().split('T')[0],
      lastCalibrationDate: doc.lastCalibrationDate?.toISOString().split('T')[0],
      nextCalibrationDate: doc.nextCalibrationDate?.toISOString().split('T')[0],
      lastMaintenanceDate: doc.lastMaintenanceDate?.toISOString().split('T')[0],
      nextMaintenanceDate: doc.nextMaintenanceDate?.toISOString().split('T')[0],
      calibrationStatus: doc.calibrationStatus,
      maintenanceProvider: doc.maintenanceProvider,
      supportingDocuments: doc.supportingDocuments || [],
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapCalibration(doc: IInstrumentCalibrationDocument): InstrumentCalibrationDto {
    return {
      id: doc._id.toString(),
      calibrationReference: doc.calibrationReference,
      instrumentId: doc.instrumentId.toString(),
      instrumentName: doc.instrumentName,
      laboratoryId: doc.laboratoryId.toString(),
      calibrationType: doc.calibrationType,
      scheduledDate: (doc.scheduledDate.toISOString().split('T')[0] as string),
      performedDate: doc.performedDate?.toISOString().split('T')[0],
      dueDate: (doc.dueDate.toISOString().split('T')[0] as string),
      performedById: doc.performedById?.toString(),
      performedByName: doc.performedByName,
      verifierId: doc.verifierId?.toString(),
      verifierName: doc.verifierName,
      calibrationResult: doc.calibrationResult,
      status: doc.status,
      standardsUsed: doc.standardsUsed,
      parametersChecked: doc.parametersChecked || [],
      certificateNumber: doc.certificateNumber,
      certificateUrl: doc.certificateUrl,
      notes: doc.notes,
      clearedById: doc.clearedById?.toString(),
      clearedByName: doc.clearedByName,
      clearedAt: doc.clearedAt?.toISOString(),
      clearanceNotes: doc.clearanceNotes,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapMaintenance(doc: IInstrumentMaintenanceDocument): InstrumentMaintenanceDto {
    return {
      id: doc._id.toString(),
      maintenanceReference: doc.maintenanceReference,
      instrumentId: doc.instrumentId.toString(),
      instrumentName: doc.instrumentName,
      laboratoryId: doc.laboratoryId.toString(),
      maintenanceType: doc.maintenanceType,
      workDescription: doc.workDescription,
      scheduledDate: (doc.scheduledDate.toISOString().split('T')[0] as string),
      completedDate: doc.completedDate?.toISOString().split('T')[0],
      technicianName: doc.technicianName,
      serviceProvider: doc.serviceProvider,
      maintenanceNotes: doc.maintenanceNotes,
      downtimeHours: doc.downtimeHours,
      partsReplaced: doc.partsReplaced || [],
      nextScheduledDate: doc.nextScheduledDate?.toISOString().split('T')[0],
      cost: doc.cost,
      status: doc.status,
      completedById: doc.completedById?.toString(),
      completedByName: doc.completedByName,
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

export const instrumentManagementService = new InstrumentManagementService();
