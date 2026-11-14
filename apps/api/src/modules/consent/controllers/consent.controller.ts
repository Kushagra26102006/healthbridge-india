import { Request, Response } from 'express';
import { consentService } from '../services/consent.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';
import { asyncHandler } from '../../../utils/async-handler';
import { AppError } from '../../../shared/errors/app-error';
import type {
  ConsentFilterQueryInput,
  ApproveConsentActionInput,
  RejectConsentActionInput,
  RevokeConsentActionInput,
} from '@healthbridge/validation';

export class ConsentController {
  /**
   * GET /api/v1/consent
   * Retrieves paginated consent requests and active permissions for the authenticated patient
   */
  getConsents = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access consent management');
    }

    const query = req.query as unknown as ConsentFilterQueryInput;
    const result = await consentService.getPatientConsents(req.user.userId, query);

    sendSuccess(
      res,
      result.items,
      'Consent records retrieved successfully',
      HttpStatus.OK,
      result.pagination
    );
  });

  /**
   * GET /api/v1/consent/summary
   * Retrieves KPI summary metrics for patient consent dashboard
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access consent summary');
    }

    const summary = await consentService.getPatientConsentSummary(req.user.userId);
    sendSuccess(res, summary, 'Consent summary retrieved successfully');
  });

  /**
   * GET /api/v1/consent/requests
   * Retrieves incoming pending consent requests for patient review
   */
  getRequests = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access consent requests');
    }

    const query = { ...(req.query as unknown as ConsentFilterQueryInput), status: 'PENDING' };
    const result = await consentService.getPatientConsents(req.user.userId, query);

    sendSuccess(
      res,
      result.items,
      'Pending consent requests retrieved successfully',
      HttpStatus.OK,
      result.pagination
    );
  });

  /**
   * GET /api/v1/consent/active
   * Retrieves currently active consent permissions
   */
  getActive = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access active consents');
    }

    const query = { ...(req.query as unknown as ConsentFilterQueryInput), status: 'APPROVED' };
    const result = await consentService.getPatientConsents(req.user.userId, query);

    sendSuccess(
      res,
      result.items,
      'Active consent permissions retrieved successfully',
      HttpStatus.OK,
      result.pagination
    );
  });

  /**
   * GET /api/v1/consent/history
   * Retrieves chronological consent audit events
   */
  getHistory = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to access consent history');
    }

    const history = await consentService.getConsentHistory(req.user.userId);
    sendSuccess(res, history, 'Consent history timeline retrieved successfully');
  });

  /**
   * GET /api/v1/consent/:consentId
   * Retrieves full details of a single consent request
   */
  getConsentById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to view consent details');
    }

    const consentId = String(req.params.consentId);
    const consent = await consentService.getPatientConsentById(req.user.userId, consentId);

    sendSuccess(res, consent, 'Consent details retrieved successfully');
  });

  /**
   * POST /api/v1/consent/:consentId/approve
   * Approves a pending consent request and issues active artifact
   */
  approveConsent = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to approve consent');
    }

    const consentId = String(req.params.consentId);
    const body = (req.body || {}) as ApproveConsentActionInput;
    const requestId = (req as Request & { id?: string }).id || 'req-approve';

    const result = await consentService.approveConsent(
      req.user.userId,
      consentId,
      body,
      requestId
    );

    sendSuccess(res, result, 'Consent approved successfully', HttpStatus.OK);
  });

  /**
   * POST /api/v1/consent/:consentId/reject
   * Rejects an incoming consent request
   */
  rejectConsent = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to reject consent');
    }

    const consentId = String(req.params.consentId);
    const body = (req.body || {}) as RejectConsentActionInput;
    const requestId = (req as Request & { id?: string }).id || 'req-reject';

    const result = await consentService.rejectConsent(
      req.user.userId,
      consentId,
      body,
      requestId
    );

    sendSuccess(res, result, 'Consent rejected successfully', HttpStatus.OK);
  });

  /**
   * POST /api/v1/consent/:consentId/revoke
   * Revokes an active consent permission
   */
  revokeConsent = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.user.userId) {
      throw AppError.unauthorized('Authentication required to revoke consent');
    }

    const consentId = String(req.params.consentId);
    const body = (req.body || {}) as RevokeConsentActionInput;
    const requestId = (req as Request & { id?: string }).id || 'req-revoke';

    const result = await consentService.revokeConsent(
      req.user.userId,
      consentId,
      body,
      requestId
    );

    sendSuccess(res, result, 'Consent revoked successfully', HttpStatus.OK);
  });
}

export const consentController = new ConsentController();
export default consentController;
