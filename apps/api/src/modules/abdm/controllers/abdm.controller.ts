/**
 * HealthBridge India — ABDM Integration Foundation Controller (Day 7 Task 01)
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { abdmConfigurationService } from '../services/abdm-configuration.service';
import { abdmHealthInformationAdapter } from '../adapters/abdm-health-information.adapter';
import { abhaIdentityService } from '../services/abha-identity.service';
import { abdmConsentLifecycleService } from '../services/abdm-consent-lifecycle.service';
import { abdmHealthInformationService } from '../services/abdm-health-information.service';
import { fhirR4Validator } from '../validators/fhir-r4.validator';
import { abdmWebhookService } from '../webhooks/abdm-webhook.service';
import {
  abdmFhirValidationRequestSchema,
  abdmWebhookCallbackSchema,
} from '@healthbridge/validation';

export class AbdmController {
  /**
   * GET /api/v1/abdm/status
   * Admin-only integration readiness & redacted configuration status (zero secrets exposed).
   */
  getIntegrationStatus = asyncHandler(async (_req: Request, res: Response) => {
    const dashboard = abdmConfigurationService.getIntegrationStatusDashboard();
    const hipDetails = abdmHealthInformationAdapter.getHipReadiness();
    const hiuDetails = abdmHealthInformationAdapter.getHiuReadiness();
    const abhaAnalytics = await abhaIdentityService.getAdminAbhaAnalytics();
    const consentAnalytics = await abdmConsentLifecycleService.getAdminConsentAnalytics();
    const hipHiuAnalytics = await abdmHealthInformationService.getAdminHipHiuAnalytics();

    sendSuccess(
      res,
      {
        ...dashboard,
        hipDetails,
        hiuDetails,
        abhaAnalytics,
        consentAnalytics,
        hipHiuAnalytics,
      },
      'ABDM integration status retrieved successfully'
    );
  });

  /**
   * POST /api/v1/abdm/fhir/validate
   * Admin-only structural FHIR R4 & NRCeS ABDM Document Bundle validation endpoint.
   */
  validateFhirResource = asyncHandler(async (req: Request, res: Response) => {
    const input = abdmFhirValidationRequestSchema.parse(req.body);
    const result = fhirR4Validator.validateResource(input.resource, {
      strictAbdmProfile: input.strictAbdmProfile,
    });

    sendSuccess(
      res,
      result,
      result.valid
        ? 'FHIR R4 resource passed structural validation'
        : 'FHIR R4 resource failed structural validation'
    );
  });

  /**
   * POST /api/v1/abdm/webhooks/callback
   * Inbound ABDM asynchronous callback receiver with auth, replay-window, and idempotency guards.
   */
  receiveWebhookCallback = asyncHandler(async (req: Request, res: Response) => {
    const webhookHeaders = {
      signature: req.headers['x-abdm-signature'] as string | undefined,
      webhookSecret: req.headers['x-abdm-webhook-secret'] as string | undefined,
      requestId: req.headers['request-id'] as string | undefined,
      rawBody: JSON.stringify(req.body),
    };
    abdmWebhookService.verifyCallbackAuthentication(webhookHeaders);
    const payload = abdmWebhookCallbackSchema.parse(req.body);
    const ack = await abdmWebhookService.handleCallback(payload, webhookHeaders);

    sendSuccess(
      res,
      ack,
      ack.duplicate
        ? 'Duplicate ABDM callback acknowledged idempotently'
        : 'ABDM callback acknowledged',
      202
    );
  });
}

export const abdmController = new AbdmController();
