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
labReportRoutes.get('/', authorize(['PATIENT', 'DOCTOR', 'ADMIN', 'LABORATORY']), labReportController.getReports);

// Version ledger for report
labReportRoutes.get(
  '/:reportId/versions',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN', 'LABORATORY']),
  labReportController.getReportVersions
);

// FHIR R4 DiagnosticReport Bundle
labReportRoutes.get(
  '/:reportId/fhir',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN', 'LABORATORY']),
  labReportController.getFhirReport
);

// Download authorized diagnostic report document
labReportRoutes.get(
  '/:reportId/download',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN', 'LABORATORY']),
  labReportController.downloadReport
);

labReportRoutes.get(
  '/:reportId/pdf',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN', 'LABORATORY']),
  labReportController.downloadPdf
);

// Retrieve full details of single laboratory report with observations
labReportRoutes.get(
  '/:reportId',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN', 'LABORATORY']),
  labReportController.getReportById
);

export default labReportRoutes;
