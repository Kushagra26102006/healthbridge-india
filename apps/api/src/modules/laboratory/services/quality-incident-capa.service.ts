import mongoose, { Types } from 'mongoose';
import {
  QualityIncidentDto,
  CreateQualityIncidentDto,
  UpdateQualityIncidentDto,
  CAPADto,
  CreateCAPADto,
  UpdateCAPADto,
  AddCAPAActionItemDto,
  ReviewCAPADto,
} from '@healthbridge/shared-types';
import { QualityIncidentModel, IQualityIncidentDocument } from '../models/quality-incident.model';
import { CAPAModel, ICAPADocument } from '../models/capa.model';
import { LabInstrumentModel } from '../models/lab-instrument.model';
import { ReagentLotModel } from '../models/reagent.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';
import crypto from 'crypto';

export class QualityIncidentCapaService {
  /**
   * Create a Quality Incident.
   */
  async createIncident(
    laboratoryId: string,
    reportedBy: { id: string; name: string },
    dto: CreateQualityIncidentDto
  ): Promise<QualityIncidentDto> {
    const labObjId = new Types.ObjectId(laboratoryId);
    const incidentReference = `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let relatedInstrumentName: string | undefined;
    if (dto.relatedInstrumentId && Types.ObjectId.isValid(dto.relatedInstrumentId)) {
      const inst = await LabInstrumentModel.findById(dto.relatedInstrumentId);
      if (inst) relatedInstrumentName = inst.instrumentName;
    }

    let relatedReagentLotNumber: string | undefined;
    if (dto.relatedReagentLotId && Types.ObjectId.isValid(dto.relatedReagentLotId)) {
      const lot = await ReagentLotModel.findById(dto.relatedReagentLotId);
      if (lot) relatedReagentLotNumber = lot.lotNumber;
    }

    const doc = await QualityIncidentModel.create({
      incidentReference,
      laboratoryId: labObjId,
      category: dto.category,
      severity: dto.severity,
      title: dto.title,
      description: dto.description,
      relatedTestCode: dto.relatedTestCode,
      relatedInstrumentId:
        dto.relatedInstrumentId && Types.ObjectId.isValid(dto.relatedInstrumentId)
          ? new Types.ObjectId(dto.relatedInstrumentId)
          : undefined,
      relatedInstrumentName,
      relatedReagentLotId:
        dto.relatedReagentLotId && Types.ObjectId.isValid(dto.relatedReagentLotId)
          ? new Types.ObjectId(dto.relatedReagentLotId)
          : undefined,
      relatedReagentLotNumber,
      relatedQCRunId:
        dto.relatedQCRunId && Types.ObjectId.isValid(dto.relatedQCRunId)
          ? new Types.ObjectId(dto.relatedQCRunId)
          : undefined,
      affectedOrderIds: (dto.affectedOrderIds || [])
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id)),
      affectedReportIds: (dto.affectedReportIds || [])
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id)),
      reportedById: new Types.ObjectId(reportedBy.id),
      reportedByName: reportedBy.name,
      assignedInvestigatorId:
        dto.assignedInvestigatorId && Types.ObjectId.isValid(dto.assignedInvestigatorId)
          ? new Types.ObjectId(dto.assignedInvestigatorId)
          : undefined,
      status: 'OPEN',
    });

    await this.logAudit({
      actorId: reportedBy.id,
      action: 'QUALITY_INCIDENT_CREATED',
      resourceType: 'QUALITY_INCIDENT',
      resourceId: doc._id.toString(),
      metadata: { incidentReference, category: dto.category, severity: dto.severity },
    });

    return this.mapIncident(doc);
  }

  /**
   * List Incidents with filtering and pagination.
   */
  async listIncidents(
    laboratoryId: string,
    query: {
      category?: string;
      severity?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: QualityIncidentDto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.category) filter.category = query.category;
    if (query.severity) filter.severity = query.severity;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { incidentReference: { $regex: query.search, $options: 'i' } },
        { title: { $regex: query.search, $options: 'i' } },
        { relatedTestCode: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      QualityIncidentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      QualityIncidentModel.countDocuments(filter),
    ]);

    return {
      items: items.map((i) => this.mapIncident(i)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get incident by ID.
   */
  async getIncidentById(laboratoryId: string, id: string): Promise<QualityIncidentDto | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await QualityIncidentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    return doc ? this.mapIncident(doc) : null;
  }

  /**
   * Update Incident.
   */
  async updateIncident(
    laboratoryId: string,
    id: string,
    updatedBy: { id: string; name: string },
    dto: UpdateQualityIncidentDto
  ): Promise<QualityIncidentDto> {
    const doc = await QualityIncidentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Quality Incident not found or access denied');

    if (dto.severity) doc.severity = dto.severity;
    if (dto.assignedInvestigatorId && Types.ObjectId.isValid(dto.assignedInvestigatorId)) {
      doc.assignedInvestigatorId = new Types.ObjectId(dto.assignedInvestigatorId);
      doc.status = 'UNDER_INVESTIGATION';
    }
    if (dto.investigationNotes !== undefined) doc.investigationNotes = dto.investigationNotes;
    if (dto.rootCauseCategory !== undefined) doc.rootCauseCategory = dto.rootCauseCategory;
    if (dto.rootCauseAnalysis !== undefined) doc.rootCauseAnalysis = dto.rootCauseAnalysis;
    if (dto.status) doc.status = dto.status;
    if (dto.resolutionNotes !== undefined) doc.resolutionNotes = dto.resolutionNotes;

    await doc.save();

    await this.logAudit({
      actorId: updatedBy.id,
      action: 'QUALITY_INCIDENT_UPDATED',
      resourceType: 'QUALITY_INCIDENT',
      resourceId: doc._id.toString(),
      metadata: { status: doc.status },
    });

    return this.mapIncident(doc);
  }

  /**
   * Resolve Incident.
   */
  async resolveIncident(
    laboratoryId: string,
    id: string,
    resolvedBy: { id: string; name: string },
    resolutionNotes: string
  ): Promise<QualityIncidentDto> {
    const doc = await QualityIncidentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Quality Incident not found or access denied');

    doc.status = 'RESOLVED';
    doc.resolvedById = new Types.ObjectId(resolvedBy.id);
    doc.resolvedByName = resolvedBy.name;
    doc.resolvedAt = new Date();
    doc.resolutionNotes = resolutionNotes;

    await doc.save();

    await this.logAudit({
      actorId: resolvedBy.id,
      action: 'QUALITY_INCIDENT_RESOLVED',
      resourceType: 'QUALITY_INCIDENT',
      resourceId: doc._id.toString(),
      metadata: { resolutionNotes },
    });

    return this.mapIncident(doc);
  }

  /**
   * Close Incident.
   */
  async closeIncident(
    laboratoryId: string,
    id: string,
    closedBy: { id: string; name: string }
  ): Promise<QualityIncidentDto> {
    const doc = await QualityIncidentModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('Quality Incident not found or access denied');

    doc.status = 'CLOSED';
    doc.closedById = new Types.ObjectId(closedBy.id);
    doc.closedByName = closedBy.name;
    doc.closedAt = new Date();

    await doc.save();

    await this.logAudit({
      actorId: closedBy.id,
      action: 'QUALITY_INCIDENT_CLOSED',
      resourceType: 'QUALITY_INCIDENT',
      resourceId: doc._id.toString(),
    });

    return this.mapIncident(doc);
  }

  /**
   * Create a Corrective and Preventive Action (CAPA).
   */
  async createCAPA(
    laboratoryId: string,
    createdBy: { id: string; name: string },
    dto: CreateCAPADto
  ): Promise<CAPADto> {
    const labObjId = new Types.ObjectId(laboratoryId);
    const incident = await QualityIncidentModel.findOne({
      _id: new Types.ObjectId(dto.incidentId),
      laboratoryId: labObjId,
    });
    if (!incident) throw AppError.notFound('Referenced Quality Incident not found or access denied');

    const capaReference = `CAPA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialActions = (dto.initialActions || []).map((action, idx) => ({
      actionId: `ACT-${idx + 1}`,
      description: action.description,
      assignedToId: new Types.ObjectId(action.assignedToId),
      assignedToName: 'Assigned User',
      dueDate: new Date(action.dueDate),
      status: 'PENDING' as const,
    }));

    const capaDoc = await CAPAModel.create({
      capaReference,
      incidentId: incident._id,
      incidentReference: incident.incidentReference,
      laboratoryId: labObjId,
      problemStatement: dto.problemStatement,
      rootCauseCategory: dto.rootCauseCategory,
      rootCauseAnalysis: dto.rootCauseAnalysis,
      correctiveAction: dto.correctiveAction,
      preventiveAction: dto.preventiveAction,
      assignedOwnerId: new Types.ObjectId(dto.assignedOwnerId),
      assignedOwnerName: createdBy.name,
      dueDate: new Date(dto.dueDate),
      priority: dto.priority || 'MEDIUM',
      status: 'OPEN',
      actions: initialActions,
      verificationMethod: dto.verificationMethod,
    });

    // Link CAPA back to Incident
    incident.capaId = capaDoc._id as any;
    incident.status = 'ACTION_REQUIRED';
    await incident.save();

    await this.logAudit({
      actorId: createdBy.id,
      action: 'CAPA_CREATED',
      resourceType: 'CAPA',
      resourceId: capaDoc._id.toString(),
      metadata: { capaReference, incidentReference: incident.incidentReference },
    });

    return this.mapCAPA(capaDoc);
  }

