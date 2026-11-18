/**
 * HealthBridge India — ABDM & ABHA Integration Routes (Day 7 Tasks 01 & 02)
 */

import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../../utils/api-response';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { createRateLimiter } from '../../../middleware/rate-limit';
import { abdmController } from '../controllers/abdm.controller';
import { abhaController } from '../controllers/abha.controller';
import { abdmConsentController } from '../controllers/abdm-consent.controller';
import { abdmHieController } from '../controllers/abdm-hie.controller';

export const abdmRoutes = Router();

// Dedicated anti-brute-force rate limiters for ABHA OTP & verification endpoints
const abhaOtpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many ABHA OTP or verification attempts. Please wait before retrying.',
  keyGenerator: (req: Request) =>
    `abha-otp:${req.user?.userId || req.ip || req.socket.remoteAddress || 'anon'}`,
});

const abhaGeneralLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Too many ABHA requests. Please slow down and try again shortly.',
  keyGenerator: (req: Request) =>
    `abha-gen:${req.user?.userId || req.ip || req.socket.remoteAddress || 'anon'}`,
});

// Module discovery metadata (non-sensitive)
abdmRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      module: 'ABDM',
      status: 'abdm_hip_hiu_exchange_foundation_ready',
      milestone: 'Day 7 Task 04',
      liveExchangeEnabled: false,
    },
    'ABDM, ABHA, Consent Manager & HIP/HIU integration foundation ready'
  );
});

// Dedicated inbound webhook callback endpoints (authenticated via ABDM webhook signature/secret)
abdmRoutes.post('/webhooks/callback', abdmController.receiveWebhookCallback);
abdmRoutes.post('/webhooks/consent/:callbackType', abdmConsentController.receiveConsentCallback);

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

abdmRoutes.get(
  '/abha/analytics',
  authenticate,
  authorize(['ADMIN']),
  abhaController.getAdminAnalytics
);

// ============================================================================
// PATIENT-ONLY ABHA IDENTITY ENDPOINTS (Actor strictly derived from JWT session)
// ============================================================================

abdmRoutes.get(
  '/abha/status',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abhaController.getOwnStatus
);

abdmRoutes.get(
  '/abha/history',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abhaController.getOwnHistory
);

abdmRoutes.post(
  '/abha/creation/initiate',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.initiateCreation
);

abdmRoutes.post(
  '/abha/creation/complete',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.completeCreation
);

abdmRoutes.post(
  '/abha/verify',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.initiateNumberVerification
);

abdmRoutes.post(
  '/abha/verify/confirm',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.confirmNumberVerification
);

abdmRoutes.post(
  '/abha/address/check',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abhaController.checkAddress
);

abdmRoutes.get(
  '/abha/address/suggestions',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abhaController.getAddressSuggestions
);

abdmRoutes.post(
  '/abha/address/create',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.createAddress
);

abdmRoutes.post(
  '/abha/address/verify',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.initiateAddressVerification
);

abdmRoutes.post(
  '/abha/address/verify/confirm',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.confirmAddressVerification
);

abdmRoutes.get(
  '/abha/profile',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abhaController.getAuthorizedProfile
);

abdmRoutes.post(
  '/abha/link',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.confirmLink
);

abdmRoutes.post(
  '/abha/unlink',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abhaController.unlinkOwnAbha
);

// ============================================================================
// ABDM CONSENT MANAGER ENDPOINTS (Day 7 Task 03 — Strict RBAC & Ownership)
// ============================================================================

abdmRoutes.post(
  '/consent/requests',
  authenticate,
  authorize(['DOCTOR', 'LABORATORY', 'PHARMACY', 'ADMIN']),
  abhaGeneralLimiter,
  abdmConsentController.initiateRequest
);

abdmRoutes.get(
  '/consent/requests',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abdmConsentController.listOwnRequests
);

abdmRoutes.get(
  '/consent/requests/:id',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abdmConsentController.getOwnRequestDetail
);

abdmRoutes.post(
  '/consent/requests/:id/refresh',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abdmConsentController.refreshOwnRequestStatus
);

abdmRoutes.get(
  '/consent/artefacts',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abdmConsentController.listOwnArtefacts
);

abdmRoutes.get(
  '/consent/artefacts/:id',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abdmConsentController.getOwnArtefactDetail
);

