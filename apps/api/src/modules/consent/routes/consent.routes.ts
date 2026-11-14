import { Router } from 'express';
import { consentController } from '../controllers/consent.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import {
  consentFilterQuerySchema,
  consentIdParamSchema,
  approveConsentActionSchema,
  rejectConsentActionSchema,
  revokeConsentActionSchema,
} from '@healthbridge/validation';

export const consentRoutes = Router();

// Strict session authentication for all consent management endpoints
consentRoutes.use(authenticate);

// Restricted to PATIENT role (patients alone govern their electronic consent)
consentRoutes.use(authorize(['PATIENT']));

// 1. GET /api/v1/consent/summary — KPI counts for permissions dashboard
consentRoutes.get('/summary', consentController.getSummary);

// 2. GET /api/v1/consent/requests — Incoming access requests
consentRoutes.get(
  '/requests',
  validateRequest({ query: consentFilterQuerySchema }),
  consentController.getRequests
);

// 3. GET /api/v1/consent/active — Currently active approved permissions
consentRoutes.get(
  '/active',
  validateRequest({ query: consentFilterQuerySchema }),
  consentController.getActive
);

// 4. GET /api/v1/consent/history — Chronological audit trail of consent events
consentRoutes.get('/history', consentController.getHistory);

// 5. GET /api/v1/consent — Paginated list of consent requests with status filters
consentRoutes.get(
  '/',
  validateRequest({ query: consentFilterQuerySchema }),
  consentController.getConsents
);

// 6. GET /api/v1/consent/:consentId — Detailed consent review
consentRoutes.get(
  '/:consentId',
  validateRequest({ params: consentIdParamSchema }),
  consentController.getConsentById
);

// 7. POST /api/v1/consent/:consentId/approve — Approve access request
consentRoutes.post(
  '/:consentId/approve',
  validateRequest({ params: consentIdParamSchema, body: approveConsentActionSchema }),
  consentController.approveConsent
);

// 8. POST /api/v1/consent/:consentId/reject — Reject access request
consentRoutes.post(
  '/:consentId/reject',
  validateRequest({ params: consentIdParamSchema, body: rejectConsentActionSchema }),
  consentController.rejectConsent
);

// 9. POST /api/v1/consent/:consentId/revoke — Revoke active permission
consentRoutes.post(
  '/:consentId/revoke',
  validateRequest({ params: consentIdParamSchema, body: revokeConsentActionSchema }),
  consentController.revokeConsent
);
