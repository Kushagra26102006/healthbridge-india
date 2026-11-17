import { Router } from 'express';
import { qualityController } from '../controllers/quality.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';

export const qualityRoutes = Router();

// Enforce authentication & LABORATORY/ADMIN role authorization
qualityRoutes.use(authenticate);
qualityRoutes.use(authorize(['LABORATORY', 'ADMIN']));

// ============================================================================
// 1. QUALITY MANAGEMENT DASHBOARD & KPIS
// ============================================================================
qualityRoutes.get('/quality/dashboard', qualityController.getDashboard);

// ============================================================================
// 2. QUALITY CONTROL PROFILES
// ============================================================================
qualityRoutes.get('/quality/profiles', qualityController.listProfiles);
qualityRoutes.post('/quality/profiles', qualityController.createProfile);
qualityRoutes.get('/quality/profiles/:id', qualityController.getProfileById);
qualityRoutes.put('/quality/profiles/:id', qualityController.updateProfile);

// ============================================================================
// 3. QC RUNS & INVESTIGATION
// ============================================================================
qualityRoutes.get('/quality/runs', qualityController.listRuns);
qualityRoutes.post('/quality/runs', qualityController.recordRun);
qualityRoutes.get('/quality/runs/:id', qualityController.getRunById);
qualityRoutes.post('/quality/runs/:id/investigate', qualityController.investigateRun);

// ============================================================================
// 4. QUALITY INCIDENTS
// ============================================================================
qualityRoutes.get('/quality/incidents', qualityController.listIncidents);
qualityRoutes.post('/quality/incidents', qualityController.createIncident);
qualityRoutes.get('/quality/incidents/:id', qualityController.getIncidentById);
qualityRoutes.put('/quality/incidents/:id', qualityController.updateIncident);
qualityRoutes.post('/quality/incidents/:id/resolve', qualityController.resolveIncident);
qualityRoutes.post('/quality/incidents/:id/close', qualityController.closeIncident);

// ============================================================================
// 5. CORRECTIVE & PREVENTIVE ACTIONS (CAPA)
// ============================================================================
qualityRoutes.get('/quality/capa', qualityController.listCAPAs);
qualityRoutes.post('/quality/capa', qualityController.createCAPA);
qualityRoutes.get('/quality/capa/:id', qualityController.getCAPAById);
qualityRoutes.put('/quality/capa/:id', qualityController.updateCAPA);
qualityRoutes.post('/quality/capa/:id/actions', qualityController.addCAPAAction);
qualityRoutes.post('/quality/capa/:id/review', qualityController.reviewCAPA);
qualityRoutes.post('/quality/capa/:id/reopen', qualityController.reopenCAPA);

// ============================================================================
// 6. INSTRUMENT MANAGEMENT
// ============================================================================
qualityRoutes.get('/quality/instruments', qualityController.listInstruments);
qualityRoutes.post('/quality/instruments', qualityController.createInstrument);
qualityRoutes.get('/quality/instruments/:id', qualityController.getInstrumentById);
qualityRoutes.put('/quality/instruments/:id', qualityController.updateInstrument);
qualityRoutes.post('/quality/instruments/:id/status', qualityController.changeInstrumentStatus);

// ============================================================================
// 7. CALIBRATION & MAINTENANCE
// ============================================================================
qualityRoutes.get('/quality/calibrations', qualityController.listCalibrations);
qualityRoutes.post('/quality/calibrations/schedule', qualityController.scheduleCalibration);
qualityRoutes.post('/quality/instruments/:id/calibrations', qualityController.recordCalibration);
qualityRoutes.post('/quality/calibrations/:id/clear', qualityController.clearCalibration);

qualityRoutes.get('/quality/maintenance', qualityController.listMaintenance);
qualityRoutes.post('/quality/maintenance/schedule', qualityController.scheduleMaintenance);
qualityRoutes.post('/quality/maintenance/:id/complete', qualityController.completeMaintenance);

// ============================================================================
// 8. TEST-INSTRUMENT MAPPING
// ============================================================================
qualityRoutes.post('/quality/mappings', qualityController.configureMapping);

// ============================================================================
// 9. RESULT RELEASE SAFETY GATE
// ============================================================================
qualityRoutes.get('/quality/release-gate/check', qualityController.checkReleaseGate);
qualityRoutes.post('/quality/release-gate/override', qualityController.authorizeReleaseOverride);

// ============================================================================
// 10. REAGENT & INVENTORY MANAGEMENT
// ============================================================================
qualityRoutes.get('/inventory/reagents', qualityController.listReagents);
qualityRoutes.post('/inventory/reagents', qualityController.createReagent);
qualityRoutes.get('/inventory/reagents/lots', qualityController.listLots);
qualityRoutes.post('/inventory/reagents/lots', qualityController.createLot);
qualityRoutes.get('/inventory/reagents/transactions', qualityController.listTransactions);
qualityRoutes.post('/inventory/reagents/transactions', qualityController.recordStockTransaction);

qualityRoutes.get('/inventory/reagents/lots/:id', qualityController.getLotById);
qualityRoutes.post('/inventory/reagents/lots/:id/quarantine', qualityController.quarantineLot);
qualityRoutes.post('/inventory/reagents/lots/:id/recall', qualityController.recallLot);
qualityRoutes.get('/inventory/reagents/lots/:id/validate', qualityController.validateLot);

qualityRoutes.get('/inventory/reagents/:id', qualityController.getReagentById);
qualityRoutes.put('/inventory/reagents/:id', qualityController.updateReagent);
qualityRoutes.get('/inventory/reagents/:id/fefo', qualityController.getRecommendedLotFEFO);

export default qualityRoutes;
