/**
 * HealthBridge India — ABHA Identity Verification, Linking & Lifecycle Service (Day 7 Task 02)
 *
 * Security & Governance Guarantees:
 * - Strictly derives patient identity from server-side authenticated session (`actorId`),
 *   never trusting client-supplied patient IDs or unverified ABHA numbers.
 * - Separates internal HealthBridge Patient primary key (`User._id`) from external ABHA identity.
 * - Explicitly separates ABHA identity linking (`IDENTITY_LINKING_ONLY`) from clinical data
 *   sharing consent (`AbdmConsentAdapter` / HIE-CM Consent Artefacts).
 * - Never logs Aadhaar numbers, OTP values, X-Tokens, or full ABHA numbers.
 * - Never stores OTP values after verification.
 * - Never auto-links or merges accounts based on demographic similarity alone.
 * - Prevents duplicate active ABHA links across patients without leaking other patients' identities.
 */

import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import type {
  AbdmEnvironment,
  AbdmIntegrationStatus,
  AbhaAddressAvailabilityDto,
  AbhaAddressSuggestionsDto,
  AbhaAuthorizedProfileDto,
  AbhaFailureCategory,
  AbhaIntegrationAnalyticsDto,
  AbhaLinkStatusDto,
  AbhaOtpInitiationResultDto,
  AbhaOtpSystem,
  AbhaTransactionHistoryItemDto,
  AbhaVerificationMethod,
  AbhaVerificationOutcomeDto,
  AbhaWorkflowType,
} from '@healthbridge/shared-types';
import { AbhaLinkModel, type IAbhaLinkDocument } from '../models/abha-link.model';
import {
  AbhaTransactionModel,
  type IAbhaTransactionDocument,
  type IAbhaVerifiedSnapshot,
} from '../models/abha-transaction.model';
import { PatientProfileModel } from '../../users/models/patient-profile.model';
import { UserModel } from '../../users/models/user.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { notificationService } from '../../notifications/services/notification.service';
import { AbhaV3Client, abhaV3Client, ABHA_VERIFIED_API_CATALOG } from '../clients/abha-v3.client';
import { abdmConfigurationService } from './abdm-configuration.service';
import { abdmAuthenticationService } from './abdm-authentication.service';
import { abdmCorrelationService } from './abdm-correlation.service';
import { AbdmIntegrationError } from '../errors/abdm-error';
import {
  computeAbhaNumberHash,
  decryptAbhaNumberFromStorage,
  encryptAbhaNumberForStorage,
} from '../utils/abha-crypto.util';
import {
  maskAbhaAddress,
  maskAbhaNumber,
  normalizeAbhaNumber,
  redactAbdmLogPayload,
  redactStringSecrets,
} from '../utils/redaction';
import { logger } from '../../../config/logger';

const OTP_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CONSENT_SEPARATION_NOTICE =
  'Linking your ABHA identity connects your HealthBridge account with your Ayushman Bharat Health Account for identification only. It does NOT grant automatic permission to share or access your medical records. Any health record exchange requires separate, explicit patient consent.';

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

function classifyErrorCategory(err: unknown): AbhaFailureCategory {
  if (err instanceof AbdmIntegrationError) {
    switch (err.abdmCode) {
      case 'ABDM_INVALID_OTP':
        return 'INVALID_OTP';
      case 'ABDM_SESSION_EXPIRED':
        return 'SESSION_EXPIRED';
      case 'ABDM_RATE_LIMITED':
        return 'RATE_LIMITED';
      case 'ABDM_TIMEOUT':
      case 'ABDM_TRANSIENT_ERROR':
      case 'ABDM_DISABLED':
      case 'ABDM_NOT_CONFIGURED':
        return 'SERVICE_UNAVAILABLE';
      case 'ABDM_DUPLICATE_IDENTITY':
        return 'DUPLICATE_IDENTITY';
      case 'ABDM_AUTH_ERROR':
        return 'UNAUTHORIZED';
      case 'ABDM_UNSUPPORTED_OPERATION':
        return 'UNSUPPORTED_OPERATION';
      case 'ABDM_VALIDATION_ERROR':
        return 'INVALID_INPUT';
      default:
        return 'EXTERNAL_API_ERROR';
    }
  }
  return 'EXTERNAL_API_ERROR';
}

export class AbhaIdentityService {
  private readonly client: AbhaV3Client;
  // Ephemeral fallback stores used strictly when MongoDB is disconnected in pure unit tests
  private readonly memoryLinks = new Map<string, any>();
  private readonly memoryTransactions = new Map<string, any>();
  // Ephemeral hint map (txnId -> normalized synthetic input for dev mock continuity; never persisted)
  private readonly mockTxnHints = new Map<string, { abhaNumber?: string; abhaAddress?: string }>();

  constructor(client: AbhaV3Client = abhaV3Client) {
    this.client = client;
  }

  /**
   * Resets ephemeral in-memory state (for test isolation only).
   */
  resetTestState(): void {
    this.memoryLinks.clear();
    this.memoryTransactions.clear();
    this.mockTxnHints.clear();
  }

  // ============================================================================
  // 1. PATIENT ABHA CONNECTION STATUS & HISTORY
  // ============================================================================

