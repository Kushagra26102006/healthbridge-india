import { z } from 'zod';

// ============================================================================
// 1. QUALITY CONTROL (QC) SCHEMAS
// ============================================================================

export const qcDataTypes = ['NUMERIC', 'QUALITATIVE', 'BOOLEAN'] as const;
export const qcControlLevels = [
  'LEVEL_1',
  'LEVEL_2',
  'LEVEL_3',
  'NORMAL',
  'ABNORMAL_LOW',
  'ABNORMAL_HIGH',
] as const;
export const qcRunFrequencies = [
  'DAILY',
  'EACH_SHIFT',
  'PER_BATCH',
  'WEEKLY',
  'MONTHLY',
] as const;
export const qcRunStatuses = [
  'PENDING',
  'PASSED',
  'FAILED',
  'INVALIDATED',
  'UNDER_INVESTIGATION',
] as const;

export const createQCProfileSchema = z.object({
  profileName: z.string().min(2).max(150),
  testCode: z.string().min(1).max(50).toUpperCase(),
  testName: z.string().min(2).max(150),
  parameterName: z.string().min(2).max(100),
  controlMaterial: z.string().min(2).max(150),
  controlLevel: z.enum(qcControlLevels),
  dataType: z.enum(qcDataTypes),
  targetValue: z.number().optional(),
  acceptableMin: z.number().optional(),
  acceptableMax: z.number().optional(),
  qualitativeExpected: z.string().max(100).optional(),
  unit: z.string().max(50).optional(),
  applicableInstrumentId: z.string().optional(),
  reagentLotRequirements: z.string().max(255).optional(),
  runFrequency: z.enum(qcRunFrequencies).default('DAILY'),
  effectiveDate: z.string().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.dataType === 'NUMERIC') {
      if (data.acceptableMin !== undefined && data.acceptableMax !== undefined) {
        return data.acceptableMin <= data.acceptableMax;
      }
    }
    return true;
  },
  {
    message: 'acceptableMin must be less than or equal to acceptableMax',
    path: ['acceptableMin'],
  }
);

export const updateQCProfileSchema = z.object({
  profileName: z.string().min(2).max(150).optional(),
  targetValue: z.number().optional(),
  acceptableMin: z.number().optional(),
  acceptableMax: z.number().optional(),
  qualitativeExpected: z.string().max(100).optional(),
  unit: z.string().max(50).optional(),
  applicableInstrumentId: z.string().optional(),
  reagentLotRequirements: z.string().max(255).optional(),
  runFrequency: z.enum(qcRunFrequencies).optional(),
  isActive: z.boolean().optional(),
  changeReason: z.string().min(3).max(500).optional(),
});

export const qcProfileIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createQCRunSchema = z.object({
  qcProfileId: z.string().min(1),
  instrumentId: z.string().optional(),
  controlLotNumber: z.string().min(1).max(100),
  reagentLotId: z.string().optional(),
  measuredNumericValue: z.number().optional(),
  measuredQualitativeValue: z.string().max(100).optional(),
  comments: z.string().max(1000).optional(),
});

export const qcRunIdParamSchema = z.object({
  id: z.string().min(1),
});

