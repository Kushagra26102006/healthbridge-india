/**
 * HealthBridge India — Privacy Governance & Patient Rights Routes (Day 9 Task 02)
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { privacyController } from './privacy.controller';

export const publicPrivacyRoutes = Router();
publicPrivacyRoutes.get('/notice', privacyController.getPublicNotice);
publicPrivacyRoutes.get('/governance', privacyController.getGovernanceMetadata);

export const patientPrivacyRoutes = Router();
patientPrivacyRoutes.use(authenticate);
patientPrivacyRoutes.use(authorize(['PATIENT']));

patientPrivacyRoutes.get('/overview', privacyController.getPatientOverview);
patientPrivacyRoutes.get('/access-history', privacyController.getPatientAccessHistory);
patientPrivacyRoutes.post('/notice-acknowledgements', privacyController.acknowledgeNotice);

// Patient Data Export Workflow
patientPrivacyRoutes.post('/export-requests', privacyController.createExportRequest);
patientPrivacyRoutes.get('/export-requests', privacyController.listExportRequests);
patientPrivacyRoutes.get('/export-requests/:id', privacyController.getExportRequestById);
patientPrivacyRoutes.get('/export-requests/:id/download', privacyController.downloadExportArtifact);

// Patient Data Correction Workflow
patientPrivacyRoutes.post('/correction-requests', privacyController.createCorrectionRequest);
patientPrivacyRoutes.get('/correction-requests', privacyController.listCorrectionRequests);

// Patient Account Closure & Deletion Workflow
patientPrivacyRoutes.post('/deletion-requests', privacyController.createDeletionRequest);
patientPrivacyRoutes.get('/deletion-requests', privacyController.listDeletionRequests);

export const adminPrivacyRoutes = Router();
adminPrivacyRoutes.use(authenticate);
adminPrivacyRoutes.use(authorize(['ADMIN']));

adminPrivacyRoutes.get('/requests', privacyController.listAdminRequests);
adminPrivacyRoutes.patch('/requests/:id/review', privacyController.reviewAdminRequest);
adminPrivacyRoutes.post('/legal-holds', privacyController.createLegalHold);
adminPrivacyRoutes.get('/retention-policies', privacyController.getGovernanceMetadata);
