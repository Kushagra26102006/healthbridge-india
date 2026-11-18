/**
 * HealthBridge India — ABDM Consent Manager Controller (Day 7 Task 03)
 *
 * Strictly enforces:
 * - Server-side JWT actor derivation for all patient & clinician routes
 * - Zod request validation
 * - Zero local "Approve ABDM Consent" endpoint (approval MUST originate from official ABDM HIE-CM callback)
 * - Aggregate-only admin analytics (zero patient PII)
 */

import { Request, Response } from 'express';
import {
  abdmConsentSyncTriggerSchema,
  abdmWebhookCallbackSchema,
  createAbdmConsentRequestSchema,
  revokeAbdmConsentSchema,
  validateAbdmConsentAccessSchema,
} from '@healthbridge/validation';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { AppError } from '../../../shared/errors/app-error';
import { abdmConsentLifecycleService } from '../services/abdm-consent-lifecycle.service';
import { abdmConsentValidationService } from '../services/abdm-consent-validation.service';
import { abdmConsentFhirMapper } from '../mappers/abdm-consent-fhir.mapper';
import { abdmWebhookService } from '../webhooks/abdm-webhook.service';

const CALLBACK_PATH_TO_EVENT: Record<string, string> = {
  'on-init': 'consent/request/on-init',
  'on-status': 'consent/request/on-status',
  'hiu-notify': 'consent/hiu/notify',
  'hip-notify': 'consent/hip/notify',
  'on-fetch': 'consent/on-fetch',
  'revocation-notify': 'consent/revocation/notify',
};

export class AbdmConsentController {
  /**
   * POST /api/v1/abdm/consent/requests
   * Authorized clinician/facility participant initiates an external ABDM HIU consent request.
   */
  initiateRequest = asyncHandler(async (req: Request, res: Response) => {
    const input = createAbdmConsentRequestSchema.parse(req.body);
    if (!req.user?.userId || !req.user?.role) {
      throw AppError.unauthorized('Authentication required');
    }

    const created = await abdmConsentLifecycleService.initiateConsentRequest(input, {
      userId: req.user.userId,
      role: req.user.role,
      name: (req.user as any).fullName || req.user.email,
    });

    sendSuccess(
      res,
      created,
      created.isMocked
        ? 'ABDM consent request initiated (development mock mode — awaiting external approval callback)'
        : 'ABDM consent request submitted to HIE-CM (awaiting patient approval in ABDM PHR app)',
      201
    );
  });

