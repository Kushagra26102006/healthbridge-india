/**
 * HealthBridge India — Laboratory Quality Management System (QMS) API Client
 * Frontend client for QC Profiles, Westgard evaluations, Incidents, CAPA, Instruments,
 * Calibrations, Maintenance, Reagents, and Quality Release Gate verification.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  QualityDashboardDto,
  QCProfileDto,
  CreateQCProfileDto,
  UpdateQCProfileDto,
  QCRunDto,
  CreateQCRunDto,
  InvestigateQCRunDto,
  QualityIncidentDto,
  CreateQualityIncidentDto,
  UpdateQualityIncidentDto,
  CAPADto,
  CreateCAPADto,
  UpdateCAPADto,
  AddCAPAActionItemDto,
  ReviewCAPADto,
  LabInstrumentDto,
  CreateLabInstrumentDto,
  UpdateLabInstrumentDto,
  InstrumentOperatingStatus,
  InstrumentCalibrationDto,
  RecordCalibrationDto,
  ClearCalibrationDto,
  InstrumentMaintenanceDto,
  CompleteMaintenanceDto,
  ReagentDto,
  CreateReagentDto,
  UpdateReagentDto,
  ReagentLotDto,
  CreateReagentLotDto,
  ReagentInventoryTransactionDto,
  RecordReagentStockTransactionDto,
  QCEligibilityCheckResult,
  AuthorizeQCOverrideDto,
} from '@healthbridge/shared-types';

export const laboratoryQualityApi = {
  // 1. Dashboard
  getDashboard: async (): Promise<QualityDashboardDto> => {
    const res = await apiClient.get<ApiResponse<QualityDashboardDto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_DASHBOARD
    );
    return res.data.data!;
  },

  // 2. QC Profiles
  listProfiles: async (params?: { testCode?: string; isActive?: boolean; search?: string }): Promise<QCProfileDto[]> => {
    const res = await apiClient.get<ApiResponse<QCProfileDto[]>>(
      API_ENDPOINTS.LABORATORY.QC_PROFILES,
      { params }
    );
    return res.data.data || [];
  },

  createProfile: async (dto: CreateQCProfileDto): Promise<QCProfileDto> => {
    const res = await apiClient.post<ApiResponse<QCProfileDto>>(
      API_ENDPOINTS.LABORATORY.QC_PROFILES,
      dto
    );
    return res.data.data!;
  },

  getProfileById: async (id: string): Promise<QCProfileDto> => {
    const res = await apiClient.get<ApiResponse<QCProfileDto>>(
      API_ENDPOINTS.LABORATORY.QC_PROFILE_DETAIL(id)
    );
    return res.data.data!;
  },

  updateProfile: async (id: string, dto: UpdateQCProfileDto): Promise<QCProfileDto> => {
    const res = await apiClient.put<ApiResponse<QCProfileDto>>(
      API_ENDPOINTS.LABORATORY.QC_PROFILE_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  // 3. QC Runs
  listRuns: async (params?: any): Promise<{ items: QCRunDto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<QCRunDto[]>>(
      API_ENDPOINTS.LABORATORY.QC_RUNS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  recordRun: async (dto: CreateQCRunDto): Promise<QCRunDto> => {
    const res = await apiClient.post<ApiResponse<QCRunDto>>(
      API_ENDPOINTS.LABORATORY.QC_RUNS,
      dto
    );
    return res.data.data!;
  },

  getRunById: async (id: string): Promise<QCRunDto> => {
    const res = await apiClient.get<ApiResponse<QCRunDto>>(
      API_ENDPOINTS.LABORATORY.QC_RUN_DETAIL(id)
    );
    return res.data.data!;
  },

  investigateRun: async (id: string, dto: InvestigateQCRunDto): Promise<QCRunDto> => {
    const res = await apiClient.post<ApiResponse<QCRunDto>>(
      API_ENDPOINTS.LABORATORY.QC_RUN_INVESTIGATE(id),
      dto
    );
    return res.data.data!;
  },

  // 4. Quality Incidents
  listIncidents: async (params?: any): Promise<{ items: QualityIncidentDto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<QualityIncidentDto[]>>(
      API_ENDPOINTS.LABORATORY.QUALITY_INCIDENTS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  createIncident: async (dto: CreateQualityIncidentDto): Promise<QualityIncidentDto> => {
    const res = await apiClient.post<ApiResponse<QualityIncidentDto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_INCIDENTS,
      dto
    );
    return res.data.data!;
  },

  getIncidentById: async (id: string): Promise<QualityIncidentDto> => {
    const res = await apiClient.get<ApiResponse<QualityIncidentDto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_INCIDENT_DETAIL(id)
    );
    return res.data.data!;
  },

  updateIncident: async (id: string, dto: UpdateQualityIncidentDto): Promise<QualityIncidentDto> => {
    const res = await apiClient.put<ApiResponse<QualityIncidentDto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_INCIDENT_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  resolveIncident: async (id: string, resolutionNotes: string): Promise<QualityIncidentDto> => {
    const res = await apiClient.post<ApiResponse<QualityIncidentDto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_INCIDENT_RESOLVE(id),
      { resolutionNotes }
    );
    return res.data.data!;
  },

  closeIncident: async (id: string): Promise<QualityIncidentDto> => {
    const res = await apiClient.post<ApiResponse<QualityIncidentDto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_INCIDENT_CLOSE(id),
      {}
    );
    return res.data.data!;
  },

  // 5. CAPA
  listCAPAs: async (params?: any): Promise<{ items: CAPADto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<CAPADto[]>>(
      API_ENDPOINTS.LABORATORY.QUALITY_CAPAS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  createCAPA: async (dto: CreateCAPADto): Promise<CAPADto> => {
    const res = await apiClient.post<ApiResponse<CAPADto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_CAPAS,
      dto
    );
    return res.data.data!;
  },

  getCAPAById: async (id: string): Promise<CAPADto> => {
    const res = await apiClient.get<ApiResponse<CAPADto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_CAPA_DETAIL(id)
    );
    return res.data.data!;
  },

  updateCAPA: async (id: string, dto: UpdateCAPADto): Promise<CAPADto> => {
    const res = await apiClient.put<ApiResponse<CAPADto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_CAPA_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  addActionItem: async (id: string, dto: AddCAPAActionItemDto): Promise<CAPADto> => {
    const res = await apiClient.post<ApiResponse<CAPADto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_CAPA_ACTION(id),
      dto
    );
    return res.data.data!;
  },

  updateActionItemStatus: async (
    id: string,
    actionId: string,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    verificationNotes?: string
  ): Promise<CAPADto> => {
    const res = await apiClient.patch<ApiResponse<CAPADto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_CAPA_ACTION_STATUS(id, actionId),
      { status, verificationNotes }
    );
    return res.data.data!;
  },

  reviewCAPA: async (id: string, dto: ReviewCAPADto): Promise<CAPADto> => {
    const res = await apiClient.post<ApiResponse<CAPADto>>(
      API_ENDPOINTS.LABORATORY.QUALITY_CAPA_REVIEW(id),
      dto
    );
    return res.data.data!;
  },

  // 6. Instruments
  listInstruments: async (params?: any): Promise<{ items: LabInstrumentDto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<LabInstrumentDto[]>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENTS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  registerInstrument: async (dto: CreateLabInstrumentDto): Promise<LabInstrumentDto> => {
    const res = await apiClient.post<ApiResponse<LabInstrumentDto>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENTS,
      dto
    );
    return res.data.data!;
  },

  getInstrumentById: async (id: string): Promise<LabInstrumentDto> => {
    const res = await apiClient.get<ApiResponse<LabInstrumentDto>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENT_DETAIL(id)
    );
    return res.data.data!;
  },

  updateInstrument: async (id: string, dto: UpdateLabInstrumentDto): Promise<LabInstrumentDto> => {
    const res = await apiClient.put<ApiResponse<LabInstrumentDto>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENT_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  updateOperatingStatus: async (
    id: string,
    operatingStatus: InstrumentOperatingStatus,
    statusReason?: string
  ): Promise<LabInstrumentDto> => {
    const res = await apiClient.patch<ApiResponse<LabInstrumentDto>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENT_STATUS(id),
      { operatingStatus, statusReason }
    );
    return res.data.data!;
  },

  // 7. Calibration
  listCalibrations: async (params?: any): Promise<{ items: InstrumentCalibrationDto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<InstrumentCalibrationDto[]>>(
      API_ENDPOINTS.LABORATORY.CALIBRATIONS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  recordCalibration: async (instrumentId: string, dto: RecordCalibrationDto): Promise<InstrumentCalibrationDto> => {
    const res = await apiClient.post<ApiResponse<InstrumentCalibrationDto>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENT_CALIBRATION(instrumentId),
      dto
    );
    return res.data.data!;
  },

  clearCalibration: async (
    instrumentId: string,
    calibrationId: string,
    dto: ClearCalibrationDto
  ): Promise<InstrumentCalibrationDto> => {
    const res = await apiClient.post<ApiResponse<InstrumentCalibrationDto>>(
      API_ENDPOINTS.LABORATORY.CLEAR_CALIBRATION(instrumentId, calibrationId),
      dto
    );
    return res.data.data!;
  },

  getCalibrationHistory: async (instrumentId: string): Promise<InstrumentCalibrationDto[]> => {
    const res = await apiClient.get<ApiResponse<InstrumentCalibrationDto[]>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENT_CALIBRATION(instrumentId)
    );
    return res.data.data || [];
  },

  // 8. Maintenance
  listMaintenance: async (params?: any): Promise<{ items: InstrumentMaintenanceDto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<InstrumentMaintenanceDto[]>>(
      API_ENDPOINTS.LABORATORY.MAINTENANCE,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  scheduleMaintenance: async (instrumentId: string, dto: any): Promise<InstrumentMaintenanceDto> => {
    const res = await apiClient.post<ApiResponse<InstrumentMaintenanceDto>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENT_MAINTENANCE(instrumentId),
      dto
    );
    return res.data.data!;
  },

  completeMaintenance: async (
    instrumentId: string,
    maintenanceId: string,
    dto: CompleteMaintenanceDto
  ): Promise<InstrumentMaintenanceDto> => {
    const res = await apiClient.post<ApiResponse<InstrumentMaintenanceDto>>(
      API_ENDPOINTS.LABORATORY.COMPLETE_MAINTENANCE(instrumentId, maintenanceId),
      dto
    );
    return res.data.data!;
  },

  getMaintenanceHistory: async (instrumentId: string): Promise<InstrumentMaintenanceDto[]> => {
    const res = await apiClient.get<ApiResponse<InstrumentMaintenanceDto[]>>(
      API_ENDPOINTS.LABORATORY.INSTRUMENT_MAINTENANCE(instrumentId)
    );
    return res.data.data || [];
  },

  // 9. Reagents & Inventory
  listReagents: async (params?: any): Promise<{ items: ReagentDto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<ReagentDto[]>>(
      API_ENDPOINTS.LABORATORY.REAGENTS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  createReagent: async (dto: CreateReagentDto): Promise<ReagentDto> => {
    const res = await apiClient.post<ApiResponse<ReagentDto>>(
      API_ENDPOINTS.LABORATORY.REAGENTS,
      dto
    );
    return res.data.data!;
  },

  getReagentById: async (id: string): Promise<ReagentDto> => {
    const res = await apiClient.get<ApiResponse<ReagentDto>>(
      API_ENDPOINTS.LABORATORY.REAGENT_DETAIL(id)
    );
    return res.data.data!;
  },

  updateReagent: async (id: string, dto: UpdateReagentDto): Promise<ReagentDto> => {
    const res = await apiClient.put<ApiResponse<ReagentDto>>(
      API_ENDPOINTS.LABORATORY.REAGENT_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  // 10. Reagent Lots
  listLots: async (params?: any): Promise<{ items: ReagentLotDto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<ReagentLotDto[]>>(
      API_ENDPOINTS.LABORATORY.REAGENT_LOTS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  createLot: async (dto: CreateReagentLotDto): Promise<ReagentLotDto> => {
    const res = await apiClient.post<ApiResponse<ReagentLotDto>>(
      API_ENDPOINTS.LABORATORY.REAGENT_LOTS,
      dto
    );
    return res.data.data!;
  },

  getLotById: async (id: string): Promise<ReagentLotDto> => {
    const res = await apiClient.get<ApiResponse<ReagentLotDto>>(
      API_ENDPOINTS.LABORATORY.REAGENT_LOT_DETAIL(id)
    );
    return res.data.data!;
  },

  quarantineLot: async (reagentId: string, lotId: string, data?: { quarantineReason?: string }): Promise<ReagentLotDto> => {
    const res = await apiClient.post<ApiResponse<ReagentLotDto>>(
      API_ENDPOINTS.LABORATORY.QUARANTINE_LOT(reagentId, lotId),
      data || {}
    );
    return res.data.data!;
  },

  recallLot: async (reagentId: string, lotId: string, data?: { recalledReason?: string }): Promise<ReagentLotDto> => {
    const res = await apiClient.post<ApiResponse<ReagentLotDto>>(
      API_ENDPOINTS.LABORATORY.RECALL_LOT(reagentId, lotId),
      data || {}
    );
    return res.data.data!;
  },

  validateLotForTesting: async (lotId: string): Promise<{ valid: boolean; reason?: string }> => {
    const res = await apiClient.get<ApiResponse<{ valid: boolean; reason?: string }>>(
      API_ENDPOINTS.LABORATORY.VALIDATE_LOT(lotId)
    );
    return res.data.data!;
  },

  getRecommendedFEFOLot: async (reagentId: string): Promise<ReagentLotDto | null> => {
    const res = await apiClient.get<ApiResponse<ReagentLotDto | null>>(
      API_ENDPOINTS.LABORATORY.FEFO_LOT(reagentId)
    );
    return res.data.data ?? null;
  },

  // 11. Reagent Transactions / Ledger
  listTransactions: async (params?: any): Promise<{ items: ReagentInventoryTransactionDto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<ReagentInventoryTransactionDto[]>>(
      API_ENDPOINTS.LABORATORY.REAGENT_TRANSACTIONS,
      { params }
    );
    const meta = (res.data.meta as any) || {};
    return {
      items: res.data.data || [],
      total: meta.total || 0,
      page: meta.page || 1,
      limit: meta.limit || 20,
    };
  },

  recordStockTransaction: async (dto: RecordReagentStockTransactionDto): Promise<ReagentInventoryTransactionDto> => {
    const res = await apiClient.post<ApiResponse<ReagentInventoryTransactionDto>>(
      API_ENDPOINTS.LABORATORY.REAGENT_TRANSACTIONS,
      dto
    );
    return res.data.data!;
  },

  recordTransaction: async (dto: RecordReagentStockTransactionDto): Promise<ReagentInventoryTransactionDto> => {
    const res = await apiClient.post<ApiResponse<ReagentInventoryTransactionDto>>(
      API_ENDPOINTS.LABORATORY.REAGENT_TRANSACTIONS,
      dto
    );
    return res.data.data!;
  },

  // 12. Quality Release Gate
  checkReleaseEligibility: async (testCode: string, instrumentId?: string, lotId?: string): Promise<QCEligibilityCheckResult> => {
    const res = await apiClient.get<ApiResponse<QCEligibilityCheckResult>>(
      API_ENDPOINTS.LABORATORY.QC_ELIGIBILITY,
      { params: { testCode, instrumentId, lotId } }
    );
    return res.data.data!;
  },

  authorizeReleaseOverride: async (dto: AuthorizeQCOverrideDto): Promise<{ authorized: boolean; overrideId: string; message: string }> => {
    const res = await apiClient.post<ApiResponse<{ authorized: boolean; overrideId: string; message: string }>>(
      API_ENDPOINTS.LABORATORY.QC_OVERRIDE,
      dto
    );
    return res.data.data!;
  },
};
