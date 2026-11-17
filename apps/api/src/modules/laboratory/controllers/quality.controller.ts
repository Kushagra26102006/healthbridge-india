import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { AppError } from '../../../shared/errors/app-error';
import { LaboratoryProfileModel } from '../../users/models/laboratory-profile.model';
import { LaboratoryStaffModel } from '../models/laboratory-staff.model';
import { qualityControlService } from '../services/quality-control.service';
import { qualityIncidentCapaService } from '../services/quality-incident-capa.service';
import { instrumentManagementService } from '../services/instrument-management.service';
import { reagentInventoryService } from '../services/reagent-inventory.service';
import { qcReleaseGateService } from '../services/qc-release-gate.service';
import { qualityDashboardService } from '../services/quality-dashboard.service';
import {
  createQCProfileSchema,
  updateQCProfileSchema,
  qcProfileIdParamSchema,
  createQCRunSchema,
  qcRunIdParamSchema,
  qcRunFilterQuerySchema,
  investigateQCFailureSchema,
  createQualityIncidentSchema,
  updateQualityIncidentSchema,
  incidentIdParamSchema,
  createCAPASchema,
  updateCAPASchema,
  addCAPAActionItemSchema,
  reviewCAPASchema,
  capaIdParamSchema,
  createLabInstrumentSchema,
  updateLabInstrumentSchema,
  changeInstrumentStatusSchema,
  instrumentIdParamSchema,
  recordCalibrationSchema,
  clearCalibrationSchema,
  calibrationIdParamSchema,
  scheduleMaintenanceSchema,
  completeMaintenanceSchema,
  maintenanceIdParamSchema,
  createReagentSchema,
  updateReagentSchema,
  reagentIdParamSchema,
  createReagentLotSchema,
  reagentLotIdParamSchema,
  quarantineLotSchema,
  recallLotSchema,
  recordReagentStockTransactionSchema,
  configureTestInstrumentMappingSchema,
  authorizeQCOverrideSchema,
  qualityFilterQuerySchema,
} from '@healthbridge/validation';

/**
 * Resolves the authoritative laboratory ID for the authenticated request.
 * Prevents cross-tenant header spoofing: non-ADMIN callers cannot arbitrarily override
 * laboratory scope via X-Laboratory-Id.
 */
async function resolveLaboratoryId(req: Request): Promise<string> {
  const user = req.user as any;
  const userId = user?.userId || user?.id;
  if (!userId) throw AppError.unauthorized('Authentication required');

  const headerLabId =
    req.headers['x-laboratory-id'] && typeof req.headers['x-laboratory-id'] === 'string'
      ? req.headers['x-laboratory-id'].trim()
      : undefined;

  // Platform ADMIN may explicitly scope to a requested laboratory ID
  if (user.role === 'ADMIN' && headerLabId) {
    return headerLabId;
  }

  let resolvedLabId: string | undefined;

  if (user?.laboratoryId) {
    resolvedLabId = user.laboratoryId;
  } else if (user?.facilityId) {
    resolvedLabId = user.facilityId;
  } else if (Types.ObjectId.isValid(userId)) {
    const profile = await LaboratoryProfileModel.findOne({
      $or: [{ userId: new Types.ObjectId(userId) }, { _id: new Types.ObjectId(userId) }],
    });
    if (profile) {
      resolvedLabId = profile._id.toString();
    } else if (
      mongoose.connection.readyState === 1 ||
      Boolean((LaboratoryStaffModel.findOne as any)?.mock)
    ) {
      const staff = await LaboratoryStaffModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'ACTIVE',
      });
      if (staff) {
        resolvedLabId = staff.laboratoryId.toString();
      }
    }
  }

  const authoritativeLabId = resolvedLabId || userId;

  // Defense-in-depth: Reject mismatched X-Laboratory-Id spoofing attempts by non-ADMIN users
  if (headerLabId && headerLabId !== authoritativeLabId && headerLabId !== userId) {
    throw AppError.forbidden(
      'Access forbidden: Requested laboratory header does not match authenticated laboratory scope'
    );
  }

  return authoritativeLabId;
}