  /**
   * List CAPAs.
   */
  async listCAPAs(
    laboratoryId: string,
    query: {
      status?: string;
      priority?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ items: CAPADto[]; total: number; page: number; limit: number }> {
    const filter: any = { laboratoryId: new Types.ObjectId(laboratoryId) };
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.search) {
      filter.$or = [
        { capaReference: { $regex: query.search, $options: 'i' } },
        { problemStatement: { $regex: query.search, $options: 'i' } },
        { incidentReference: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CAPAModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CAPAModel.countDocuments(filter),
    ]);

    return {
      items: items.map((c) => this.mapCAPA(c)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get CAPA by ID.
   */
  async getCAPAById(laboratoryId: string, id: string): Promise<CAPADto | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await CAPAModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    return doc ? this.mapCAPA(doc) : null;
  }

  /**
   * Update CAPA.
   */
  async updateCAPA(
    laboratoryId: string,
    id: string,
    updatedBy: { id: string; name: string },
    dto: UpdateCAPADto
  ): Promise<CAPADto> {
    const doc = await CAPAModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('CAPA not found or access denied');

    if (dto.problemStatement) doc.problemStatement = dto.problemStatement;
    if (dto.rootCauseAnalysis) doc.rootCauseAnalysis = dto.rootCauseAnalysis;
    if (dto.correctiveAction) doc.correctiveAction = dto.correctiveAction;
    if (dto.preventiveAction) doc.preventiveAction = dto.preventiveAction;
    if (dto.assignedOwnerId && Types.ObjectId.isValid(dto.assignedOwnerId)) {
      doc.assignedOwnerId = new Types.ObjectId(dto.assignedOwnerId);
    }
    if (dto.dueDate) doc.dueDate = new Date(dto.dueDate);
    if (dto.priority) doc.priority = dto.priority;
    if (dto.status) doc.status = dto.status;
    if (dto.verificationMethod !== undefined) doc.verificationMethod = dto.verificationMethod;

    await doc.save();

    await this.logAudit({
      actorId: updatedBy.id,
      action: 'CAPA_UPDATED',
      resourceType: 'CAPA',
      resourceId: doc._id.toString(),
      metadata: { status: doc.status },
    });

    return this.mapCAPA(doc);
  }

  /**
   * Add Action Item to CAPA.
   */
  async addCAPAActionItem(
    laboratoryId: string,
    id: string,
    _addedBy: { id: string; name: string },
    dto: AddCAPAActionItemDto
  ): Promise<CAPADto> {
    const doc = await CAPAModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('CAPA not found or access denied');

    const nextId = `ACT-${doc.actions.length + 1}`;
    doc.actions.push({
      actionId: nextId,
      description: dto.description,
      assignedToId: new Types.ObjectId(dto.assignedToId),
      assignedToName: 'Assigned User',
      dueDate: new Date(dto.dueDate),
      status: 'PENDING',
    });

    if (doc.status === 'OPEN') {
      doc.status = 'IN_PROGRESS';
    }

    await doc.save();
    return this.mapCAPA(doc);
  }

  /**
   * Review CAPA effectiveness.
   */
  async reviewCAPAEffectiveness(
    laboratoryId: string,
    id: string,
    reviewedBy: { id: string; name: string },
    dto: ReviewCAPADto
  ): Promise<CAPADto> {
    const doc = await CAPAModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('CAPA not found or access denied');

    doc.verifiedById = new Types.ObjectId(reviewedBy.id);
    doc.verifiedByName = reviewedBy.name;
    doc.verifiedAt = new Date();
    doc.effectivenessResult = dto.effectivenessResult;
    doc.effectivenessReviewNotes = dto.effectivenessReviewNotes;

    if (dto.effectivenessResult === 'EFFECTIVE') {
      doc.status = 'CLOSED';
      doc.closedById = new Types.ObjectId(reviewedBy.id);
      doc.closedByName = reviewedBy.name;
      doc.closedAt = new Date();
    } else {
      doc.status = 'INEFFECTIVE';
    }

    await doc.save();

    await this.logAudit({
      actorId: reviewedBy.id,
      action: 'CAPA_EFFECTIVENESS_REVIEWED',
      resourceType: 'CAPA',
      resourceId: doc._id.toString(),
      metadata: { result: dto.effectivenessResult },
    });

    return this.mapCAPA(doc);
  }

  /**
   * Reopen Ineffective CAPA.
   */
  async reopenCAPA(
    laboratoryId: string,
    id: string,
    reopenedBy: { id: string; name: string },
    reason: string
  ): Promise<CAPADto> {
    const doc = await CAPAModel.findOne({
      _id: new Types.ObjectId(id),
      laboratoryId: new Types.ObjectId(laboratoryId),
    });
    if (!doc) throw AppError.notFound('CAPA not found or access denied');

    doc.status = 'OPEN';
    doc.reopenReason = reason;
    doc.closedById = undefined;
    doc.closedByName = undefined;
    doc.closedAt = undefined;

    await doc.save();

    await this.logAudit({
      actorId: reopenedBy.id,
      action: 'CAPA_REOPENED',
      resourceType: 'CAPA',
      resourceId: doc._id.toString(),
      metadata: { reason },
    });

    return this.mapCAPA(doc);
  }

  private mapIncident(doc: IQualityIncidentDocument): QualityIncidentDto {
    return {
      id: doc._id.toString(),
      incidentReference: doc.incidentReference,
      laboratoryId: doc.laboratoryId.toString(),
      category: doc.category,
      severity: doc.severity,
      title: doc.title,
      description: doc.description,
      relatedTestCode: doc.relatedTestCode,
      relatedInstrumentId: doc.relatedInstrumentId?.toString(),
      relatedInstrumentName: doc.relatedInstrumentName,
      relatedReagentLotId: doc.relatedReagentLotId?.toString(),
      relatedReagentLotNumber: doc.relatedReagentLotNumber,
      relatedQCRunId: doc.relatedQCRunId?.toString(),
      affectedOrderIds: (doc.affectedOrderIds || []).map((i) => i.toString()),
      affectedReportIds: (doc.affectedReportIds || []).map((i) => i.toString()),
      reportedById: doc.reportedById.toString(),
      reportedByName: doc.reportedByName,
      assignedInvestigatorId: doc.assignedInvestigatorId?.toString(),
      assignedInvestigatorName: doc.assignedInvestigatorName,
      investigationNotes: doc.investigationNotes,
      rootCauseCategory: doc.rootCauseCategory,
      rootCauseAnalysis: doc.rootCauseAnalysis,
      status: doc.status,
      resolvedById: doc.resolvedById?.toString(),
      resolvedByName: doc.resolvedByName,
      resolvedAt: doc.resolvedAt?.toISOString(),
      resolutionNotes: doc.resolutionNotes,
      closedById: doc.closedById?.toString(),
      closedByName: doc.closedByName,
      closedAt: doc.closedAt?.toISOString(),
      capaId: doc.capaId?.toString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private mapCAPA(doc: ICAPADocument): CAPADto {
    return {
      id: doc._id.toString(),
      capaReference: doc.capaReference,
      incidentId: doc.incidentId.toString(),
      incidentReference: doc.incidentReference,
      laboratoryId: doc.laboratoryId.toString(),
      problemStatement: doc.problemStatement,
      rootCauseCategory: doc.rootCauseCategory,
      rootCauseAnalysis: doc.rootCauseAnalysis,
      correctiveAction: doc.correctiveAction,
      preventiveAction: doc.preventiveAction,
      assignedOwnerId: doc.assignedOwnerId.toString(),
      assignedOwnerName: doc.assignedOwnerName,
      dueDate: (doc.dueDate.toISOString().split('T')[0] as string),
      priority: doc.priority,
      status: doc.status,
      actions: (doc.actions || []).map((a) => ({
        actionId: a.actionId,
        description: a.description,
        assignedToId: a.assignedToId.toString(),
        assignedToName: a.assignedToName,
        dueDate: (a.dueDate.toISOString().split('T')[0] as string),
        status: a.status,
        completedAt: a.completedAt?.toISOString(),
        verificationNotes: a.verificationNotes,
      })),
      verificationMethod: doc.verificationMethod,
      verifiedById: doc.verifiedById?.toString(),
      verifiedByName: doc.verifiedByName,
      verifiedAt: doc.verifiedAt?.toISOString(),
      effectivenessReviewNotes: doc.effectivenessReviewNotes,
      effectivenessResult: doc.effectivenessResult,
      closedById: doc.closedById?.toString(),
      closedByName: doc.closedByName,
      closedAt: doc.closedAt?.toISOString(),
      reopenReason: doc.reopenReason,
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

export const qualityIncidentCapaService = new QualityIncidentCapaService();
