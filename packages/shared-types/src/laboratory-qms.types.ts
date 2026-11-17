/**
 * HealthBridge India — Laboratory Quality Management System (QMS) Types
 * Covers QC Profiles, QC Runs, Quality Incidents, CAPA, Instruments,
 * Calibrations, Maintenance, Reagents, and Quality Dashboard KPIs.
 */

// ============================================================================
// 1. QUALITY CONTROL (QC) ENUMS & TYPES
// ============================================================================

export type QCRunStatus =
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'INVALIDATED'
  | 'UNDER_INVESTIGATION';

export type QCDataType = 'NUMERIC' | 'QUALITATIVE' | 'BOOLEAN';

export interface QCProfileVersionDto {
  version: number;
  effectiveDate: string;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  qualitativeExpected?: string;
  unit?: string;
  notes?: string;
  createdById: string;
  createdAt: string;
}

export interface QCProfileDto {
  id: string;
  laboratoryId: string;
  profileName: string;
  testCode: string;
  testName: string;
  parameterName: string;
  controlMaterial: string;
  controlLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'NORMAL' | 'ABNORMAL_LOW' | 'ABNORMAL_HIGH';
  dataType: QCDataType;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  qualitativeExpected?: string;
  unit?: string;
  applicableInstrumentId?: string;
  applicableInstrumentName?: string;
  reagentLotRequirements?: string;
  runFrequency: 'DAILY' | 'EACH_SHIFT' | 'PER_BATCH' | 'WEEKLY' | 'MONTHLY';
  version: number;
  effectiveDate: string;
  isActive: boolean;
  versions?: QCProfileVersionDto[];
  createdById: string;
  updatedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQCProfileDto {
  profileName: string;
  testCode: string;
  testName: string;
  parameterName: string;
  controlMaterial: string;
  controlLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'NORMAL' | 'ABNORMAL_LOW' | 'ABNORMAL_HIGH';
  dataType: QCDataType;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  qualitativeExpected?: string;
  unit?: string;
  applicableInstrumentId?: string;
  reagentLotRequirements?: string;
  runFrequency: 'DAILY' | 'EACH_SHIFT' | 'PER_BATCH' | 'WEEKLY' | 'MONTHLY';
  effectiveDate?: string;
  isActive?: boolean;
}

export interface UpdateQCProfileDto {
  profileName?: string;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  qualitativeExpected?: string;
  unit?: string;
  applicableInstrumentId?: string;
  reagentLotRequirements?: string;
  runFrequency?: 'DAILY' | 'EACH_SHIFT' | 'PER_BATCH' | 'WEEKLY' | 'MONTHLY';
  isActive?: boolean;
  changeReason?: string;
}

export interface QCRuleEvaluation {
  ruleName: string;
  passed: boolean;
  explanation: string;
  deviation?: number;
  deviationPercentage?: number;
}

export interface QCRunDto {
  id: string;
  laboratoryId: string;
  qcProfileId: string;
  qcProfileName: string;
  profileVersion: number;
  testCode: string;
  instrumentId?: string;
  instrumentName?: string;
  controlMaterial: string;
  controlLotNumber: string;
  reagentLotId?: string;
  reagentLotNumber?: string;
  runIdentifier: string;
  measuredNumericValue?: number;
  measuredQualitativeValue?: string;
  targetValue?: number;
  acceptableMin?: number;
  acceptableMax?: number;
  qualitativeExpected?: string;
  unit?: string;
  qcStatus: QCRunStatus;
  ruleEvaluation: QCRuleEvaluation;
  operatorId: string;
  operatorName: string;
  runDate: string;
  comments?: string;
  incidentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQCRunDto {
  qcProfileId: string;
  instrumentId?: string;
  controlLotNumber: string;
  reagentLotId?: string;
  measuredNumericValue?: number;
  measuredQualitativeValue?: string;
  comments?: string;
}

export interface QCInvestigationDto {
  investigationNotes: string;
  rootCauseCategory: string;
  correctiveAction: string;
  resolutionStatus: 'RESOLVED' | 'UNDER_INVESTIGATION' | 'INVALIDATED';
}

export type InvestigateQCRunDto = QCInvestigationDto;

// ============================================================================
// 2. QUALITY INCIDENTS & CAPA ENUMS & TYPES
// ============================================================================

export type IncidentCategory =
  | 'QC_FAILURE'
  | 'INSTRUMENT_FAILURE'
  | 'CALIBRATION_FAILURE'
  | 'REAGENT_ISSUE'
  | 'SPECIMEN_ISSUE'
  | 'PRE_ANALYTICAL'
  | 'POST_ANALYTICAL'
  | 'GENERAL';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'ACTION_REQUIRED'
  | 'RESOLVED'
  | 'CLOSED';

export interface QualityIncidentDto {
  id: string;
  incidentReference: string;
  laboratoryId: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  relatedTestCode?: string;
  relatedInstrumentId?: string;
  relatedInstrumentName?: string;
  relatedReagentLotId?: string;
  relatedReagentLotNumber?: string;
  relatedQCRunId?: string;
  affectedOrderIds?: string[];
  affectedReportIds?: string[];
  reportedById: string;
  reportedByName: string;
  assignedInvestigatorId?: string;
  assignedInvestigatorName?: string;
  investigationNotes?: string;
  rootCauseCategory?: string;
  rootCauseAnalysis?: string;
  status: IncidentStatus;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  closedById?: string;
  closedByName?: string;
  closedAt?: string;
  capaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQualityIncidentDto {
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  relatedTestCode?: string;
  relatedInstrumentId?: string;
  relatedReagentLotId?: string;
  relatedQCRunId?: string;
  affectedOrderIds?: string[];
  affectedReportIds?: string[];
  assignedInvestigatorId?: string;
}

export interface UpdateQualityIncidentDto {
  severity?: IncidentSeverity;
  assignedInvestigatorId?: string;
  investigationNotes?: string;
  rootCauseCategory?: string;
  rootCauseAnalysis?: string;
  status?: IncidentStatus;
  resolutionNotes?: string;
}

export type CAPAStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PENDING_VERIFICATION'
  | 'EFFECTIVE'
  | 'INEFFECTIVE'
  | 'CLOSED';

export interface CAPAActionItemDto {
  actionId: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt?: string;
  verificationNotes?: string;
}

export interface CAPADto {
  id: string;
  capaReference: string;
  incidentId: string;
  incidentReference: string;
  laboratoryId: string;
  problemStatement: string;
  rootCauseCategory: string;
  rootCauseAnalysis: string;
  correctiveAction: string;
  preventiveAction: string;
  assignedOwnerId: string;
  assignedOwnerName: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: CAPAStatus;
  actions: CAPAActionItemDto[];
  verificationMethod?: string;
  verifiedById?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  effectivenessReviewNotes?: string;
  effectivenessResult?: 'EFFECTIVE' | 'INEFFECTIVE';
  closedById?: string;
  closedByName?: string;
  closedAt?: string;
  reopenReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCAPADto {
  incidentId: string;
  problemStatement: string;
  rootCauseCategory: string;
  rootCauseAnalysis: string;
  correctiveAction: string;
  preventiveAction: string;
  assignedOwnerId: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  verificationMethod?: string;
  initialActions?: {
    description: string;
    assignedToId: string;
    dueDate: string;
  }[];
}

export interface UpdateCAPADto {
  problemStatement?: string;
  rootCauseAnalysis?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  assignedOwnerId?: string;
  dueDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: CAPAStatus;
  verificationMethod?: string;
}

export interface AddCAPAActionItemDto {
  description: string;
  assignedToId: string;
  dueDate: string;
}

export interface ReviewCAPADto {
  effectivenessResult: 'EFFECTIVE' | 'INEFFECTIVE';
  effectivenessReviewNotes: string;
}

// ============================================================================
// 3. INSTRUMENT MANAGEMENT, CALIBRATION & MAINTENANCE ENUMS & TYPES
// ============================================================================

export type InstrumentCategory =
  | 'ANALYZER'
  | 'CENTRIFUGE'
  | 'MICROSCOPE'
  | 'INCUBATOR'
  | 'REFRIGERATOR'
  | 'SPECTROPHOTOMETER'
  | 'PCR_MACHINE'
  | 'ELECTROPHORESIS'
  | 'OTHER';

export type InstrumentOperatingStatus =
  | 'ACTIVE'
  | 'IN_MAINTENANCE'
  | 'OUT_OF_SERVICE'
  | 'RETIRED';

export type CalibrationStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'PASSED'
  | 'FAILED'
  | 'OVERDUE';

export interface LabInstrumentDto {
  id: string;
  laboratoryId: string;
  instrumentIdentifier: string;
  instrumentName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  category: InstrumentCategory;
  department?: string;
  associatedTestCodes: string[];
  operatingStatus: InstrumentOperatingStatus;
  statusReason?: string;
  installationDate: string;
  warrantyExpiryDate?: string;
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  calibrationStatus: 'PASSED' | 'FAILED' | 'PENDING' | 'OVERDUE';
  maintenanceProvider?: string;
  supportingDocuments?: {
    title: string;
    documentUrl: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabInstrumentDto {
  instrumentIdentifier: string;
  instrumentName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  category: InstrumentCategory;
  department?: string;
  associatedTestCodes: string[];
  operatingStatus?: InstrumentOperatingStatus;
  installationDate: string;
  warrantyExpiryDate?: string;
  nextCalibrationDate?: string;
  nextMaintenanceDate?: string;
  maintenanceProvider?: string;
}

export interface UpdateLabInstrumentDto {
  instrumentName?: string;
  category?: InstrumentCategory;
  department?: string;
  associatedTestCodes?: string[];
  operatingStatus?: InstrumentOperatingStatus;
  statusReason?: string;
  warrantyExpiryDate?: string;
  nextCalibrationDate?: string;
  nextMaintenanceDate?: string;
  maintenanceProvider?: string;
}

export interface CalibrationParameterResult {
  parameter: string;
  expectedValue: string;
  measuredValue: string;
  tolerance: string;
  passed: boolean;
}

export interface InstrumentCalibrationDto {
  id: string;
  calibrationReference: string;
  instrumentId: string;
  instrumentName: string;
  laboratoryId: string;
  calibrationType: 'ROUTINE' | 'POST_REPAIR' | 'INITIAL' | 'VERIFICATION';
  scheduledDate: string;
  performedDate?: string;
  dueDate: string;
  performedById?: string;
  performedByName?: string;
  verifierId?: string;
  verifierName?: string;
  calibrationResult?: 'PASSED' | 'FAILED';
  status: CalibrationStatus;
  standardsUsed?: string;
  parametersChecked?: CalibrationParameterResult[];
  certificateNumber?: string;
  certificateUrl?: string;
  notes?: string;
  clearedById?: string;
  clearedByName?: string;
  clearedAt?: string;
  clearanceNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordCalibrationDto {
  calibrationType: 'ROUTINE' | 'POST_REPAIR' | 'INITIAL' | 'VERIFICATION';
  performedDate: string;
  dueDate: string;
  calibrationResult: 'PASSED' | 'FAILED';
  standardsUsed?: string;
  parametersChecked?: CalibrationParameterResult[];
  certificateNumber?: string;
  certificateUrl?: string;
  notes?: string;
}

export interface ClearCalibrationDto {
  clearanceNotes: string;
}

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'BREAKDOWN';

export interface InstrumentMaintenanceDto {
  id: string;
  maintenanceReference: string;
  instrumentId: string;
  instrumentName: string;
  laboratoryId: string;
  maintenanceType: MaintenanceType;
  workDescription: string;
  scheduledDate: string;
  completedDate?: string;
  technicianName?: string;
  serviceProvider?: string;
  maintenanceNotes?: string;
  downtimeHours?: number;
  partsReplaced?: string[];
  nextScheduledDate?: string;
  cost?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedById?: string;
  completedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleMaintenanceDto {
  maintenanceType: MaintenanceType;
  workDescription: string;
  scheduledDate: string;
  serviceProvider?: string;
}

export interface CompleteMaintenanceDto {
  completedDate: string;
  technicianName?: string;
  maintenanceNotes: string;
  downtimeHours?: number;
  partsReplaced?: string[];
  nextScheduledDate?: string;
  cost?: number;
  restoreToActiveStatus?: boolean;
}

// ============================================================================
// 4. REAGENT & CONSUMABLE INVENTORY ENUMS & TYPES
// ============================================================================

export type ReagentStorageCondition =
  | 'ROOM_TEMPERATURE'
  | 'REFRIGERATED_2_8C'
  | 'FROZEN_MINUS_20C'
  | 'DEEP_FREEZE_MINUS_80C';

export type ReagentLotStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'QUARANTINED'
  | 'RECALLED'
  | 'DEPLETED';

export type ReagentTransactionType =
  | 'RECEIPT'
  | 'CONSUMPTION'
  | 'ADJUSTMENT'
  | 'DISPOSAL'
  | 'REVERSAL';

export interface ReagentDto {
  id: string;
  laboratoryId: string;
  reagentCode: string;
  name: string;
  manufacturer: string;
  catalogNumber: string;
  category: 'REAGENT' | 'CALIBRATOR' | 'CONTROL' | 'BUFFER' | 'STAIN' | 'CONSUMABLE';
  storageConditions: ReagentStorageCondition;
  unit: string;
  minimumStockLevel: number;
  currentStock: number;
  associatedTestCodes: string[];
  isActive: boolean;
  activeLotsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReagentDto {
  reagentCode: string;
  name: string;
  manufacturer: string;
  catalogNumber: string;
  category: 'REAGENT' | 'CALIBRATOR' | 'CONTROL' | 'BUFFER' | 'STAIN' | 'CONSUMABLE';
  storageConditions: ReagentStorageCondition;
  unit: string;
  minimumStockLevel: number;
  associatedTestCodes: string[];
  isActive?: boolean;
}

export interface UpdateReagentDto {
  name?: string;
  manufacturer?: string;
  catalogNumber?: string;
  category?: 'REAGENT' | 'CALIBRATOR' | 'CONTROL' | 'BUFFER' | 'STAIN' | 'CONSUMABLE';
  storageConditions?: ReagentStorageCondition;
  minimumStockLevel?: number;
  associatedTestCodes?: string[];
  isActive?: boolean;
}

export interface ReagentLotDto {
  id: string;
  reagentId: string;
  reagentName: string;
  laboratoryId: string;
  lotNumber: string;
  manufacturer: string;
  receivedDate: string;
  expiryDate: string;
  openedDate?: string;
  initialQuantity: number;
  availableQuantity: number;
  unit: string;
  storageLocation: string;
  status: ReagentLotStatus;
  supplierName?: string;
  quarantineReason?: string;
  recalledAt?: string;
  recalledReason?: string;
  daysToExpiry?: number;
  isExpired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReagentLotDto {
  reagentId: string;
  lotNumber: string;
  manufacturer: string;
  receivedDate: string;
  expiryDate: string;
  openedDate?: string;
  initialQuantity: number;
  storageLocation: string;
  supplierName?: string;
}

export interface UpdateReagentLotDto {
  storageLocation?: string;
  openedDate?: string;
  quarantineReason?: string;
}

export interface ReagentInventoryTransactionDto {
  id: string;
  transactionReference: string;
  reagentId: string;
  reagentName: string;
  lotId: string;
  lotNumber: string;
  laboratoryId: string;
  transactionType: ReagentTransactionType;
  quantity: number;
  balanceAfter: number;
  unit: string;
  performedById: string;
  performedByName: string;
  reason: string;
  batchTestRunId?: string;
  orderId?: string;
  authorizedById?: string;
  authorizedByName?: string;
  createdAt: string;
}

export interface RecordReagentStockTransactionDto {
  reagentId: string;
  lotId: string;
  transactionType: ReagentTransactionType;
  quantity: number;
  reason: string;
  batchTestRunId?: string;
  orderId?: string;
}

// ============================================================================
// 5. TEST AND INSTRUMENT MAPPING
// ============================================================================

export interface TestInstrumentMappingDto {
  id: string;
  laboratoryId: string;
  testCode: string;
  testName: string;
  instrumentId: string;
  instrumentName: string;
  isPrimary: boolean;
  reagentRequirements?: {
    reagentId: string;
    reagentName: string;
    requiredQuantityPerTest: number;
  }[];
  qcProfileId?: string;
  qcProfileName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigureTestInstrumentMappingDto {
  testCode: string;
  instrumentId: string;
  isPrimary?: boolean;
  reagentRequirements?: {
    reagentId: string;
    requiredQuantityPerTest: number;
  }[];
  qcProfileId?: string;
  isActive?: boolean;
}

// ============================================================================
// 6. RESULT RELEASE SAFETY GATE DTOS
// ============================================================================

export interface QCEligibilityCheckResult {
  eligible: boolean;
  reasons: string[];
  blockingIncidentId?: string;
  blockingQCRunId?: string;
  instrumentStatus?: InstrumentOperatingStatus;
  isOverridden?: boolean;
  overriddenById?: string;
  overrideReason?: string;
}

export interface AuthorizeQCOverrideDto {
  testCode: string;
  reason: string;
  instrumentId?: string;
  reportId?: string;
}

// ============================================================================
// 7. QUALITY MANAGEMENT DASHBOARD & ANALYTICS DTOS
// ============================================================================

export interface QualityKPIDto {
  totalQCRuns: number;
  qcPassRate: number;
  qcFailureCount: number;
  openQualityIncidents: number;
  openCAPAActions: number;
  instrumentsInService: number;
  instrumentsRequiringMaintenance: number;
  overdueCalibrations: number;
  reagentsApproachingExpiry: number;
  reagentStockAlerts: number;
}

export interface QualityAlertDto {
  id: string;
  type: 'QC_FAILURE' | 'CALIBRATION_OVERDUE' | 'MAINTENANCE_DUE' | 'REAGENT_EXPIRY' | 'LOW_STOCK' | 'CAPA_OVERDUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
}

export interface QualityTrendPointDto {
  date: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  passRate: number;
}

export interface QualityDashboardDto {
  kpis: QualityKPIDto;
  recentFailures: QCRunDto[];
  openIncidents: QualityIncidentDto[];
  activeCAPAs: CAPADto[];
  upcomingCalibrations: InstrumentCalibrationDto[];
  upcomingMaintenance: InstrumentMaintenanceDto[];
  expiringLots: ReagentLotDto[];
  alerts: QualityAlertDto[];
  monthlyTrends: QualityTrendPointDto[];
}
