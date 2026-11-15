/**
 * HealthBridge India — Laboratory Routes
 * Route declarations for Laboratory Portal (Profile, Tests, Orders, Samples, Accessioning, Centers, Dashboard)
 */

import { Router } from 'express';
import { laboratoryController } from '../controllers/laboratory.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';

export const laboratoryRoutes = Router();

// Enforce authentication & LABORATORY role authorization across all endpoints
laboratoryRoutes.use(authenticate);
laboratoryRoutes.use(authorize(['LABORATORY']));

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

export default laboratoryRoutes;
