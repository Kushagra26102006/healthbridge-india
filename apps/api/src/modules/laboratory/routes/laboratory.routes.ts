/**
 * HealthBridge India — Laboratory Routes
 * Route declarations for Laboratory Portal (Profile, Tests, Orders, Samples, Accessioning, Centers, Dashboard)
 */

import { Router } from 'express';
import { laboratoryController } from '../controllers/laboratory.controller';
import { labReportController } from '../controllers/lab-report.controller';
import { laboratoryWorkforceController } from '../controllers/workforce.controller';
import { qualityRoutes } from './quality.routes';
import { workforceRoutes } from './workforce.routes';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validate } from '../../../middleware/validate';
import { acceptLaboratoryStaffInviteSchema } from '@healthbridge/validation';

export const laboratoryRoutes = Router();

// ============================================================================
// PUBLIC / ONBOARDING ENDPOINT (Accept Staff Invitation)
// ============================================================================
laboratoryRoutes.post(
  '/staff/accept-invite',
  validate(acceptLaboratoryStaffInviteSchema),
  laboratoryWorkforceController.acceptInvitation.bind(laboratoryWorkforceController)
);

// Enforce authentication & LABORATORY / ADMIN role authorization across all endpoints
laboratoryRoutes.use(authenticate);
laboratoryRoutes.use(authorize(['LABORATORY', 'ADMIN']));

// ============================================================================
// 1. DASHBOARD ANALYTICS
// ============================================================================
laboratoryRoutes.get('/dashboard/summary', laboratoryController.getDashboardSummary);
laboratoryRoutes.get('/dashboard/activity', laboratoryController.getRecentActivity);

// ============================================================================
// 2. LABORATORY PROFILE & REGISTRATION
// ============================================================================
laboratoryRoutes.get('/profile', laboratoryController.getProfile);
laboratoryRoutes.patch('/profile', laboratoryController.updateProfile);
laboratoryRoutes.get('/profile/verification-status', laboratoryController.getVerificationStatus);
laboratoryRoutes.post('/profile/documents', laboratoryController.uploadDocument);
laboratoryRoutes.delete('/profile/documents/:documentId', laboratoryController.deleteDocument);

// ============================================================================
// 3. DIAGNOSTIC TEST CATALOGUE
// ============================================================================
laboratoryRoutes.get('/tests', laboratoryController.listTests);
laboratoryRoutes.post('/tests', laboratoryController.createTest);
laboratoryRoutes.get('/tests/:testId', laboratoryController.getTestById);
laboratoryRoutes.patch('/tests/:testId', laboratoryController.updateTest);
laboratoryRoutes.patch('/tests/:testId/status', laboratoryController.toggleTestStatus);
laboratoryRoutes.delete('/tests/:testId', laboratoryController.deleteTest);

// ============================================================================
// 4. LABORATORY ORDERS & REVIEW WORKFLOW
// ============================================================================
laboratoryRoutes.get('/orders', laboratoryController.listOrders);
laboratoryRoutes.get('/orders/:orderId', laboratoryController.getOrderById);
laboratoryRoutes.post('/orders/:orderId/accept', laboratoryController.acceptOrder);
laboratoryRoutes.post('/orders/:orderId/reject', laboratoryController.rejectOrder);
laboratoryRoutes.post('/orders/:orderId/clarification', laboratoryController.requestClarification);
laboratoryRoutes.post('/orders/:orderId/assign-tests', laboratoryController.assignTests);
laboratoryRoutes.get(
  '/orders/:orderId/specimen-requirements',
  laboratoryController.resolveSpecimenRequirements
);

// ============================================================================
// 5. SAMPLE MANAGEMENT, BARCODES & ACCESSIONING
// ============================================================================
laboratoryRoutes.get('/samples', laboratoryController.listSamples);
laboratoryRoutes.post('/samples/collect', laboratoryController.registerSampleCollection);
laboratoryRoutes.get('/samples/summary', laboratoryController.getSampleSummary);
laboratoryRoutes.get('/samples/barcode/:barcode', laboratoryController.resolveBarcode);
laboratoryRoutes.post('/samples/accession', laboratoryController.accessionSample);
laboratoryRoutes.get('/samples/:sampleId', laboratoryController.getSampleById);
laboratoryRoutes.post('/samples/:sampleId/receive', laboratoryController.accessionSample);
laboratoryRoutes.post('/samples/:sampleId/reject', laboratoryController.rejectSample);
laboratoryRoutes.get('/samples/:sampleId/label', laboratoryController.getPrintableLabelData);
laboratoryRoutes.get('/samples/:sampleId/timeline', laboratoryController.getSampleTimeline);

// ============================================================================
// 6. COLLECTION CENTERS
// ============================================================================
laboratoryRoutes.get('/collection-centers', laboratoryController.listCollectionCenters);
laboratoryRoutes.post('/collection-centers', laboratoryController.createCollectionCenter);
laboratoryRoutes.patch('/collection-centers/:centerId', laboratoryController.updateCollectionCenter);

// ============================================================================
// 7. LABORATORY REPORTS, REVIEW & APPROVAL WORKFLOW
// ============================================================================
laboratoryRoutes.get('/reports', labReportController.listReports);
laboratoryRoutes.post('/reports/test-results', labReportController.recordTestResult);
laboratoryRoutes.post('/reports/draft', labReportController.generateReportDraft);
laboratoryRoutes.get('/reports/:reportId', labReportController.getReportById);
laboratoryRoutes.post('/reports/:reportId/submit-review', labReportController.submitReportForReview);
laboratoryRoutes.post('/reports/:reportId/review', labReportController.reviewReport);
laboratoryRoutes.post('/reports/:reportId/approve', labReportController.approveReport);
laboratoryRoutes.post('/reports/:reportId/publish', labReportController.publishReport);
laboratoryRoutes.post('/reports/:reportId/amend', labReportController.requestAmendment);
laboratoryRoutes.get('/reports/:reportId/versions', labReportController.getReportVersions);
laboratoryRoutes.get('/reports/:reportId/pdf', labReportController.downloadPdf);
laboratoryRoutes.get('/reports/:reportId/fhir', labReportController.getFhirReport);

// ============================================================================
// 8. QUALITY MANAGEMENT SYSTEM (QMS), QC, INSTRUMENTS & REAGENTS
// ============================================================================
laboratoryRoutes.use(qualityRoutes);

// ============================================================================
// 9. WORKFORCE MANAGEMENT, ROLES, SHIFTS, LEAVE & WORKLOAD
// ============================================================================
laboratoryRoutes.use(workforceRoutes);

export default laboratoryRoutes;