  /**
   * GET /api/v1/abdm/consent/requests
   * Patient lists their own ABDM consent requests.
   */
  listOwnRequests = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) throw AppError.unauthorized('Authentication required');

    const requests = await abdmConsentLifecycleService.listPatientRequests(patientId);
    sendSuccess(res, requests, 'ABDM consent requests retrieved successfully');
  });

  /**
   * GET /api/v1/abdm/consent/requests/:id
   * Patient views details of a specific ABDM consent request (strict ownership enforced).
   */
  getOwnRequestDetail = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) throw AppError.unauthorized('Authentication required');

    const detail = await abdmConsentLifecycleService.getPatientRequestDetail(
      patientId,
      String(req.params.id)
    );
    sendSuccess(res, detail, 'ABDM consent request retrieved successfully');
  });

  /**
   * POST /api/v1/abdm/consent/requests/:id/refresh
   * Synchronizes latest status for patient's consent request.
   */
  refreshOwnRequestStatus = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) throw AppError.unauthorized('Authentication required');

    const updated = await abdmConsentLifecycleService.refreshPatientRequestStatus(
      patientId,
      String(req.params.id)
    );
    sendSuccess(res, updated, 'ABDM consent request status synchronized');
  });

  /**
   * GET /api/v1/abdm/consent/artefacts
   * Patient lists their own ABDM consent artefacts.
   */
  listOwnArtefacts = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) throw AppError.unauthorized('Authentication required');

    const artefacts = await abdmConsentLifecycleService.listPatientArtefacts(patientId);
    sendSuccess(res, artefacts, 'ABDM consent artefacts retrieved successfully');
  });

  /**
   * GET /api/v1/abdm/consent/artefacts/:id
   * Patient views a specific ABDM consent artefact & preserved original external payload.
   */
  getOwnArtefactDetail = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) throw AppError.unauthorized('Authentication required');

    const detail = await abdmConsentLifecycleService.getPatientArtefactDetail(
      patientId,
      String(req.params.id)
    );
    sendSuccess(res, detail, 'ABDM consent artefact retrieved successfully');
  });

  /**
   * GET /api/v1/abdm/consent/artefacts/:id/fhir
   * Generates a FHIR R4 Consent projection for the patient's own ABDM artefact while
   * preserving original artefact integrity and reporting unmapped fields explicitly.
   */
  getOwnArtefactFhirProjection = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) throw AppError.unauthorized('Authentication required');

    const { artefact } = await abdmConsentLifecycleService.getPatientArtefactDetail(
      patientId,
      String(req.params.id)
    );
    const fhirResult = abdmConsentFhirMapper.mapArtefactToFhirConsent(artefact);
    sendSuccess(res, fhirResult, 'FHIR R4 Consent projection generated');
  });

  /**
   * POST /api/v1/abdm/consent/artefacts/:id/revoke
   * Patient initiates consent revocation (blocks local authorization immediately;
   * marks PENDING_CONFIRMATION until external HIE-CM REVOKED callback arrives).
   */
  revokeOwnArtefact = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) throw AppError.unauthorized('Authentication required');

    const input = revokeAbdmConsentSchema.parse(req.body);
    const phrAuthToken = req.headers['x-abdm-phr-token'] as string | undefined;

    const result = await abdmConsentLifecycleService.initiatePatientRevocation(
      patientId,
      String(req.params.id),
      input.reason,
      phrAuthToken
    );
    sendSuccess(res, result, result.message);
  });

  /**
   * GET /api/v1/abdm/consent/history
   * Patient retrieves their immutable ABDM consent lifecycle & callback audit history.
   */
  getOwnHistory = asyncHandler(async (req: Request, res: Response) => {
    const patientId = req.user?.userId;
    if (!patientId) throw AppError.unauthorized('Authentication required');

    const events = await abdmConsentLifecycleService.getPatientConsentHistory(patientId);
    sendSuccess(res, events, 'ABDM consent history retrieved successfully');
  });

  /**
   * POST /api/v1/abdm/consent/validate-access
   * Centralized ABDM consent authorization check endpoint.
   */
  validateAccess = asyncHandler(async (req: Request, res: Response) => {
    const input = validateAbdmConsentAccessSchema.parse(req.body);
    if (!req.user?.userId || !req.user?.role) {
      throw AppError.unauthorized('Authentication required');
    }

    const decision = await abdmConsentValidationService.validateAbdmConsentAccess({
      ...input,
      actorId: req.user.userId,
      actorRole: req.user.role,
    });

    sendSuccess(res, decision, `Consent access evaluation completed: ${decision.decision}`);
  });

  /**
   * GET /api/v1/abdm/consent/analytics
   * Admin-only aggregate ABDM consent telemetry (zero patient PII).
   */
  getAdminAnalytics = asyncHandler(async (_req: Request, res: Response) => {
    const analytics = await abdmConsentLifecycleService.getAdminConsentAnalytics();
    sendSuccess(res, analytics, 'ABDM consent integration analytics retrieved successfully');
  });

  /**
   * POST /api/v1/abdm/consent/sync
   * Admin-only manual trigger for expiry detection & external status synchronization sweep.
   */
  triggerSyncSweep = asyncHandler(async (req: Request, res: Response) => {
    const input = abdmConsentSyncTriggerSchema.parse(req.body || {});
    const summary = await abdmConsentLifecycleService.runExpiryAndStatusSync({
      syncType: 'MANUAL_ADMIN_SYNC',
      triggeredBy: req.user?.userId,
      nearingExpiryHours: input.nearingExpiryHours,
      pollExternalStatus: input.pollExternalStatus,
    });
    sendSuccess(res, summary, 'ABDM consent synchronization sweep completed');
  });

  /**
   * POST /api/v1/abdm/webhooks/consent/:callbackType
   * Verified dedicated ABDM V3 consent callback endpoint (routes through webhook auth + replay + idempotency).
   */
  receiveConsentCallback = asyncHandler(async (req: Request, res: Response) => {
    const webhookHeaders = {
      signature: req.headers['x-abdm-signature'] as string | undefined,
      webhookSecret: req.headers['x-abdm-webhook-secret'] as string | undefined,
      requestId: req.headers['request-id'] as string | undefined,
      rawBody: JSON.stringify(req.body),
    };
    abdmWebhookService.verifyCallbackAuthentication(webhookHeaders);

    const callbackType = String(req.params.callbackType || '');
    const mappedEventType = CALLBACK_PATH_TO_EVENT[callbackType];
    if (!mappedEventType) {
      throw AppError.badRequest(`Unsupported ABDM consent callback type '${callbackType}'.`);
    }

    const normalizedBody = {
      ...req.body,
      eventType: req.body?.eventType || mappedEventType,
    };
    const payload = abdmWebhookCallbackSchema.parse(normalizedBody);

    const ack = await abdmWebhookService.handleCallback(payload, webhookHeaders);

    sendSuccess(
      res,
      ack,
      ack.duplicate
        ? 'Duplicate ABDM consent callback acknowledged idempotently'
        : 'ABDM consent callback acknowledged',
      202
    );
  });
}

export const abdmConsentController = new AbdmConsentController();
