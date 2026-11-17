/**
 * HealthBridge India — ABHA Identity Controller (Day 7 Task 02)
 *
 * Security Invariants:
 * - Authenticated patient identity is ALWAYS derived from server-side session (`req.user.userId`).
 *   Any `patientId` supplied in request body/query by the client is ignored for patient routes.
 * - All inputs are validated via Zod schemas before reaching external adapters.
 * - No client secrets, gateway tokens, X-Tokens, OTP values, or Aadhaar numbers are ever returned.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { AppError } from '../../../shared/errors/app-error';
import { abhaIdentityService } from '../services/abha-identity.service';
import {
  abhaAddressCheckSchema,
  abhaAddressCreateSchema,
  abhaAddressVerifyInitiateSchema,
  abhaCreationCompleteSchema,
  abhaCreationInitiateSchema,
  abhaLinkConfirmSchema,
  abhaNumberVerifyInitiateSchema,
  abhaOtpConfirmSchema,
  abhaUnlinkSchema,
} from '@healthbridge/validation';

function requirePatientActor(req: Request): string {
  const userId = req.user?.userId;
  if (!userId) {
    throw AppError.unauthorized('Authentication required for ABHA identity operations.');
  }
  return userId;
}

export class AbhaController {
  /**
   * GET /api/v1/abdm/abha/status
   * Retrieve authenticated patient's own ABHA connection & verification status.
   */
  getOwnStatus = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const status = await abhaIdentityService.getPatientAbhaStatus(patientId);
    sendSuccess(res, status, 'Patient ABHA status retrieved successfully');
  });

  /**
   * GET /api/v1/abdm/abha/history
   * Retrieve authenticated patient's own ABHA linking & verification transaction history.
   */
  getOwnHistory = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const limitParam = Number(req.query.limit || 25);
    const history = await abhaIdentityService.getPatientAbhaHistory(
      patientId,
      Number.isNaN(limitParam) ? 25 : limitParam
    );
    sendSuccess(res, history, 'Patient ABHA transaction history retrieved successfully');
  });

  /**
   * POST /api/v1/abdm/abha/creation/initiate
   * Initiate official ABHA V3 creation via Aadhaar OTP (`POST /v3/enrollment/request/otp`).
   */
  initiateCreation = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaCreationInitiateSchema.parse(req.body);

    const result = await abhaIdentityService.initiateAbhaCreation({
      patientId,
      actorId: patientId,
      method: input.method,
      aadhaarNumber: input.aadhaarNumber,
      patientConsentConfirmed: input.patientConsentConfirmed,
    });

    sendSuccess(res, result, 'ABHA creation OTP workflow initiated', 202);
  });

  /**
   * POST /api/v1/abdm/abha/creation/complete
   * Verify Aadhaar OTP & complete ABHA V3 enrolment (`POST /v3/enrollment/enrol/byAadhaar`).
   */
  completeCreation = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaCreationCompleteSchema.parse(req.body);

    const outcome = await abhaIdentityService.completeAbhaCreation({
      patientId,
      actorId: patientId,
      internalTransactionId: input.internalTransactionId,
      otp: input.otp,
      mobileNumber: input.mobileNumber,
      consentAccepted: input.consentAccepted,
    });

    sendSuccess(res, outcome, 'ABHA creation OTP verified; review and confirm linking');
  });

  /**
   * POST /api/v1/abdm/abha/verify
   * Initiate ABHA Number ownership verification (`POST /v3/profile/login/request/otp`).
   */
  initiateNumberVerification = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaNumberVerifyInitiateSchema.parse(req.body);

    const result = await abhaIdentityService.initiateAbhaNumberVerification({
      patientId,
      actorId: patientId,
      abhaNumber: input.abhaNumber,
      otpSystem: input.otpSystem,
      patientConsentConfirmed: input.patientConsentConfirmed,
    });

    sendSuccess(res, result, 'ABHA number verification OTP requested', 202);
  });

  /**
   * POST /api/v1/abdm/abha/verify/confirm
   * Confirm ABHA Number OTP verification (`POST /v3/profile/login/verify`).
   */
  confirmNumberVerification = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaOtpConfirmSchema.parse(req.body);

    const outcome = await abhaIdentityService.confirmAbhaNumberVerification({
      patientId,
      actorId: patientId,
      internalTransactionId: input.internalTransactionId,
      otp: input.otp,
    });

    sendSuccess(res, outcome, 'ABHA number ownership verified');
  });

  /**
   * POST /api/v1/abdm/abha/address/check
   * Check ABHA Address existence/availability (`POST /v3/phr/app/enrollment/isExists`).
   */
  checkAddress = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaAddressCheckSchema.parse(req.body);

    const result = await abhaIdentityService.checkAbhaAddressAvailability({
      patientId,
      actorId: patientId,
      abhaAddress: input.abhaAddress,
    });

    sendSuccess(res, result, 'ABHA address availability checked');
  });

  /**
   * GET /api/v1/abdm/abha/address/suggestions
   * Retrieve ABHA Address suggestions for an active enrolment transaction.
   */
  getAddressSuggestions = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const internalTransactionId = String(req.query.internalTransactionId || '').trim();
    if (!internalTransactionId) {
      throw AppError.badRequest('Query parameter internalTransactionId is required.');
    }

    const result = await abhaIdentityService.getAbhaAddressSuggestions({
      patientId,
      internalTransactionId,
    });

    sendSuccess(res, result, 'ABHA address suggestions retrieved');
  });

  /**
   * POST /api/v1/abdm/abha/address/create
   * Enrol a chosen ABHA Address for a verified enrolment transaction.
   */
  createAddress = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaAddressCreateSchema.parse(req.body);

    const result = await abhaIdentityService.createAbhaAddress({
      patientId,
      actorId: patientId,
      internalTransactionId: input.internalTransactionId,
      abhaAddress: input.abhaAddress,
      preferred: input.preferred,
    });

    sendSuccess(res, result, 'ABHA address created and attached to enrolment transaction', 201);
  });

  /**
   * POST /api/v1/abdm/abha/address/verify
   * Initiate ABHA Address ownership verification (`POST /v3/phr/web/login/abha/request/otp`).
   */
  initiateAddressVerification = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaAddressVerifyInitiateSchema.parse(req.body);

    const result = await abhaIdentityService.initiateAbhaAddressVerification({
      patientId,
      actorId: patientId,
      abhaAddress: input.abhaAddress,
      otpSystem: input.otpSystem,
      patientConsentConfirmed: input.patientConsentConfirmed,
    });

    sendSuccess(res, result, 'ABHA address verification OTP requested', 202);
  });

  /**
   * POST /api/v1/abdm/abha/address/verify/confirm
   * Confirm ABHA Address OTP verification (`POST /v3/phr/web/login/abha/verify`).
   */
  confirmAddressVerification = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaOtpConfirmSchema.parse(req.body);

    const outcome = await abhaIdentityService.confirmAbhaAddressVerification({
      patientId,
      actorId: patientId,
      internalTransactionId: input.internalTransactionId,
      otp: input.otp,
    });

    sendSuccess(res, outcome, 'ABHA address ownership verified');
  });

  /**
   * GET /api/v1/abdm/abha/profile
   * Retrieve authorized ABHA profile using server-held ephemeral X-Token (`GET /v3/profile/account`).
   */
  getAuthorizedProfile = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const profile = await abhaIdentityService.getAuthorizedAbhaProfile(patientId);
    sendSuccess(res, profile, 'Authorized ABHA profile retrieved successfully');
  });

  /**
   * POST /api/v1/abdm/abha/link
   * Explicitly persist a verified ABHA identity link to the authenticated patient record.
   */
  confirmLink = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaLinkConfirmSchema.parse(req.body);

    const status = await abhaIdentityService.linkVerifiedAbha({
      patientId,
      actorId: patientId,
      internalTransactionId: input.internalTransactionId,
      patientConsentConfirmed: input.patientConsentConfirmed,
      purposeAcknowledged: input.purposeAcknowledged,
    });

    sendSuccess(res, status, 'Verified ABHA identity linked to your HealthBridge account');
  });

  /**
   * POST /api/v1/abdm/abha/unlink
   * Remove local HealthBridge ABHA identity association while preserving audit history.
   */
  unlinkOwnAbha = asyncHandler(async (req: Request, res: Response) => {
    const patientId = requirePatientActor(req);
    const input = abhaUnlinkSchema.parse(req.body);

    const status = await abhaIdentityService.unlinkPatientAbha({
      patientId,
      actorId: patientId,
      reason: input.reason,
      confirmUnlink: input.confirmUnlink,
    });

    sendSuccess(res, status, 'ABHA identity unlinked from HealthBridge (national ABHA unaffected)');
  });

  /**
   * GET /api/v1/abdm/abha/analytics
   * Admin-only aggregate ABHA integration metrics & sanitized failure telemetry (zero patient PII).
   */
  getAdminAnalytics = asyncHandler(async (_req: Request, res: Response) => {
    const analytics = await abhaIdentityService.getAdminAbhaAnalytics();
    sendSuccess(res, analytics, 'ABHA integration analytics retrieved successfully');
  });
}

export const abhaController = new AbhaController();