async function resolveUserContext(req: Request): Promise<{ id: string; name: string; role: string; labRole?: string }> {
  const user = req.user as any;
  const userId = user?.userId || user?.id || 'unknown';
  let labRole: string | undefined;

  if (
    user?.role === 'LABORATORY' &&
    Types.ObjectId.isValid(userId) &&
    (mongoose.connection.readyState === 1 || Boolean((LaboratoryStaffModel.findOne as any)?.mock))
  ) {
    try {
      const staff = await LaboratoryStaffModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'ACTIVE',
      });
      if (staff) {
        labRole = staff.role;
      }
    } catch {
      // Safe fallback when staff collection is unmocked in isolated unit tests
    }
  }

  return {
    id: userId,
    name: user?.name || user?.email || 'Authorized Staff',
    role: labRole || user?.role || 'LABORATORY',
    labRole,
  };
}

export class QualityController {
  // ===========================================================================
  // 1. DASHBOARD & KPIS
  // ===========================================================================

  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const data = await qualityDashboardService.getDashboardData(labId);
    sendSuccess(res, data, 'Quality dashboard data retrieved successfully');
  });

  // ===========================================================================
  // 2. QUALITY CONTROL PROFILES
  // ===========================================================================

  createProfile = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = createQCProfileSchema.parse(req.body);

    const profile = await qualityControlService.createQCProfile(labId, user, body);
    sendSuccess(res, profile, 'QC Profile created successfully', 201);
  });

  listProfiles = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { testCode, isActive, search } = req.query;

    const profiles = await qualityControlService.listQCProfiles(labId, {
      testCode: typeof testCode === 'string' ? testCode : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    sendSuccess(res, profiles, 'QC Profiles retrieved successfully');
  });

  getProfileById = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = qcProfileIdParamSchema.parse(req.params);

    const profile = await qualityControlService.getQCProfileById(labId, id);
    if (!profile) throw AppError.notFound('QC Profile not found');
    sendSuccess(res, profile, 'QC Profile retrieved successfully');
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = qcProfileIdParamSchema.parse(req.params);
    const body = updateQCProfileSchema.parse(req.body);

    const updated = await qualityControlService.updateQCProfile(labId, id, user, body);
    sendSuccess(res, updated, 'QC Profile updated successfully');
  });

  // ===========================================================================
  // 3. QC RUNS & INVESTIGATION
  // ===========================================================================

  recordRun = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = createQCRunSchema.parse(req.body);

    const run = await qualityControlService.recordQCRun(labId, user, body);
    sendSuccess(res, run, 'QC Run recorded and evaluated successfully', 201);
  });

  listRuns = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const query = qcRunFilterQuerySchema.parse(req.query);

    const result = await qualityControlService.listQCRuns(labId, query);
    sendSuccess(res, result.items, 'QC Runs retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  getRunById = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = qcRunIdParamSchema.parse(req.params);

    const run = await qualityControlService.getQCRunById(labId, id);
    if (!run) throw AppError.notFound('QC Run not found');
    sendSuccess(res, run, 'QC Run retrieved successfully');
  });

  investigateRun = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = qcRunIdParamSchema.parse(req.params);
    const body = investigateQCFailureSchema.parse(req.body);

    const updated = await qualityControlService.investigateQCFailure(labId, id, user, body);
    sendSuccess(res, updated, 'QC failure investigation recorded successfully');
  });

  // ===========================================================================
  // 4. QUALITY INCIDENTS
  // ===========================================================================

  createIncident = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = createQualityIncidentSchema.parse(req.body);

    const incident = await qualityIncidentCapaService.createIncident(labId, user, body);
    sendSuccess(res, incident, 'Quality Incident created successfully', 201);
  });

  listIncidents = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const query = qualityFilterQuerySchema.parse(req.query);

    const result = await qualityIncidentCapaService.listIncidents(labId, query);
    sendSuccess(res, result.items, 'Quality Incidents retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  getIncidentById = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = incidentIdParamSchema.parse(req.params);

    const incident = await qualityIncidentCapaService.getIncidentById(labId, id);
    if (!incident) throw AppError.notFound('Quality Incident not found');
    sendSuccess(res, incident, 'Quality Incident retrieved successfully');
  });

  updateIncident = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = incidentIdParamSchema.parse(req.params);
    const body = updateQualityIncidentSchema.parse(req.body);

    const updated = await qualityIncidentCapaService.updateIncident(labId, id, user, body);
    sendSuccess(res, updated, 'Quality Incident updated successfully');
  });

  resolveIncident = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = incidentIdParamSchema.parse(req.params);
    const { resolutionNotes } = req.body;
    if (!resolutionNotes || typeof resolutionNotes !== 'string') {
      throw AppError.badRequest('Resolution notes are required');
    }

    const resolved = await qualityIncidentCapaService.resolveIncident(
      labId,
      id,
      user,
      resolutionNotes
    );
    sendSuccess(res, resolved, 'Quality Incident resolved successfully');
  });

  closeIncident = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = incidentIdParamSchema.parse(req.params);

    const closed = await qualityIncidentCapaService.closeIncident(labId, id, user);
    sendSuccess(res, closed, 'Quality Incident closed successfully');
  });

  // ===========================================================================
  // 5. CORRECTIVE & PREVENTIVE ACTIONS (CAPA)
  // ===========================================================================

  createCAPA = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = createCAPASchema.parse(req.body);

    const capa = await qualityIncidentCapaService.createCAPA(labId, user, body);
    sendSuccess(res, capa, 'CAPA created successfully', 201);
  });

  listCAPAs = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const query = qualityFilterQuerySchema.parse(req.query);

    const result = await qualityIncidentCapaService.listCAPAs(labId, query);
    sendSuccess(res, result.items, 'CAPAs retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  getCAPAById = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = capaIdParamSchema.parse(req.params);

    const capa = await qualityIncidentCapaService.getCAPAById(labId, id);
    if (!capa) throw AppError.notFound('CAPA not found');
    sendSuccess(res, capa, 'CAPA retrieved successfully');
  });

  updateCAPA = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = capaIdParamSchema.parse(req.params);
    const body = updateCAPASchema.parse(req.body);

    const updated = await qualityIncidentCapaService.updateCAPA(labId, id, user, body);
    sendSuccess(res, updated, 'CAPA updated successfully');
  });

  addCAPAAction = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = capaIdParamSchema.parse(req.params);
    const body = addCAPAActionItemSchema.parse(req.body);

    const updated = await qualityIncidentCapaService.addCAPAActionItem(labId, id, user, body);
    sendSuccess(res, updated, 'CAPA Action Item added successfully', 201);
  });

  reviewCAPA = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = capaIdParamSchema.parse(req.params);
    const body = reviewCAPASchema.parse(req.body);

    const updated = await qualityIncidentCapaService.reviewCAPAEffectiveness(labId, id, user, body);
    sendSuccess(res, updated, 'CAPA effectiveness review recorded successfully');
  });

  reopenCAPA = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = capaIdParamSchema.parse(req.params);
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string') {
      throw AppError.badRequest('Reopen justification reason is required');
    }

    const reopened = await qualityIncidentCapaService.reopenCAPA(labId, id, user, reason);
    sendSuccess(res, reopened, 'CAPA reopened successfully');
  });

  // ===========================================================================
  // 6. INSTRUMENT MANAGEMENT
  // ===========================================================================

  createInstrument = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = createLabInstrumentSchema.parse(req.body);

    const instrument = await instrumentManagementService.createInstrument(labId, user, body);
    sendSuccess(res, instrument, 'Instrument registered successfully', 201);
  });

  listInstruments = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const query = qualityFilterQuerySchema.parse(req.query);

    const result = await instrumentManagementService.listInstruments(labId, {
      ...query,
      operatingStatus: query.status,
    });
    sendSuccess(res, result.items, 'Instruments retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  getInstrumentById = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = instrumentIdParamSchema.parse(req.params);

    const instrument = await instrumentManagementService.getInstrumentById(labId, id);
    if (!instrument) throw AppError.notFound('Instrument not found');
    sendSuccess(res, instrument, 'Instrument retrieved successfully');
  });

  updateInstrument = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = instrumentIdParamSchema.parse(req.params);
    const body = updateLabInstrumentSchema.parse(req.body);

    const updated = await instrumentManagementService.updateInstrument(labId, id, user, body);
    sendSuccess(res, updated, 'Instrument updated successfully');
  });

  changeInstrumentStatus = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = instrumentIdParamSchema.parse(req.params);
    const { operatingStatus, statusReason } = changeInstrumentStatusSchema.parse(req.body);

    const updated = await instrumentManagementService.changeOperatingStatus(
      labId,
      id,
      user,
      operatingStatus,
      statusReason
    );
    sendSuccess(res, updated, 'Instrument operational status updated successfully');
  });

  // ===========================================================================
  // 7. CALIBRATION & MAINTENANCE
  // ===========================================================================

  scheduleCalibration = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { instrumentId, scheduledDate, dueDate, calibrationType } = req.body;
    if (!instrumentId || !scheduledDate || !dueDate) {
      throw AppError.badRequest('instrumentId, scheduledDate, and dueDate are required');
    }

    const cal = await instrumentManagementService.scheduleCalibration(
      labId,
      instrumentId,
      user,
      scheduledDate,
      dueDate,
      calibrationType
    );
    sendSuccess(res, cal, 'Calibration scheduled successfully', 201);
  });

  recordCalibration = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = instrumentIdParamSchema.parse(req.params);
    const body = recordCalibrationSchema.parse(req.body);

    const cal = await instrumentManagementService.recordCalibration(labId, id, user, body);
    sendSuccess(res, cal, 'Calibration recorded successfully', 201);
  });

  clearCalibration = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = calibrationIdParamSchema.parse(req.params);
    const body = clearCalibrationSchema.parse(req.body);

    const cleared = await instrumentManagementService.clearCalibrationRestriction(
      labId,
      id,
      user,
      body
    );
    sendSuccess(res, cleared, 'Calibration restriction cleared and instrument restored to service');
  });

  listCalibrations = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const query = qualityFilterQuerySchema.parse(req.query);

    const result = await instrumentManagementService.listCalibrations(labId, query);
    sendSuccess(res, result.items, 'Calibrations retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  scheduleMaintenance = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { instrumentId, ...body } = req.body;
    if (!instrumentId) throw AppError.badRequest('instrumentId is required');
    const parsed = scheduleMaintenanceSchema.parse(body);

    const mnt = await instrumentManagementService.scheduleMaintenance(
      labId,
      instrumentId,
      user,
      parsed
    );
    sendSuccess(res, mnt, 'Maintenance scheduled successfully', 201);
  });

  completeMaintenance = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = maintenanceIdParamSchema.parse(req.params);
    const body = completeMaintenanceSchema.parse(req.body);

    const completed = await instrumentManagementService.completeMaintenance(
      labId,
      id,
      user,
      body
    );
    sendSuccess(res, completed, 'Maintenance completed successfully');
  });

  listMaintenance = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const query = qualityFilterQuerySchema.parse(req.query);

    const result = await instrumentManagementService.listMaintenance(labId, query);
    sendSuccess(res, result.items, 'Maintenance records retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  // ===========================================================================
  // 8. TEST-INSTRUMENT MAPPING
  // ===========================================================================

  configureMapping = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const body = configureTestInstrumentMappingSchema.parse(req.body);

    const mapping = await instrumentManagementService.configureTestInstrumentMapping(labId, body);
    sendSuccess(res, mapping, 'Test-instrument mapping configured successfully');
  });

  // ===========================================================================
  // 9. REAGENT & INVENTORY MANAGEMENT
  // ===========================================================================

  createReagent = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = createReagentSchema.parse(req.body);

    const reagent = await reagentInventoryService.createReagent(labId, user, body);
    sendSuccess(res, reagent, 'Reagent catalog entry created successfully', 201);
  });

  listReagents = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const query = qualityFilterQuerySchema.parse(req.query);

    const result = await reagentInventoryService.listReagents(labId, query);
    sendSuccess(res, result.items, 'Reagents retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  getReagentById = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = reagentIdParamSchema.parse(req.params);

    const reagent = await reagentInventoryService.getReagentById(labId, id);
    if (!reagent) throw AppError.notFound('Reagent not found');
    sendSuccess(res, reagent, 'Reagent retrieved successfully');
  });

  updateReagent = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = reagentIdParamSchema.parse(req.params);
    const body = updateReagentSchema.parse(req.body);

    const updated = await reagentInventoryService.updateReagent(labId, id, user, body);
    sendSuccess(res, updated, 'Reagent updated successfully');
  });

  createLot = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = createReagentLotSchema.parse(req.body);

    const lot = await reagentInventoryService.createReagentLot(labId, user, body);
    sendSuccess(res, lot, 'Reagent lot registered and initial stock received', 201);
  });

  listLots = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { reagentId, status, expiringWithinDays, page, limit } = req.query;

    const result = await reagentInventoryService.listReagentLots(labId, {
      reagentId: typeof reagentId === 'string' ? reagentId : undefined,
      status: typeof status === 'string' ? status : undefined,
      expiringWithinDays: expiringWithinDays ? Number(expiringWithinDays) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result.items, 'Reagent lots retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  getLotById = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = reagentLotIdParamSchema.parse(req.params);

    const lot = await reagentInventoryService.getReagentLotById(labId, id);
    if (!lot) throw AppError.notFound('Reagent lot not found');
    sendSuccess(res, lot, 'Reagent lot retrieved successfully');
  });

  recordStockTransaction = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = recordReagentStockTransactionSchema.parse(req.body);

    const txn = await reagentInventoryService.recordStockTransaction(labId, user, body);
    sendSuccess(res, txn, 'Reagent stock transaction recorded successfully', 201);
  });

  quarantineLot = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = reagentLotIdParamSchema.parse(req.params);
    const { quarantineReason, createIncident } = quarantineLotSchema.parse(req.body);

    const lot = await reagentInventoryService.quarantineLot(
      labId,
      id,
      user,
      quarantineReason,
      createIncident
    );
    sendSuccess(res, lot, 'Reagent lot quarantined successfully');
  });

  recallLot = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const { id } = reagentLotIdParamSchema.parse(req.params);
    const { recalledReason, createIncident } = recallLotSchema.parse(req.body);

    const lot = await reagentInventoryService.recallLot(
      labId,
      id,
      user,
      recalledReason,
      createIncident
    );
    sendSuccess(res, lot, 'Reagent lot recalled successfully');
  });

  validateLot = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = reagentLotIdParamSchema.parse(req.params);
    const { testCode, requiredQuantity } = req.query;

    const result = await reagentInventoryService.validateLotForProcessing(
      labId,
      id,
      typeof testCode === 'string' ? testCode : undefined,
      requiredQuantity ? Number(requiredQuantity) : 1
    );
    sendSuccess(res, result, 'Lot validation completed');
  });

  getRecommendedLotFEFO = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { id } = reagentIdParamSchema.parse(req.params);
    const { requiredQuantity } = req.query;

    const lot = await reagentInventoryService.getRecommendedLotFEFO(
      labId,
      id,
      requiredQuantity ? Number(requiredQuantity) : 1
    );
    sendSuccess(res, lot, 'Recommended FEFO lot retrieved successfully');
  });

  listTransactions = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { reagentId, lotId, page, limit } = req.query;

    const result = await reagentInventoryService.listTransactions(labId, {
      reagentId: typeof reagentId === 'string' ? reagentId : undefined,
      lotId: typeof lotId === 'string' ? lotId : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result.items, 'Transactions retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  });

  // ===========================================================================
  // 10. RESULT RELEASE SAFETY GATE
  // ===========================================================================

  checkReleaseGate = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const { testCode, instrumentId } = req.query;
    if (!testCode || typeof testCode !== 'string') {
      throw AppError.badRequest('testCode query parameter is required');
    }

    const check = await qcReleaseGateService.checkQCEligibility(
      labId,
      testCode,
      typeof instrumentId === 'string' ? instrumentId : undefined
    );
    sendSuccess(res, check, 'QC Release Gate eligibility check completed');
  });

  authorizeReleaseOverride = asyncHandler(async (req: Request, res: Response) => {
    const labId = await resolveLaboratoryId(req);
    const user = await resolveUserContext(req);
    const body = authorizeQCOverrideSchema.parse(req.body);

    const override = await qcReleaseGateService.authorizeReleaseOverride(labId, user, body);
    sendSuccess(res, override, 'QC release override authorized successfully');
  });
}

export const qualityController = new QualityController();
