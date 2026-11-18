import { Router } from 'express';
import { recordController } from '../controllers/record.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import {
  createRecordSchema,
  recordFilterQuerySchema,
  recordIdParamSchema,
} from '@healthbridge/validation';

export const recordRoutes = Router();

// Short-lived signed-token preview route:
// Allows secure inline rendering via HMAC-signed ?token=... OR falls back to JWT authenticate middleware.
recordRoutes.get(
  '/:recordId/preview',
  validateRequest({ params: recordIdParamSchema }),
  (req, res, next) => {
    if (typeof req.query.token === 'string' && req.query.token.length > 0) {
      return next();
    }
    return authenticate(req, res, next);
  },
  recordController.previewRecord
);

// All remaining record endpoints require active session authentication
recordRoutes.use(authenticate);

// 1. GET /api/v1/records/summary — Summary counts & storage usage across clinical record types
recordRoutes.get(
  '/summary',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  recordController.getSummary
);

// 2. GET /api/v1/records — Paginated list of records with multi-facet filters
recordRoutes.get(
  '/',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  validateRequest({ query: recordFilterQuerySchema }),
  recordController.getRecords
);

// 3. POST /api/v1/records — Create / upload a new health record
recordRoutes.post(
  '/',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  validateRequest({ body: createRecordSchema }),
  recordController.createRecord
);

// 4. GET /api/v1/records/:recordId/access-token — Short-lived signed preview/download link
recordRoutes.get(
  '/:recordId/access-token',
  authorize(['PATIENT', 'DOCTOR']),
  validateRequest({ params: recordIdParamSchema }),
  recordController.issueAccessToken
);

// 5. GET /api/v1/records/:recordId/download — Authorized document download
recordRoutes.get(
  '/:recordId/download',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  validateRequest({ params: recordIdParamSchema }),
  recordController.downloadRecord
);

// 6. DELETE /api/v1/records/:recordId — Safe patient-owned document archival
recordRoutes.delete(
  '/:recordId',
  authorize(['PATIENT']),
  validateRequest({ params: recordIdParamSchema }),
  recordController.archiveRecord
);

// 7. GET /api/v1/records/:recordId — Single record details with ownership verification
recordRoutes.get(
  '/:recordId',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  validateRequest({ params: recordIdParamSchema }),
  recordController.getRecordById
);

export default recordRoutes;