export const qcRunFilterQuerySchema = z.object({
  qcProfileId: z.string().optional(),
  testCode: z.string().optional(),
  instrumentId: z.string().optional(),
  controlLotNumber: z.string().optional(),
  qcStatus: z.enum(qcRunStatuses).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const investigateQCFailureSchema = z.object({
  investigationNotes: z.string().min(5).max(2000),
  rootCauseCategory: z.string().min(2).max(100),
  correctiveAction: z.string().min(5).max(2000),
  resolutionStatus: z.enum(['RESOLVED', 'UNDER_INVESTIGATION', 'INVALIDATED']).default('RESOLVED'),
});

// ============================================================================
// 2. QUALITY INCIDENTS & CAPA SCHEMAS
// ============================================================================

export const incidentCategories = [
  'QC_FAILURE',
  'INSTRUMENT_FAILURE',
  'CALIBRATION_FAILURE',
  'REAGENT_ISSUE',
  'SPECIMEN_ISSUE',
  'PRE_ANALYTICAL',
  'POST_ANALYTICAL',
  'GENERAL',
] as const;

export const incidentSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const incidentStatuses = [
  'OPEN',
  'UNDER_INVESTIGATION',
  'ACTION_REQUIRED',
  'RESOLVED',
  'CLOSED',
] as const;

export const createQualityIncidentSchema = z.object({
  category: z.enum(incidentCategories),
  severity: z.enum(incidentSeverities),
  title: z.string().min(3).max(200),
  description: z.string().min(5).max(3000),
  relatedTestCode: z.string().max(50).optional(),
  relatedInstrumentId: z.string().optional(),
  relatedReagentLotId: z.string().optional(),
  relatedQCRunId: z.string().optional(),
  affectedOrderIds: z.array(z.string()).optional(),
  affectedReportIds: z.array(z.string()).optional(),
  assignedInvestigatorId: z.string().optional(),
});

export const updateQualityIncidentSchema = z.object({
  severity: z.enum(incidentSeverities).optional(),
  assignedInvestigatorId: z.string().optional(),
  investigationNotes: z.string().max(3000).optional(),
  rootCauseCategory: z.string().max(100).optional(),
  rootCauseAnalysis: z.string().max(3000).optional(),
  status: z.enum(incidentStatuses).optional(),
  resolutionNotes: z.string().max(3000).optional(),
});

export const incidentIdParamSchema = z.object({
  id: z.string().min(1),
});

export const capaStatuses = [
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'PENDING_VERIFICATION',
  'EFFECTIVE',
  'INEFFECTIVE',
  'CLOSED',
] as const;

export const createCAPASchema = z.object({
  incidentId: z.string().min(1),
  problemStatement: z.string().min(5).max(2000),
  rootCauseCategory: z.string().min(2).max(100),
  rootCauseAnalysis: z.string().min(5).max(3000),
  correctiveAction: z.string().min(5).max(3000),
  preventiveAction: z.string().min(5).max(3000),
  assignedOwnerId: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  priority: z.enum(incidentSeverities).default('MEDIUM'),
  verificationMethod: z.string().max(2000).optional(),
  initialActions: z
    .array(
      z.object({
        description: z.string().min(3).max(500),
        assignedToId: z.string().min(1),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
      })
    )
    .optional(),
});

export const updateCAPASchema = z.object({
  problemStatement: z.string().min(5).max(2000).optional(),
  rootCauseAnalysis: z.string().min(5).max(3000).optional(),
  correctiveAction: z.string().min(5).max(3000).optional(),
  preventiveAction: z.string().min(5).max(3000).optional(),
  assignedOwnerId: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  priority: z.enum(incidentSeverities).optional(),
  status: z.enum(capaStatuses).optional(),
  verificationMethod: z.string().max(2000).optional(),
});

export const addCAPAActionItemSchema = z.object({
  description: z.string().min(3).max(500),
  assignedToId: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
});

export const reviewCAPASchema = z.object({
  effectivenessResult: z.enum(['EFFECTIVE', 'INEFFECTIVE']),
  effectivenessReviewNotes: z.string().min(5).max(2000),
});

export const capaIdParamSchema = z.object({
  id: z.string().min(1),
});

// ============================================================================
// 3. INSTRUMENT MANAGEMENT, CALIBRATION & MAINTENANCE SCHEMAS
// ============================================================================

export const instrumentCategories = [
  'ANALYZER',
  'CENTRIFUGE',
  'MICROSCOPE',
  'INCUBATOR',
  'REFRIGERATOR',
  'SPECTROPHOTOMETER',
  'PCR_MACHINE',
  'ELECTROPHORESIS',
  'OTHER',
] as const;

export const instrumentOperatingStatuses = [
  'ACTIVE',
  'IN_MAINTENANCE',
  'OUT_OF_SERVICE',
  'RETIRED',
] as const;

export const createLabInstrumentSchema = z.object({
  instrumentIdentifier: z.string().min(2).max(50).toUpperCase(),
  instrumentName: z.string().min(2).max(150),
  manufacturer: z.string().min(2).max(150),
  model: z.string().min(1).max(100),
  serialNumber: z.string().min(1).max(100),
  category: z.enum(instrumentCategories),
  department: z.string().max(100).optional(),
  associatedTestCodes: z.array(z.string().toUpperCase()).default([]),
  operatingStatus: z.enum(instrumentOperatingStatuses).default('ACTIVE'),
  installationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  warrantyExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  nextCalibrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  nextMaintenanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  maintenanceProvider: z.string().max(150).optional(),
});

export const updateLabInstrumentSchema = z.object({
  instrumentName: z.string().min(2).max(150).optional(),
  category: z.enum(instrumentCategories).optional(),
  department: z.string().max(100).optional(),
  associatedTestCodes: z.array(z.string().toUpperCase()).optional(),
  operatingStatus: z.enum(instrumentOperatingStatuses).optional(),
  statusReason: z.string().max(500).optional(),
  warrantyExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  nextCalibrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  nextMaintenanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  maintenanceProvider: z.string().max(150).optional(),
});

export const changeInstrumentStatusSchema = z.object({
  operatingStatus: z.enum(instrumentOperatingStatuses),
  statusReason: z.string().min(3).max(500),
});

export const instrumentIdParamSchema = z.object({
  id: z.string().min(1),
});

export const recordCalibrationSchema = z.object({
  calibrationType: z.enum(['ROUTINE', 'POST_REPAIR', 'INITIAL', 'VERIFICATION']).default('ROUTINE'),
  performedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  calibrationResult: z.enum(['PASSED', 'FAILED']),
  standardsUsed: z.string().max(500).optional(),
  parametersChecked: z
    .array(
      z.object({
        parameter: z.string().min(1).max(100),
        expectedValue: z.string().min(1).max(50),
        measuredValue: z.string().min(1).max(50),
        tolerance: z.string().min(1).max(50),
        passed: z.boolean(),
      })
    )
    .optional(),
  certificateNumber: z.string().max(100).optional(),
  certificateUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

export const clearCalibrationSchema = z.object({
  clearanceNotes: z.string().min(5).max(1000),
});

export const calibrationIdParamSchema = z.object({
  id: z.string().min(1),
});

export const scheduleMaintenanceSchema = z.object({
  maintenanceType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'BREAKDOWN']),
  workDescription: z.string().min(3).max(1000),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  serviceProvider: z.string().max(150).optional(),
});

export const completeMaintenanceSchema = z.object({
  completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  technicianName: z.string().max(150).optional(),
  maintenanceNotes: z.string().min(3).max(2000),
  downtimeHours: z.number().min(0).optional(),
  partsReplaced: z.array(z.string().max(150)).optional(),
  nextScheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  cost: z.number().min(0).optional(),
  restoreToActiveStatus: z.boolean().default(true),
});

export const maintenanceIdParamSchema = z.object({
  id: z.string().min(1),
});

// ============================================================================
// 4. REAGENT & CONSUMABLE INVENTORY SCHEMAS
// ============================================================================

export const reagentStorageConditions = [
  'ROOM_TEMPERATURE',
  'REFRIGERATED_2_8C',
  'FROZEN_MINUS_20C',
  'DEEP_FREEZE_MINUS_80C',
] as const;

export const reagentCategories = [
  'REAGENT',
  'CALIBRATOR',
  'CONTROL',
  'BUFFER',
  'STAIN',
  'CONSUMABLE',
] as const;

export const reagentLotStatuses = [
  'ACTIVE',
  'EXPIRED',
  'QUARANTINED',
  'RECALLED',
  'DEPLETED',
] as const;

export const reagentTransactionTypes = [
  'RECEIPT',
  'CONSUMPTION',
  'ADJUSTMENT',
  'DISPOSAL',
  'REVERSAL',
] as const;

export const createReagentSchema = z.object({
  reagentCode: z.string().min(2).max(50).toUpperCase(),
  name: z.string().min(2).max(150),
  manufacturer: z.string().min(2).max(150),
  catalogNumber: z.string().min(1).max(100),
  category: z.enum(reagentCategories).default('REAGENT'),
  storageConditions: z.enum(reagentStorageConditions).default('REFRIGERATED_2_8C'),
  unit: z.string().min(1).max(50),
  minimumStockLevel: z.number().min(0).default(5),
  associatedTestCodes: z.array(z.string().toUpperCase()).default([]),
  isActive: z.boolean().default(true),
});

export const updateReagentSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  manufacturer: z.string().min(2).max(150).optional(),
  catalogNumber: z.string().min(1).max(100).optional(),
  category: z.enum(reagentCategories).optional(),
  storageConditions: z.enum(reagentStorageConditions).optional(),
  minimumStockLevel: z.number().min(0).optional(),
  associatedTestCodes: z.array(z.string().toUpperCase()).optional(),
  isActive: z.boolean().optional(),
});

