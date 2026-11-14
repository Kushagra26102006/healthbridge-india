import { Router } from 'express';
import { labReportController } from '../controllers/lab-report.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';

export const labReportRoutes = Router();

// Enforce authentication across all lab report endpoints
labReportRoutes.use(authenticate);

// Metric summary count across patient lab reports
labReportRoutes.get('/summary', authorize(['PATIENT']), labReportController.getSummary);

// Paginated query of laboratory reports with multi-facet filters
labReportRoutes.get('/', authorize(['PATIENT', 'DOCTOR', 'ADMIN']), labReportController.getReports);

// Download authorized diagnostic report document
labReportRoutes.get(
  '/:reportId/download',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  labReportController.downloadReport
);

// Retrieve full details of single laboratory report with observations
labReportRoutes.get(
  '/:reportId',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  labReportController.getReportById
);

export default labReportRoutes;