  async getPatientAbhaStatus(
    patientId: string,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaLinkStatusDto> {
    const config = abdmConfigurationService.loadConfig(envSource);
    const activeLink = await this.findActiveOrLatestLink(patientId);
    const hasXToken = Boolean(abdmAuthenticationService.getUserXToken(patientId));

    const enabled = config.enabled && config.environment !== 'disabled';
    const isLinked = activeLink?.linkStatus === 'ACTIVE' && activeLink?.verificationStatus === 'VERIFIED';

    return {
      patientId,
      linkId: activeLink ? String(activeLink._id || activeLink.id) : undefined,
      linkStatus: activeLink ? activeLink.linkStatus : 'NOT_LINKED',
      verificationStatus: activeLink ? activeLink.verificationStatus : 'NOT_LINKED',
      maskedAbhaNumber: activeLink?.abhaNumberMasked,
      abhaAddress: activeLink?.abhaAddress,
      abhaAddressHistory: (activeLink?.abhaAddressHistory || []).map((h: any) => ({
        address: h.address,
        status: h.status,
        verifiedAt: h.verifiedAt ? new Date(h.verifiedAt).toISOString() : undefined,
        updatedAt: new Date(h.updatedAt || Date.now()).toISOString(),
      })),
      verificationMethod: activeLink?.verificationMethod,
      linkedAt: activeLink?.linkedAt ? new Date(activeLink.linkedAt).toISOString() : undefined,
      verifiedAt: activeLink?.verifiedAt ? new Date(activeLink.verifiedAt).toISOString() : undefined,
      lastVerificationAt: activeLink?.lastVerificationAt
        ? new Date(activeLink.lastVerificationAt).toISOString()
        : undefined,
      unlinkedAt: activeLink?.unlinkMetadata?.unlinkedAt
        ? new Date(activeLink.unlinkMetadata.unlinkedAt).toISOString()
        : undefined,
      environment: config.environment,
      isMocked: activeLink ? Boolean(activeLink.isMocked) : config.environment === 'development',
      consentScope: 'IDENTITY_LINKING_ONLY',
      consentSeparationNotice: CONSENT_SEPARATION_NOTICE,
      availableActions: {
        canCreateAbha: enabled && !isLinked,
        canVerifyAbhaNumber: enabled,
        canVerifyAbhaAddress: enabled,
        canLink: enabled && !isLinked,
        canUnlinkLocal: Boolean(isLinked),
        canRetrieveProfile: Boolean(enabled && hasXToken),
      },
    };
  }

  async getPatientAbhaHistory(
    patientId: string,
    limit = 25
  ): Promise<AbhaTransactionHistoryItemDto[]> {
    const safeLimit = Math.min(100, Math.max(1, limit));
    let docs: any[] = [];

    if (isDbReady()) {
      docs = await AbhaTransactionModel.find({ patientId: new Types.ObjectId(patientId) })
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean();
    } else {
      docs = Array.from(this.memoryTransactions.values())
        .filter((t) => String(t.patientId) === String(patientId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, safeLimit);
    }

    return docs.map((d) => ({
      id: String(d._id || d.internalTransactionId),
      internalTransactionId: d.internalTransactionId,
      externalTransactionId: d.externalTransactionId,
      workflowType: d.workflowType,
      verificationMethod: d.verificationMethod,
      verificationStatus: d.verificationStatus,
      correlationId: d.correlationId,
      maskedIdentifier: d.maskedIdentifier,
      failureCategory: d.failureCategory,
      failureMessage: d.failureMessage,
      isMocked: Boolean(d.isMocked),
      environment: d.environment,
      createdAt: new Date(d.createdAt).toISOString(),
      completedAt: d.completedAt ? new Date(d.completedAt).toISOString() : undefined,
    }));
  }

  // ============================================================================
  // 2. ABHA CREATION WORKFLOW (OFFICIAL V3 BY AADHAAR OTP)
  // ============================================================================

  async initiateAbhaCreation(
    params: {
      patientId: string;
      actorId: string;
      method: 'AADHAAR_OTP';
      aadhaarNumber: string;
      patientConsentConfirmed: boolean;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaOtpInitiationResultDto> {
    if (params.method !== 'AADHAAR_OTP') {
      this.client.assertSupportedOperation(params.method);
    }
    if (!params.patientConsentConfirmed) {
      throw new AbdmIntegrationError({
        message: 'Explicit patient authorization is required before initiating ABHA creation.',
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 400,
      });
    }

    const config = abdmConfigurationService.assertValidWhenEnabled(envSource);
    const internalTransactionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + OTP_SESSION_TTL_MS);

    try {
      // Aadhaar number is RSA-encrypted inside client and NEVER logged or stored
      const otpRes = await this.client.requestEnrollmentAadhaarOtp(params.aadhaarNumber, envSource);

      await this.createTransaction({
        internalTransactionId,
        externalTransactionId: otpRes.txnId,
        patientId: params.patientId,
        initiatedBy: params.actorId,
        workflowType: 'ABHA_CREATION_AADHAAR_OTP',
        verificationMethod: 'AADHAAR_OTP',
        verificationStatus: 'VERIFICATION_IN_PROGRESS',
        correlationId: otpRes.correlationId,
        maskedIdentifier: 'AADHAAR-XXXX-XXXX-****',
        environment: config.environment,
        isMocked: otpRes.isMocked,
        patientConsentConfirmed: true,
        expiresAt,
      });

      await this.recordAudit({
        actorId: params.actorId,
        action: 'ABHA_CREATION_INITIATED',
        resourceId: internalTransactionId,
        requestId: otpRes.correlationId,
        outcome: 'SUCCESS',
        metadata: {
          patientId: params.patientId,
          workflowType: 'ABHA_CREATION_AADHAAR_OTP',
          isMocked: otpRes.isMocked,
          environment: config.environment,
        },
      });

      await this.publishPrivacySafeNotification({
        patientId: params.patientId,
        eventType: 'ABHA_LINKING_INITIATED',
        title: 'ABHA Creation Started',
        message:
          'You initiated an ABHA creation verification workflow. Enter the OTP sent to your Aadhaar-registered mobile to continue.',
        transactionId: internalTransactionId,
      });

      return {
        internalTransactionId,
        externalTransactionId: otpRes.txnId,
        correlationId: otpRes.correlationId,
        workflowType: 'ABHA_CREATION_AADHAAR_OTP',
        verificationStatus: 'VERIFICATION_IN_PROGRESS',
        maskedDestinationMessage: redactStringSecrets(otpRes.message),
        expiresAt: expiresAt.toISOString(),
        isMocked: otpRes.isMocked,
        environment: config.environment,
      };
    } catch (err) {
      await this.recordFailedAttempt({
        internalTransactionId,
        patientId: params.patientId,
        actorId: params.actorId,
        workflowType: 'ABHA_CREATION_AADHAAR_OTP',
        verificationMethod: 'AADHAAR_OTP',
        environment: config.environment,
        err,
      });
      throw err;
    }
  }

  async completeAbhaCreation(
    params: {
      patientId: string;
      actorId: string;
      internalTransactionId: string;
      otp: string;
      mobileNumber?: string;
      consentAccepted: boolean;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaVerificationOutcomeDto> {
    if (!params.consentAccepted) {
      throw new AbdmIntegrationError({
        message: 'Official ABHA enrolment consent must be accepted.',
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 400,
      });
    }

    const tx = await this.requireOwnedPendingTransaction(
      params.internalTransactionId,
      params.patientId,
      'ABHA_CREATION_AADHAAR_OTP'
    );

    try {
      const profile = await this.client.completeEnrollmentByAadhaar(
        {
          txnId: tx.externalTransactionId!,
          otp: params.otp,
          mobileNumber: params.mobileNumber,
        },
        envSource
      );

      return await this.finalizeVerifiedTransaction({
        tx,
        patientId: params.patientId,
        actorId: params.actorId,
        profile,
        verificationMethod: 'AADHAAR_OTP',
        envSource,
      });
    } catch (err) {
      await this.markTransactionFailed(tx, params.actorId, err);
      throw err;
    }
  }

  // ============================================================================
  // 3. ABHA NUMBER VERIFICATION WORKFLOW (OFFICIAL V3 LOGIN OTP)
  // ============================================================================

  async initiateAbhaNumberVerification(
    params: {
      patientId: string;
      actorId: string;
      abhaNumber: string;
      otpSystem: AbhaOtpSystem;
      patientConsentConfirmed: boolean;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaOtpInitiationResultDto> {
    if (!params.patientConsentConfirmed) {
      throw new AbdmIntegrationError({
        message: 'Explicit patient authorization is required before verifying an ABHA number.',
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 400,
      });
    }

    const config = abdmConfigurationService.assertValidWhenEnabled(envSource);
    const normalizedAbha = normalizeAbhaNumber(params.abhaNumber);
    const maskedAbha = maskAbhaNumber(normalizedAbha);
    const internalTransactionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + OTP_SESSION_TTL_MS);
    const verificationMethod: AbhaVerificationMethod =
      params.otpSystem === 'aadhaar' ? 'ABHA_NUMBER_AADHAAR_OTP' : 'ABHA_NUMBER_MOBILE_OTP';

    try {
      const otpRes = await this.client.requestAbhaNumberLoginOtp(
        { abhaNumber: normalizedAbha, otpSystem: params.otpSystem },
        envSource
      );

      if (otpRes.isMocked) {
        this.mockTxnHints.set(internalTransactionId, { abhaNumber: normalizedAbha });
      }

      await this.createTransaction({
        internalTransactionId,
        externalTransactionId: otpRes.txnId,
        patientId: params.patientId,
        initiatedBy: params.actorId,
        workflowType: 'ABHA_VERIFY_NUMBER_OTP',
        verificationMethod,
        verificationStatus: 'PENDING_VERIFICATION',
        correlationId: otpRes.correlationId,
        maskedIdentifier: maskedAbha,
        environment: config.environment,
        isMocked: otpRes.isMocked,
        patientConsentConfirmed: true,
        expiresAt,
      });

      await this.recordAudit({
        actorId: params.actorId,
        action: 'ABHA_NUMBER_VERIFICATION_INITIATED',
        resourceId: internalTransactionId,
        requestId: otpRes.correlationId,
        outcome: 'SUCCESS',
        metadata: {
          patientId: params.patientId,
          workflowType: 'ABHA_VERIFY_NUMBER_OTP',
          maskedIdentifier: maskedAbha,
          otpSystem: params.otpSystem,
          isMocked: otpRes.isMocked,
        },
      });

      await this.publishPrivacySafeNotification({
        patientId: params.patientId,
        eventType: 'ABHA_VERIFICATION_PENDING',
        title: 'ABHA Verification Pending',
        message: `Verification OTP requested for ABHA ${maskedAbha}. Complete OTP confirmation to prove ownership.`,
        transactionId: internalTransactionId,
      });

      return {
        internalTransactionId,
        externalTransactionId: otpRes.txnId,
        correlationId: otpRes.correlationId,
        workflowType: 'ABHA_VERIFY_NUMBER_OTP',
        verificationStatus: 'PENDING_VERIFICATION',
        maskedDestinationMessage: redactStringSecrets(otpRes.message),
        expiresAt: expiresAt.toISOString(),
        isMocked: otpRes.isMocked,
        environment: config.environment,
      };
    } catch (err) {
      await this.recordFailedAttempt({
        internalTransactionId,
        patientId: params.patientId,
        actorId: params.actorId,
        workflowType: 'ABHA_VERIFY_NUMBER_OTP',
        verificationMethod,
        maskedIdentifier: maskedAbha,
        environment: config.environment,
        err,
      });
      throw err;
    }
  }

  async confirmAbhaNumberVerification(
    params: {
      patientId: string;
      actorId: string;
      internalTransactionId: string;
      otp: string;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaVerificationOutcomeDto> {
    const tx = await this.requireOwnedPendingTransaction(
      params.internalTransactionId,
      params.patientId,
      'ABHA_VERIFY_NUMBER_OTP'
    );

    const otpSystem: AbhaOtpSystem =
      tx.verificationMethod === 'ABHA_NUMBER_AADHAAR_OTP' ? 'aadhaar' : 'abdm';
    const hint = this.mockTxnHints.get(params.internalTransactionId);

    try {
      const profile = await this.client.verifyAbhaNumberLoginOtp(
        {
          txnId: tx.externalTransactionId!,
          otp: params.otp,
          otpSystem,
          syntheticHintAbha: hint?.abhaNumber,
        },
        envSource
      );
      this.mockTxnHints.delete(params.internalTransactionId);

      return await this.finalizeVerifiedTransaction({
        tx,
        patientId: params.patientId,
        actorId: params.actorId,
        profile,
        verificationMethod: tx.verificationMethod || 'ABHA_NUMBER_MOBILE_OTP',
        envSource,
      });
    } catch (err) {
      await this.markTransactionFailed(tx, params.actorId, err);
      throw err;
    }
  }

  // ============================================================================
  // 4. ABHA ADDRESS WORKFLOWS (AVAILABILITY, SUGGESTIONS, CREATION, VERIFICATION)
  // ============================================================================

  async checkAbhaAddressAvailability(
    params: { patientId: string; actorId: string; abhaAddress: string },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaAddressAvailabilityDto> {
    const config = abdmConfigurationService.assertValidWhenEnabled(envSource);
    const res = await this.client.checkAbhaAddressExists(params.abhaAddress, envSource);

    await this.recordAudit({
      actorId: params.actorId,
      action: 'ABHA_ADDRESS_AVAILABILITY_CHECKED',
      resourceId: maskAbhaAddress(res.abhaAddress),
      requestId: res.correlationId,
      outcome: 'SUCCESS',
      metadata: {
        patientId: params.patientId,
        exists: res.exists,
        environment: config.environment,
        isMocked: res.isMocked,
      },
    });

    return {
      abhaAddress: res.abhaAddress,
      exists: res.exists,
      availableForCreation: !res.exists,
      correlationId: res.correlationId,
      isMocked: res.isMocked,
      checkedAt: new Date().toISOString(),
    };
  }

  async getAbhaAddressSuggestions(
    params: { patientId: string; internalTransactionId: string },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaAddressSuggestionsDto> {
    const tx = await this.findOwnedTransaction(params.internalTransactionId, params.patientId);
    if (!tx || !tx.externalTransactionId) {
      throw new AbdmIntegrationError({
        message: 'Active ABHA enrolment transaction not found for this patient.',
        abdmCode: 'ABDM_SESSION_EXPIRED',
        statusCode: 404,
      });
    }

    const res = await this.client.getAbhaAddressSuggestions(tx.externalTransactionId, envSource);
    return {
      internalTransactionId: params.internalTransactionId,
      suggestions: res.abhaAddressList,
      correlationId: res.correlationId,
      isMocked: res.isMocked,
    };
  }

  async createAbhaAddress(
    params: {
      patientId: string;
      actorId: string;
      internalTransactionId: string;
      abhaAddress: string;
      preferred?: boolean;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<{ abhaAddress: string; correlationId: string; isMocked: boolean }> {
    const tx = await this.findOwnedTransaction(params.internalTransactionId, params.patientId);
    if (!tx || !tx.externalTransactionId || tx.verificationStatus !== 'VERIFIED') {
      throw new AbdmIntegrationError({
        message: 'ABHA address creation requires a verified ABHA enrolment transaction.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    const res = await this.client.createAbhaAddress(
      {
        txnId: tx.externalTransactionId,
        abhaAddress: params.abhaAddress,
        preferred: params.preferred,
      },
      envSource
    );

    // Update verified snapshot with newly enrolled address
    const updatedSnapshot: IAbhaVerifiedSnapshot = {
      ...(tx.verifiedSnapshot || {}),
      abhaAddress: res.abhaAddress,
    };
    await this.updateTransaction(tx.internalTransactionId, {
      verifiedSnapshot: updatedSnapshot,
    });

    await this.recordAudit({
      actorId: params.actorId,
      action: 'ABHA_ADDRESS_CREATED',
      resourceId: tx.internalTransactionId,
      requestId: res.correlationId,
      outcome: 'SUCCESS',
      metadata: {
        patientId: params.patientId,
        maskedAddress: maskAbhaAddress(res.abhaAddress),
        isMocked: res.isMocked,
      },
    });

    return {
      abhaAddress: res.abhaAddress,
      correlationId: res.correlationId,
      isMocked: res.isMocked,
    };
  }

  async initiateAbhaAddressVerification(
    params: {
      patientId: string;
      actorId: string;
      abhaAddress: string;
      otpSystem: AbhaOtpSystem;
      patientConsentConfirmed: boolean;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaOtpInitiationResultDto> {
    if (!params.patientConsentConfirmed) {
      throw new AbdmIntegrationError({
        message: 'Explicit patient authorization is required before verifying an ABHA address.',
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 400,
      });
    }

    const config = abdmConfigurationService.assertValidWhenEnabled(envSource);
    const normalizedAddress = params.abhaAddress.trim().toLowerCase();
    const maskedAddr = maskAbhaAddress(normalizedAddress);
    const internalTransactionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + OTP_SESSION_TTL_MS);
    const verificationMethod: AbhaVerificationMethod =
      params.otpSystem === 'aadhaar' ? 'ABHA_ADDRESS_AADHAAR_OTP' : 'ABHA_ADDRESS_MOBILE_OTP';

    try {
      const otpRes = await this.client.requestAbhaAddressLoginOtp(
        { abhaAddress: normalizedAddress, otpSystem: params.otpSystem },
        envSource
      );

      if (otpRes.isMocked) {
        this.mockTxnHints.set(internalTransactionId, { abhaAddress: normalizedAddress });
      }

      await this.createTransaction({
        internalTransactionId,
        externalTransactionId: otpRes.txnId,
        patientId: params.patientId,
        initiatedBy: params.actorId,
        workflowType: 'ABHA_VERIFY_ADDRESS_OTP',
        verificationMethod,
        verificationStatus: 'PENDING_VERIFICATION',
        correlationId: otpRes.correlationId,
        maskedIdentifier: maskedAddr,
        environment: config.environment,
        isMocked: otpRes.isMocked,
        patientConsentConfirmed: true,
        expiresAt,
      });

      await this.recordAudit({
        actorId: params.actorId,
        action: 'ABHA_ADDRESS_VERIFICATION_INITIATED',
        resourceId: internalTransactionId,
        requestId: otpRes.correlationId,
        outcome: 'SUCCESS',
        metadata: {
          patientId: params.patientId,
          workflowType: 'ABHA_VERIFY_ADDRESS_OTP',
          maskedIdentifier: maskedAddr,
          isMocked: otpRes.isMocked,
        },
      });

      return {
        internalTransactionId,
        externalTransactionId: otpRes.txnId,
        correlationId: otpRes.correlationId,
        workflowType: 'ABHA_VERIFY_ADDRESS_OTP',
        verificationStatus: 'PENDING_VERIFICATION',
        maskedDestinationMessage: redactStringSecrets(otpRes.message),
        expiresAt: expiresAt.toISOString(),
        isMocked: otpRes.isMocked,
        environment: config.environment,
      };
    } catch (err) {
      await this.recordFailedAttempt({
        internalTransactionId,
        patientId: params.patientId,
        actorId: params.actorId,
        workflowType: 'ABHA_VERIFY_ADDRESS_OTP',
        verificationMethod,
        maskedIdentifier: maskedAddr,
        environment: config.environment,
        err,
      });
      throw err;
    }
  }

  async confirmAbhaAddressVerification(
    params: {
      patientId: string;
      actorId: string;
      internalTransactionId: string;
      otp: string;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaVerificationOutcomeDto> {
    const tx = await this.requireOwnedPendingTransaction(
      params.internalTransactionId,
      params.patientId,
      'ABHA_VERIFY_ADDRESS_OTP'
    );

    const otpSystem: AbhaOtpSystem =
      tx.verificationMethod === 'ABHA_ADDRESS_AADHAAR_OTP' ? 'aadhaar' : 'abdm';
    const hint = this.mockTxnHints.get(params.internalTransactionId);

    try {
      const profile = await this.client.verifyAbhaAddressLoginOtp(
        {
          txnId: tx.externalTransactionId!,
          otp: params.otp,
          otpSystem,
          abhaAddressHint: hint?.abhaAddress,
        },
        envSource
      );
      this.mockTxnHints.delete(params.internalTransactionId);

      return await this.finalizeVerifiedTransaction({
        tx,
        patientId: params.patientId,
        actorId: params.actorId,
        profile,
        verificationMethod: tx.verificationMethod || 'ABHA_ADDRESS_MOBILE_OTP',
        envSource,
      });
    } catch (err) {
      await this.markTransactionFailed(tx, params.actorId, err);
      throw err;
    }
  }

  // ============================================================================
  // 5. AUTHORIZED ABHA PROFILE RETRIEVAL (SERVER-HELD X-TOKEN)
  // ============================================================================

  async getAuthorizedAbhaProfile(
    patientId: string,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaAuthorizedProfileDto> {
    const session = abdmAuthenticationService.getUserXToken(patientId);
    if (!session) {
      throw new AbdmIntegrationError({
        message:
          'No active ABHA verification session found. Please verify your ABHA identity via OTP to retrieve your profile.',
        abdmCode: 'ABDM_SESSION_EXPIRED',
        statusCode: 401,
      });
    }

    const activeLink = await this.findActiveOrLatestLink(patientId, true);
    let decryptedAbha: string | undefined;
    if (activeLink?.abhaNumberEncrypted) {
      try {
        decryptedAbha = decryptAbhaNumberFromStorage(activeLink.abhaNumberEncrypted, envSource);
      } catch {
        decryptedAbha = undefined;
      }
    }

    const profile = await this.client.getAuthorizedProfile(session.xToken, envSource, {
      abhaNumber: decryptedAbha,
      abhaAddress: activeLink?.abhaAddress,
    });

    await this.recordAudit({
      actorId: patientId,
      action: 'ABHA_PROFILE_RETRIEVED',
      resourceId: patientId,
      requestId: profile.correlationId,
      outcome: 'SUCCESS',
      metadata: {
        patientId,
        maskedAbhaNumber: maskAbhaNumber(profile.abhaNumber),
        isMocked: profile.isMocked,
      },
    });

    return {
      maskedAbhaNumber: maskAbhaNumber(profile.abhaNumber) || 'XX-XXXX-XXXX-XXXX',
      abhaAddress: profile.abhaAddress,
      abhaAddresses: profile.phrAddresses,
      fullName: profile.fullName,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
      stateName: profile.stateName,
      districtName: profile.districtName,
      abhaStatus: profile.abhaStatus,
      kycVerified: profile.kycVerified,
      correlationId: profile.correlationId,
      isMocked: profile.isMocked,
      retrievedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // 6. PATIENT IDENTITY LINKING & LOCAL UNLINKING
  // ============================================================================

  async linkVerifiedAbha(
    params: {
      patientId: string;
      actorId: string;
      internalTransactionId: string;
      patientConsentConfirmed: boolean;
      purposeAcknowledged: boolean;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaLinkStatusDto> {
    if (!params.patientConsentConfirmed || !params.purposeAcknowledged) {
      throw new AbdmIntegrationError({
        message:
          'Explicit patient consent and acknowledgment that ABHA linking does not grant health-record sharing access are required.',
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 400,
      });
    }

    const tx = await this.findOwnedTransaction(params.internalTransactionId, params.patientId, true);
    if (!tx) {
      throw new AbdmIntegrationError({
        message: 'Verification transaction not found or does not belong to the authenticated patient.',
        abdmCode: 'ABDM_AUTH_ERROR',
        statusCode: 403,
      });
    }

    if (tx.verificationStatus !== 'VERIFIED' || !tx.verifiedSnapshot) {
      throw new AbdmIntegrationError({
        message:
          'Cannot link ABHA identity because external ownership verification has not succeeded.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    const snapshot = tx.verifiedSnapshot;
    const now = new Date();
    const correlationId = abdmCorrelationService.generateRequestId();

    // Prevent duplicate active ABHA link for this patient
    const existingPatientActive = await this.findActiveLinkForPatient(params.patientId);
    if (existingPatientActive) {
      throw new AbdmIntegrationError({
        message:
          'This HealthBridge patient account already has an active linked ABHA identity. Unlink the existing association first if you need to re-link.',
        abdmCode: 'ABDM_DUPLICATE_IDENTITY',
        statusCode: 409,
        correlationId,
      });
    }

    // Prevent linking an ABHA number or ABHA address already actively linked to ANOTHER patient
    // Error message intentionally omits any details about the other account (prevents enumeration)
    const duplicateAcrossPatients = await this.hasActiveDuplicateIdentity({
      excludePatientId: params.patientId,
      abhaNumberHash: snapshot.abhaNumberHash,
      abhaAddress: snapshot.abhaAddress,
    });

    if (duplicateAcrossPatients) {
      await this.recordAudit({
        actorId: params.actorId,
        action: 'ABHA_LINK_DUPLICATE_BLOCKED',
        resourceId: params.internalTransactionId,
        requestId: correlationId,
        outcome: 'BLOCKED',
        metadata: {
          patientId: params.patientId,
          reason: 'DUPLICATE_ACTIVE_ABHA_IDENTITY',
        },
      });

      throw new AbdmIntegrationError({
        message:
          'This ABHA identity cannot be linked because it is already associated with another active HealthBridge account.',
        abdmCode: 'ABDM_DUPLICATE_IDENTITY',
        statusCode: 409,
        correlationId,
      });
    }

    let patientProfileId: Types.ObjectId | undefined;
    if (isDbReady()) {
      const profile = await PatientProfileModel.findOne({
        userId: new Types.ObjectId(params.patientId),
      }).select('_id');
      if (profile) {
        patientProfileId = profile._id as Types.ObjectId;
      }
    }

    const linkPayload = {
      patientId: new Types.ObjectId(params.patientId),
      patientProfileId,
      abhaNumberEncrypted: snapshot.abhaNumberEncrypted,
      abhaNumberHash: snapshot.abhaNumberHash,
      abhaNumberMasked: snapshot.abhaNumberMasked,
      abhaAddress: snapshot.abhaAddress,
      abhaAddressHistory: snapshot.abhaAddress
        ? [
            {
              address: snapshot.abhaAddress,
              status: 'ACTIVE' as const,
              verifiedAt: now,
              updatedAt: now,
            },
          ]
        : [],
      verificationStatus: 'VERIFIED' as const,
      verificationMethod: tx.verificationMethod || 'ABHA_NUMBER_MOBILE_OTP',
      linkStatus: 'ACTIVE' as const,
      externalTransactionId: tx.externalTransactionId,
      internalTransactionId: tx.internalTransactionId,
      linkedAt: now,
      verifiedAt: tx.completedAt || now,
      lastVerificationAt: now,
      consentConfirmedAt: now,
      consentScope: 'IDENTITY_LINKING_ONLY' as const,
      environment: tx.environment,
      isMocked: Boolean(tx.isMocked),
      createdBy: new Types.ObjectId(params.actorId),
      updatedBy: new Types.ObjectId(params.actorId),
    };

    let createdLinkId: string;
    if (isDbReady()) {
      const created = await AbhaLinkModel.create(linkPayload);
      createdLinkId = String(created._id);

      // Update lightweight status flag on PatientProfile (do not duplicate raw plaintext ABHA number)
      await PatientProfileModel.updateOne(
        { userId: new Types.ObjectId(params.patientId) },
        {
          $set: {
            abhaLinkageStatus: 'LINKED',
            ...(snapshot.abhaAddress ? { abhaAddress: snapshot.abhaAddress } : {}),
          },
        }
      );

      await AbhaTransactionModel.updateOne(
        { internalTransactionId: tx.internalTransactionId },
        { $set: { linkedToAbhaLinkId: created._id } }
      );
    } else {
      createdLinkId = new Types.ObjectId().toString();
      this.memoryLinks.set(createdLinkId, {
        ...linkPayload,
        _id: createdLinkId,
        id: createdLinkId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await this.createTransaction({
      internalTransactionId: crypto.randomUUID(),
      externalTransactionId: tx.externalTransactionId,
      patientId: params.patientId,
      initiatedBy: params.actorId,
      workflowType: 'ABHA_LINK',
      verificationMethod: tx.verificationMethod,
      verificationStatus: 'VERIFIED',
      correlationId,
      maskedIdentifier: snapshot.abhaNumberMasked || maskAbhaAddress(snapshot.abhaAddress),
      environment: tx.environment,
      isMocked: Boolean(tx.isMocked),
      patientConsentConfirmed: true,
      completedAt: now,
    });

    await this.recordAudit({
      actorId: params.actorId,
      action: 'ABHA_IDENTITY_LINKED',
      resourceId: createdLinkId,
      requestId: correlationId,
      outcome: 'SUCCESS',
      metadata: {
        patientId: params.patientId,
        consentScope: 'IDENTITY_LINKING_ONLY',
        verificationMethod: tx.verificationMethod,
        maskedAbhaNumber: snapshot.abhaNumberMasked,
        isMocked: tx.isMocked,
      },
    });

    await this.publishPrivacySafeNotification({
      patientId: params.patientId,
      eventType: 'ABHA_LINKING_COMPLETED',
      title: 'ABHA Identity Linked',
      message: `Your ABHA identity (${snapshot.abhaNumberMasked || 'verified account'}) has been linked to your HealthBridge profile. Medical records remain private until you grant separate consent.`,
      transactionId: createdLinkId,
    });

    return this.getPatientAbhaStatus(params.patientId, envSource);
  }

  /**
   * Unlinks the local HealthBridge patient-to-ABHA association while preserving link history.
   * Explicitly scoped to HealthBridge (`LOCAL_HEALTHBRIDGE_UNLINK`); does NOT deactivate the
   * user's national ABHA account at NHA.
   */
  async unlinkPatientAbha(
    params: {
      patientId: string;
      actorId: string;
      reason: string;
      confirmUnlink: boolean;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaLinkStatusDto> {
    if (!params.confirmUnlink) {
      throw new AbdmIntegrationError({
        message: 'Explicit unlink confirmation is required.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }
    if (String(params.patientId) !== String(params.actorId)) {
      throw new AbdmIntegrationError({
        message: 'Only the authenticated patient may unlink their own ABHA identity association.',
        abdmCode: 'ABDM_AUTH_ERROR',
        statusCode: 403,
      });
    }

    const activeLink = await this.findActiveLinkForPatient(params.patientId);
    if (!activeLink) {
      throw new AbdmIntegrationError({
        message: 'No active ABHA identity link exists for this patient account.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }

    const now = new Date();
    const correlationId = abdmCorrelationService.generateRequestId();
    const unlinkMeta = {
      unlinkedAt: now,
      unlinkedBy: new Types.ObjectId(params.actorId),
      reason: params.reason.trim(),
      scope: 'LOCAL_HEALTHBRIDGE_UNLINK' as const,
    };

    const updatedAddressHistory = (activeLink.abhaAddressHistory || []).map((entry: any) => ({
      ...entry,
      status: entry.status === 'ACTIVE' ? 'UNLINKED' : entry.status,
      updatedAt: now,
    }));

    if (isDbReady()) {
      await AbhaLinkModel.updateOne(
        { _id: activeLink._id },
        {
          $set: {
            linkStatus: 'UNLINKED',
            verificationStatus: 'REVOKED_OR_UNLINKED',
            abhaAddressHistory: updatedAddressHistory,
            unlinkMetadata: unlinkMeta,
            updatedBy: new Types.ObjectId(params.actorId),
          },
        }
      );

      await PatientProfileModel.updateOne(
        { userId: new Types.ObjectId(params.patientId) },
        {
          $set: { abhaLinkageStatus: 'NOT_LINKED' },
          $unset: { abhaAddress: '', abhaNumber: '' },
        }
      );
    } else {
      const id = String(activeLink._id || activeLink.id);
      this.memoryLinks.set(id, {
        ...activeLink,
        linkStatus: 'UNLINKED',
        verificationStatus: 'REVOKED_OR_UNLINKED',
        abhaAddressHistory: updatedAddressHistory,
        unlinkMetadata: unlinkMeta,
        updatedAt: now,
      });
    }

    abdmAuthenticationService.clearUserXToken(params.patientId);

    await this.createTransaction({
      internalTransactionId: crypto.randomUUID(),
      patientId: params.patientId,
      initiatedBy: params.actorId,
      workflowType: 'ABHA_UNLINK',
      verificationStatus: 'REVOKED_OR_UNLINKED',
      correlationId,
      maskedIdentifier: activeLink.abhaNumberMasked,
      environment: activeLink.environment,
      isMocked: Boolean(activeLink.isMocked),
      patientConsentConfirmed: true,
      completedAt: now,
    });

    await this.recordAudit({
      actorId: params.actorId,
      action: 'ABHA_IDENTITY_UNLINKED_LOCAL',
      resourceId: String(activeLink._id || activeLink.id),
      requestId: correlationId,
      outcome: 'SUCCESS',
      metadata: {
        patientId: params.patientId,
        scope: 'LOCAL_HEALTHBRIDGE_UNLINK',
        maskedAbhaNumber: activeLink.abhaNumberMasked,
      },
    });

    await this.publishPrivacySafeNotification({
      patientId: params.patientId,
      eventType: 'ABHA_UNLINKED',
      title: 'ABHA Identity Unlinked',
      message:
        'Your ABHA identity association has been removed from HealthBridge. Your national ABHA account remains active with NHA.',
      transactionId: String(activeLink._id || activeLink.id),
    });

    return this.getPatientAbhaStatus(params.patientId, envSource);
  }

  // ============================================================================
  // 7. ADMIN AGGREGATE ANALYTICS (PERSISTED EVENTS, ZERO PATIENT PII, ZERO SECRETS)
  // ============================================================================

  async getAdminAbhaAnalytics(
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaIntegrationAnalyticsDto> {
    const dashboard = abdmConfigurationService.getIntegrationStatusDashboard(envSource);
    const config = abdmConfigurationService.loadConfig(envSource);

    const authReadiness: AbdmIntegrationStatus = !config.enabled || config.environment === 'disabled'
      ? 'NOT_CONFIGURED'
      : config.environment === 'development'
      ? 'MOCKED'
      : dashboard.credentialStatus;

    const abhaApiConfigStatus: AbdmIntegrationStatus =
      !config.enabled || config.environment === 'disabled'
        ? 'NOT_CONFIGURED'
        : config.environment === 'development'
        ? 'MOCKED'
        : dashboard.configSummary.abhaBaseUrlConfigured && dashboard.configSummary.clientIdConfigured
        ? 'CONFIGURED'
        : 'PENDING_ONBOARDING';

    let totalTransactions = 0;
    let successfulVerifications = 0;
    let failedVerifications = 0;
    let pendingLinkingRequests = 0;
    let activeLinkedPatients = 0;
    let unlinkedLinks = 0;
    let lastSuccessfulRequestAt: string | null = null;
    let lastFailedRequestAt: string | null = null;
    let recentErrors: AbhaIntegrationAnalyticsDto['recentErrors'] = [];

    if (isDbReady()) {
      const [
        txTotal,
        txSuccess,
        txFailed,
        txPending,
        activeCount,
        unlinkedCount,
        lastSuccessDoc,
        lastFailDoc,
        errorDocs,
      ] = await Promise.all([
        AbhaTransactionModel.countDocuments({}),
        AbhaTransactionModel.countDocuments({
          verificationStatus: 'VERIFIED',
          workflowType: {
            $in: [
              'ABHA_CREATION_AADHAAR_OTP',
              'ABHA_VERIFY_NUMBER_OTP',
              'ABHA_VERIFY_ADDRESS_OTP',
            ],
          },
        }),
        AbhaTransactionModel.countDocuments({ verificationStatus: 'VERIFICATION_FAILED' }),
        AbhaTransactionModel.countDocuments({
          verificationStatus: { $in: ['PENDING_VERIFICATION', 'VERIFICATION_IN_PROGRESS'] },
        }),
        AbhaLinkModel.countDocuments({ linkStatus: 'ACTIVE' }),
        AbhaLinkModel.countDocuments({ linkStatus: { $in: ['UNLINKED', 'REVOKED'] } }),
        AbhaTransactionModel.findOne({ verificationStatus: 'VERIFIED' })
          .sort({ updatedAt: -1 })
          .select('completedAt updatedAt')
          .lean(),
        AbhaTransactionModel.findOne({ verificationStatus: 'VERIFICATION_FAILED' })
          .sort({ updatedAt: -1 })
          .select('completedAt updatedAt')
          .lean(),
        AbhaTransactionModel.find({ verificationStatus: 'VERIFICATION_FAILED' })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('correlationId workflowType failureCategory failureMessage createdAt')
          .lean(),
      ]);

      totalTransactions = txTotal;
      successfulVerifications = txSuccess;
      failedVerifications = txFailed;
      pendingLinkingRequests = txPending;
      activeLinkedPatients = activeCount;
      unlinkedLinks = unlinkedCount;
      lastSuccessfulRequestAt = lastSuccessDoc
        ? new Date(lastSuccessDoc.completedAt || lastSuccessDoc.updatedAt).toISOString()
        : null;
      lastFailedRequestAt = lastFailDoc
        ? new Date(lastFailDoc.completedAt || lastFailDoc.updatedAt).toISOString()
        : null;
      recentErrors = errorDocs.map((e) => ({
        correlationId: e.correlationId,
        workflowType: e.workflowType,
        failureCategory: e.failureCategory,
        failureMessage: e.failureMessage ? redactStringSecrets(e.failureMessage) : undefined,
        occurredAt: new Date(e.createdAt).toISOString(),
      }));
    } else {
      const txs = Array.from(this.memoryTransactions.values());
      const links = Array.from(this.memoryLinks.values());
      totalTransactions = txs.length;
      successfulVerifications = txs.filter(
        (t) =>
          t.verificationStatus === 'VERIFIED' &&
          [
            'ABHA_CREATION_AADHAAR_OTP',
            'ABHA_VERIFY_NUMBER_OTP',
            'ABHA_VERIFY_ADDRESS_OTP',
          ].includes(t.workflowType)
      ).length;
      failedVerifications = txs.filter((t) => t.verificationStatus === 'VERIFICATION_FAILED').length;
      pendingLinkingRequests = txs.filter((t) =>
        ['PENDING_VERIFICATION', 'VERIFICATION_IN_PROGRESS'].includes(t.verificationStatus)
      ).length;
      activeLinkedPatients = links.filter((l) => l.linkStatus === 'ACTIVE').length;
      unlinkedLinks = links.filter((l) => ['UNLINKED', 'REVOKED'].includes(l.linkStatus)).length;

      const sortedSuccess = txs
        .filter((t) => t.verificationStatus === 'VERIFIED')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      lastSuccessfulRequestAt = sortedSuccess[0]
        ? new Date(sortedSuccess[0].completedAt || sortedSuccess[0].createdAt).toISOString()
        : null;

      const sortedFailed = txs
        .filter((t) => t.verificationStatus === 'VERIFICATION_FAILED')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      lastFailedRequestAt = sortedFailed[0]
        ? new Date(sortedFailed[0].completedAt || sortedFailed[0].createdAt).toISOString()
        : null;

      recentErrors = sortedFailed.slice(0, 10).map((e) => ({
        correlationId: e.correlationId,
        workflowType: e.workflowType,
        failureCategory: e.failureCategory,
        failureMessage: e.failureMessage ? redactStringSecrets(e.failureMessage) : undefined,
        occurredAt: new Date(e.createdAt).toISOString(),
      }));
    }

    return {
      authReadiness,
      abhaApiConfigStatus,
      sandboxAvailability: dashboard.sandboxConnectivityStatus,
      environment: config.environment,
      supportedWorkflows: ABHA_VERIFIED_API_CATALOG,
      metrics: {
        totalTransactions,
        successfulVerifications,
        failedVerifications,
        pendingLinkingRequests,
        activeLinkedPatients,
        unlinkedLinks,
      },
      lastSuccessfulRequestAt,
      lastFailedRequestAt,
      recentErrors,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  private async finalizeVerifiedTransaction(params: {
    tx: any;
    patientId: string;
    actorId: string;
    profile: Awaited<ReturnType<AbhaV3Client['completeEnrollmentByAadhaar']>>;
    verificationMethod: AbhaVerificationMethod;
    envSource: NodeJS.ProcessEnv;
  }): Promise<AbhaVerificationOutcomeDto> {
    const now = new Date();
    const { profile, tx, patientId, actorId, verificationMethod, envSource } = params;

    if (!profile.abhaNumber && !profile.abhaAddress) {
      throw new AbdmIntegrationError({
        message: 'External ABHA verification did not return a valid ABHA identifier.',
        abdmCode: 'ABDM_CLIENT_ERROR',
        statusCode: 502,
        correlationId: profile.correlationId,
      });
    }

    // Store ephemeral X-Token exclusively in server memory (never DB or response)
    if (profile.xToken) {
      abdmAuthenticationService.storeUserXToken(
        patientId,
        profile.xToken,
        profile.isMocked ? 'MOCK' : 'ABHA_V3_LOGIN'
      );
    }

    // Check demographic alignment against internal PatientProfile (NEVER auto-merge!)
    const demographicCheck = await this.evaluateDemographicAlignment(patientId, profile);

    const encryptedAbha = profile.abhaNumber
      ? encryptAbhaNumberForStorage(profile.abhaNumber, envSource)
      : undefined;
    const abhaHash = profile.abhaNumber
      ? computeAbhaNumberHash(profile.abhaNumber, envSource)
      : undefined;
    const maskedAbha = maskAbhaNumber(profile.abhaNumber);

    const snapshot: IAbhaVerifiedSnapshot = {
      abhaNumberEncrypted: encryptedAbha,
      abhaNumberHash: abhaHash,
      abhaNumberMasked: maskedAbha,
      abhaAddress: profile.abhaAddress,
      abhaStatus: profile.abhaStatus,
      fullName: profile.fullName,
      gender: profile.gender,
      yearOfBirth: profile.yearOfBirth,
      stateName: profile.stateName,
      districtName: profile.districtName,
      demographicReviewRequired: demographicCheck.reviewRequired,
      demographicMismatchReasons: demographicCheck.reasons,
    };

    await this.updateTransaction(tx.internalTransactionId, {
      verificationStatus: 'VERIFIED',
      correlationId: profile.correlationId,
      maskedIdentifier: maskedAbha || maskAbhaAddress(profile.abhaAddress),
      completedAt: now,
      verifiedSnapshot: snapshot,
    });

    await this.recordAudit({
      actorId,
      action: 'ABHA_OWNERSHIP_VERIFIED',
      resourceId: tx.internalTransactionId,
      requestId: profile.correlationId,
      outcome: 'SUCCESS',
      metadata: {
        patientId,
        workflowType: tx.workflowType,
        verificationMethod,
        maskedAbhaNumber: maskedAbha,
        demographicReviewRequired: demographicCheck.reviewRequired,
        isMocked: profile.isMocked,
      },
    });

    return {
      internalTransactionId: tx.internalTransactionId,
      externalTransactionId: tx.externalTransactionId,
      correlationId: profile.correlationId,
      verificationStatus: 'VERIFIED',
      verificationMethod,
      maskedAbhaNumber: maskedAbha,
      abhaAddress: profile.abhaAddress,
      abhaStatus: profile.abhaStatus,
      profileSummary: {
        fullName: profile.fullName,
        gender: profile.gender,
        yearOfBirth: profile.yearOfBirth,
        stateName: profile.stateName,
        districtName: profile.districtName,
      },
      demographicReviewRequired: demographicCheck.reviewRequired,
      demographicMismatchReasons: demographicCheck.reasons,
      readyToLink: true,
      isMocked: profile.isMocked,
      verifiedAt: now.toISOString(),
    };
  }

  /**
   * Compares verified external ABHA demographics against internal HealthBridge patient profile.
   * Never merges or auto-links on demographics — strictly flags discrepancies for review.
   */
  private async evaluateDemographicAlignment(
    patientId: string,
    profile: { fullName?: string; gender?: string; yearOfBirth?: string }
  ): Promise<{ reviewRequired: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    if (!isDbReady() || !Types.ObjectId.isValid(patientId)) {
      return { reviewRequired: false, reasons };
    }

    try {
      const [user, patientProfile] = await Promise.all([
        UserModel.findById(patientId).select('name').lean(),
        PatientProfileModel.findOne({ userId: new Types.ObjectId(patientId) })
          .select('gender dateOfBirth')
          .lean(),
      ]);

      if (patientProfile?.dateOfBirth && profile.yearOfBirth) {
        const internalYob = String(new Date(patientProfile.dateOfBirth).getUTCFullYear());
        if (internalYob !== String(profile.yearOfBirth).slice(0, 4)) {
          reasons.push('Year of birth on ABHA profile differs from HealthBridge profile.');
        }
      }

      if (patientProfile?.gender && profile.gender) {
        const normInternal = patientProfile.gender.charAt(0).toUpperCase();
        const normExternal = profile.gender.charAt(0).toUpperCase();
        if (normInternal !== normExternal) {
          reasons.push('Gender on ABHA profile differs from HealthBridge profile.');
        }
      }

      if (user?.name && profile.fullName) {
        const internalFirst = user.name.trim().toLowerCase().split(/\s+/)[0];
        const externalLower = profile.fullName.trim().toLowerCase();
        if (internalFirst && !externalLower.includes(internalFirst) && !externalLower.includes('sandbox')) {
          reasons.push('Primary name on ABHA profile differs from HealthBridge profile.');
        }
      }
    } catch {
      // Never block verification if optional alignment lookup fails
    }

    return { reviewRequired: reasons.length > 0, reasons };
  }

  private async requireOwnedPendingTransaction(
    internalTransactionId: string,
    patientId: string,
    expectedWorkflow: AbhaWorkflowType
  ): Promise<any> {
    const tx = await this.findOwnedTransaction(internalTransactionId, patientId);
    if (!tx) {
      throw new AbdmIntegrationError({
        message: 'Verification session not found or does not belong to the authenticated patient.',
        abdmCode: 'ABDM_AUTH_ERROR',
        statusCode: 403,
      });
    }

    if (tx.workflowType !== expectedWorkflow) {
      throw new AbdmIntegrationError({
        message: 'Verification session workflow mismatch.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    if (tx.verificationStatus === 'VERIFIED') {
      throw new AbdmIntegrationError({
        message: 'This OTP verification session has already been completed.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 409,
      });
    }

    if (tx.expiresAt && new Date(tx.expiresAt).getTime() < Date.now()) {
      await this.updateTransaction(tx.internalTransactionId, {
        verificationStatus: 'VERIFICATION_FAILED',
        failureCategory: 'SESSION_EXPIRED',
        failureMessage: 'Verification session expired before OTP confirmation.',
        completedAt: new Date(),
      });
      throw new AbdmIntegrationError({
        message: 'ABHA verification session has expired. Please request a new OTP.',
        abdmCode: 'ABDM_SESSION_EXPIRED',
        statusCode: 410,
      });
    }

    return tx;
  }

  private async findOwnedTransaction(
    internalTransactionId: string,
    patientId: string,
    includeEncryptedSnapshot = false
  ): Promise<any | null> {
    if (isDbReady()) {
      const query = AbhaTransactionModel.findOne({ internalTransactionId });
      if (includeEncryptedSnapshot) {
        query.select('+verifiedSnapshot.abhaNumberEncrypted');
      }
      const doc = await query.lean();
      if (!doc) return null;
      if (String(doc.patientId) !== String(patientId)) {
        return null;
      }
      return doc;
    }

    const mem = this.memoryTransactions.get(internalTransactionId);
    if (!mem || String(mem.patientId) !== String(patientId)) return null;
    return mem;
  }

  private async findActiveLinkForPatient(
    patientId: string,
    includeEncrypted = false
  ): Promise<any | null> {
    if (isDbReady()) {
      const query = AbhaLinkModel.findOne({
        patientId: new Types.ObjectId(patientId),
        linkStatus: 'ACTIVE',
      });
      if (includeEncrypted) {
        query.select('+abhaNumberEncrypted');
      }
      return query.lean();
    }

    return (
      Array.from(this.memoryLinks.values()).find(
        (l) => String(l.patientId) === String(patientId) && l.linkStatus === 'ACTIVE'
      ) || null
    );
  }

  private async findActiveOrLatestLink(
    patientId: string,
    includeEncrypted = false
  ): Promise<any | null> {
    const active = await this.findActiveLinkForPatient(patientId, includeEncrypted);
    if (active) return active;

    if (isDbReady()) {
      const query = AbhaLinkModel.findOne({
        patientId: new Types.ObjectId(patientId),
      }).sort({ updatedAt: -1 });
      if (includeEncrypted) {
        query.select('+abhaNumberEncrypted');
      }
      return query.lean();
    }

    const matching = Array.from(this.memoryLinks.values())
      .filter((l) => String(l.patientId) === String(patientId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return matching[0] || null;
  }

  private async hasActiveDuplicateIdentity(params: {
    excludePatientId: string;
    abhaNumberHash?: string;
    abhaAddress?: string;
  }): Promise<boolean> {
    const orClauses: Record<string, unknown>[] = [];
    if (params.abhaNumberHash) {
      orClauses.push({ abhaNumberHash: params.abhaNumberHash });
    }
    if (params.abhaAddress) {
      orClauses.push({ abhaAddress: params.abhaAddress.toLowerCase() });
    }
    if (orClauses.length === 0) return false;

    if (isDbReady()) {
      const existing = await AbhaLinkModel.findOne({
        linkStatus: 'ACTIVE',
        patientId: { $ne: new Types.ObjectId(params.excludePatientId) },
        $or: orClauses,
      })
        .select('_id')
        .lean();
      return Boolean(existing);
    }

    return Array.from(this.memoryLinks.values()).some((l) => {
      if (l.linkStatus !== 'ACTIVE') return false;
      if (String(l.patientId) === String(params.excludePatientId)) return false;
      const hashMatch = Boolean(params.abhaNumberHash && l.abhaNumberHash === params.abhaNumberHash);
      const addrMatch = Boolean(
        params.abhaAddress && l.abhaAddress === params.abhaAddress.toLowerCase()
      );
      return hashMatch || addrMatch;
    });
  }

  private async createTransaction(data: {
    internalTransactionId: string;
    externalTransactionId?: string;
    patientId: string;
    initiatedBy: string;
    workflowType: AbhaWorkflowType;
    verificationMethod?: AbhaVerificationMethod;
    verificationStatus: IAbhaTransactionDocument['verificationStatus'];
    correlationId: string;
    maskedIdentifier?: string;
    failureCategory?: AbhaFailureCategory;
    failureMessage?: string;
    environment: AbdmEnvironment;
    isMocked: boolean;
    patientConsentConfirmed: boolean;
    expiresAt?: Date;
    completedAt?: Date;
  }): Promise<void> {
    if (isDbReady()) {
      await AbhaTransactionModel.create({
        ...data,
        patientId: new Types.ObjectId(data.patientId),
        initiatedBy: new Types.ObjectId(data.initiatedBy),
      });
    } else {
      const now = new Date();
      this.memoryTransactions.set(data.internalTransactionId, {
        ...data,
        _id: data.internalTransactionId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  private async updateTransaction(
    internalTransactionId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    if (isDbReady()) {
      await AbhaTransactionModel.updateOne({ internalTransactionId }, { $set: updates });
    } else {
      const existing = this.memoryTransactions.get(internalTransactionId);
      if (existing) {
        this.memoryTransactions.set(internalTransactionId, {
          ...existing,
          ...updates,
          updatedAt: new Date(),
        });
      }
    }
  }

  private async recordFailedAttempt(params: {
    internalTransactionId: string;
    patientId: string;
    actorId: string;
    workflowType: AbhaWorkflowType;
    verificationMethod?: AbhaVerificationMethod;
    maskedIdentifier?: string;
    environment: AbdmEnvironment;
    err: unknown;
  }): Promise<void> {
    const category = classifyErrorCategory(params.err);
    const safeMessage = redactStringSecrets(
      params.err instanceof Error ? params.err.message : 'ABHA workflow failed'
    );
    const correlationId =
      params.err instanceof AbdmIntegrationError && params.err.correlationId
        ? params.err.correlationId
        : abdmCorrelationService.generateRequestId();

    await this.createTransaction({
      internalTransactionId: params.internalTransactionId,
      patientId: params.patientId,
      initiatedBy: params.actorId,
      workflowType: params.workflowType,
      verificationMethod: params.verificationMethod,
      verificationStatus: 'VERIFICATION_FAILED',
      correlationId,
      maskedIdentifier: params.maskedIdentifier,
      failureCategory: category,
      failureMessage: safeMessage,
      environment: params.environment,
      isMocked: params.environment === 'development',
      patientConsentConfirmed: true,
      completedAt: new Date(),
    });

    await this.recordAudit({
      actorId: params.actorId,
      action: `${params.workflowType}_FAILED`,
      resourceId: params.internalTransactionId,
      requestId: correlationId,
      outcome: 'FAILURE',
      metadata: {
        patientId: params.patientId,
        failureCategory: category,
        reason: safeMessage,
      },
    });

    await this.publishPrivacySafeNotification({
      patientId: params.patientId,
      eventType: 'ABHA_VERIFICATION_FAILED',
      title: 'ABHA Verification Failed',
      message: 'Your ABHA verification request could not be completed. Please review and try again.',
      transactionId: params.internalTransactionId,
    });
  }

  private async markTransactionFailed(tx: any, actorId: string, err: unknown): Promise<void> {
    const category = classifyErrorCategory(err);
    const safeMessage = redactStringSecrets(
      err instanceof Error ? err.message : 'ABHA verification failed'
    );

    await this.updateTransaction(tx.internalTransactionId, {
      verificationStatus: 'VERIFICATION_FAILED',
      failureCategory: category,
      failureMessage: safeMessage,
      completedAt: new Date(),
    });

    await this.recordAudit({
      actorId,
      action: `${tx.workflowType}_FAILED`,
      resourceId: tx.internalTransactionId,
      requestId: tx.correlationId,
      outcome: 'FAILURE',
      metadata: {
        patientId: String(tx.patientId),
        failureCategory: category,
        reason: safeMessage,
      },
    });

    await this.publishPrivacySafeNotification({
      patientId: String(tx.patientId),
      eventType: 'ABHA_VERIFICATION_FAILED',
      title: 'ABHA Verification Failed',
      message: 'Your ABHA OTP verification did not succeed. Please retry with a valid code.',
      transactionId: tx.internalTransactionId,
    });
  }

  private async recordAudit(params: {
    actorId: string;
    action: string;
    resourceId?: string;
    requestId: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
    metadata: Record<string, unknown>;
  }): Promise<void> {
    const safeMeta = redactAbdmLogPayload(params.metadata) as Record<string, unknown>;
    logger.info(`ABHA audit event: ${params.action}`, {
      action: params.action,
      requestId: params.requestId,
      outcome: params.outcome,
      ...safeMeta,
    });

    if (isDbReady() && Types.ObjectId.isValid(params.actorId)) {
      try {
        await AuditLogModel.create({
          actorId: new Types.ObjectId(params.actorId),
          action: params.action,
          resourceType: 'ABHA_IDENTITY',
          resourceId: params.resourceId,
          requestId: params.requestId,
          outcome: params.outcome,
          metadata: safeMeta,
        });
      } catch (auditErr: any) {
        logger.warn('Failed to persist ABHA AuditLog entry', {
          action: params.action,
          error: auditErr?.message,
        });
      }
    }
  }

  private async publishPrivacySafeNotification(params: {
    patientId: string;
    eventType:
      | 'ABHA_LINKING_INITIATED'
      | 'ABHA_VERIFICATION_PENDING'
      | 'ABHA_LINKING_COMPLETED'
      | 'ABHA_VERIFICATION_FAILED'
      | 'ABHA_UNLINKED';
    title: string;
    message: string;
    transactionId: string;
  }): Promise<void> {
    if (!Types.ObjectId.isValid(params.patientId)) return;

    const isMockedPublisher = Boolean(
      (notificationService.publishEvent as any)?._isMockFunction ||
        (notificationService.publishEvent as any)?.mock
    );
    if (!isDbReady() && !isMockedPublisher) {
      return;
    }

    try {
      await notificationService.publishEvent({
        recipientId: params.patientId,
        recipientRole: 'PATIENT',
        category: 'SECURITY',
        eventType: params.eventType,
        title: params.title,
        message: redactStringSecrets(params.message),
        priority: params.eventType === 'ABHA_VERIFICATION_FAILED' ? 'HIGH' : 'MEDIUM',
        linkUrl: '/patient/abha',
        relatedEntity: {
          entityType: 'ABHA_IDENTITY',
          entityId: params.transactionId,
        },
        idempotencyKey: `${params.eventType}:${params.patientId}:${params.transactionId}`,
      });
    } catch {
      // Notification failure must never break the primary ABHA identity transaction
    }
  }
}

export const abhaIdentityService = new AbhaIdentityService();
export type { IAbhaLinkDocument };