export const reagentIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createReagentLotSchema = z.object({
  reagentId: z.string().min(1),
  lotNumber: z.string().min(1).max(100),
  manufacturer: z.string().min(2).max(150),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  openedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  initialQuantity: z.number().positive(),
  storageLocation: z.string().min(1).max(150),
  supplierName: z.string().max(150).optional(),
});

export const updateReagentLotSchema = z.object({
  storageLocation: z.string().max(150).optional(),
  openedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
});

export const quarantineLotSchema = z.object({
  quarantineReason: z.string().min(5).max(1000),
  createIncident: z.boolean().default(true),
});

export const recallLotSchema = z.object({
  recalledReason: z.string().min(5).max(1000),
  createIncident: z.boolean().default(true),
});

export const reagentLotIdParamSchema = z.object({
  id: z.string().min(1),
});

export const recordReagentStockTransactionSchema = z.object({
  reagentId: z.string().min(1),
  lotId: z.string().min(1),
  transactionType: z.enum(reagentTransactionTypes),
  quantity: z.number(),
  reason: z.string().min(3).max(500),
  batchTestRunId: z.string().optional(),
  orderId: z.string().optional(),
});

// ============================================================================
// 5. TEST INSTRUMENT MAPPING SCHEMAS
// ============================================================================

export const configureTestInstrumentMappingSchema = z.object({
  testCode: z.string().min(1).max(50).toUpperCase(),
  instrumentId: z.string().min(1),
  isPrimary: z.boolean().default(false),
  reagentRequirements: z
    .array(
      z.object({
        reagentId: z.string().min(1),
        requiredQuantityPerTest: z.number().positive(),
      })
    )
    .optional(),
  qcProfileId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ============================================================================
// 6. RESULT RELEASE SAFETY GATE SCHEMAS
// ============================================================================

export const authorizeQCOverrideSchema = z.object({
  testCode: z.string().min(1).max(50).toUpperCase(),
  reason: z.string().min(10).max(1000),
  instrumentId: z.string().optional(),
  reportId: z.string().optional(),
});

// ============================================================================
// 7. QUALITY FILTER & PAGINATION QUERY SCHEMAS
// ============================================================================

export const qualityFilterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
  instrumentId: z.string().optional(),
  reagentId: z.string().optional(),
  testCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