abdmRoutes.get(
  '/consent/artefacts/:id/fhir',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abdmConsentController.getOwnArtefactFhirProjection
);

abdmRoutes.post(
  '/consent/artefacts/:id/revoke',
  authenticate,
  authorize(['PATIENT']),
  abhaOtpLimiter,
  abdmConsentController.revokeOwnArtefact
);

abdmRoutes.get(
  '/consent/history',
  authenticate,
  authorize(['PATIENT']),
  abhaGeneralLimiter,
  abdmConsentController.getOwnHistory
);

abdmRoutes.post(
  '/consent/validate-access',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'LABORATORY', 'PHARMACY', 'ADMIN']),
  abhaGeneralLimiter,
  abdmConsentController.validateAccess
);

abdmRoutes.get(
  '/consent/analytics',
  authenticate,
  authorize(['ADMIN']),
  abdmConsentController.getAdminAnalytics
);

abdmRoutes.post(
  '/consent/sync',
  authenticate,
  authorize(['ADMIN']),
  abdmConsentController.triggerSyncSweep
);

// ============================================================================
// DAY 7 TASK 04 — ABDM HIP / HIU DISCOVERY, RECORD LINKING & DATA EXCHANGE
// ============================================================================

// Inbound authenticated external callbacks (HMAC/secret + ±5m replay window)
abdmRoutes.post('/webhooks/hie/discovery', abdmHieController.receiveDiscoveryCallback);
abdmRoutes.post('/webhooks/hip/health-information/request', abdmHieController.receiveHipHealthInfoRequest);
abdmRoutes.post('/webhooks/hiu/data-push', abdmHieController.receiveHiuDataPushCallback);
abdmRoutes.post('/webhooks/hie/acknowledgement', abdmHieController.receiveTransferAcknowledgement);

// Discovery endpoints
abdmRoutes.post(
  '/hie/discovery',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.initiateDiscovery
);

abdmRoutes.get(
  '/hie/discovery',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.listDiscoveryHistory
);

abdmRoutes.get(
  '/hie/discovery/:id',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.getDiscoveryStatus
);

// Health-record care-context linking endpoints
abdmRoutes.post(
  '/hie/linking',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.initiateLinking
);

abdmRoutes.post(
  '/hie/linking/:id/confirm',
  authenticate,
  authorize(['PATIENT', 'ADMIN']),
  abhaOtpLimiter,
  abdmHieController.confirmLinking
);

abdmRoutes.post(
  '/hie/linking/:id/unlink',
  authenticate,
  authorize(['PATIENT', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.unlinkRecord
);

abdmRoutes.get(
  '/hie/linking',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.listLinkedRecords
);

abdmRoutes.get(
  '/hie/linking/:id',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.getLinkedRecordStatus
);

// HIP transfer visibility (Admin / Laboratory / Doctor / Patient own)
abdmRoutes.get(
  '/hip/transfers',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'LABORATORY', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.listHipTransfers
);

// HIU health information request & transfers
abdmRoutes.post(
  '/hiu/requests',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'LABORATORY', 'PHARMACY', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.initiateHiuHealthInfoRequest
);

abdmRoutes.get(
  '/hiu/transfers',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'LABORATORY', 'PHARMACY', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.listHiuTransfers
);

// Unified transfer history & status detail
abdmRoutes.get(
  '/hie/transfers',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'LABORATORY', 'PHARMACY', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.listAllTransfers
);

abdmRoutes.get(
  '/hie/transfers/:id',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'LABORATORY', 'PHARMACY', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.getTransferDetail
);

// Read-only imported external health records (Doctors NEVER granted edit/delete endpoints)
abdmRoutes.get(
  '/hie/imported-records',
  authenticate,
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.listImportedRecords
);

abdmRoutes.post(
  '/hie/imported-records/:id/review',
  authenticate,
  authorize(['PATIENT', 'ADMIN']),
  abhaGeneralLimiter,
  abdmHieController.reviewImportedRecord
);

// Admin aggregate HIP/HIU monitoring (zero patient PII)
abdmRoutes.get(
  '/hie/analytics',
  authenticate,
  authorize(['ADMIN']),
  abdmHieController.getAdminHipHiuAnalytics
);

export default abdmRoutes;
