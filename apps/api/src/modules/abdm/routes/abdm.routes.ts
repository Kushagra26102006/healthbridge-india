/**
 * HealthBridge India — ABDM Integration Foundation Routes (Day 7 Task 01)
 */

import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { abdmController } from '../controllers/abdm.controller';

export const abdmRoutes = Router();

// Module discovery metadata (non-sensitive)
abdmRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      module: 'ABDM',
      status: 'foundation_ready',
      milestone: 'Day 7 Task 01',
      liveExchangeEnabled: false,
    },
    'ABDM integration foundation ready'
  );
});

// Dedicated inbound webhook callback endpoint (authenticated via ABDM webhook signature/secret)
abdmRoutes.post('/webhooks/callback', abdmController.receiveWebhookCallback);

// Protected Admin-Only ABDM Governance & Diagnostics Endpoints
abdmRoutes.get(
  '/status',
  authenticate,
  authorize(['ADMIN']),
  abdmController.getIntegrationStatus
);

abdmRoutes.post(
  '/fhir/validate',
  authenticate,
  authorize(['ADMIN']),
  abdmController.validateFhirResource
);

export default abdmRoutes;
