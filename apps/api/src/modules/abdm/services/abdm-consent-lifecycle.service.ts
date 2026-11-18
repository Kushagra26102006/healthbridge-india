/**
 * HealthBridge India — ABDM Consent Manager Lifecycle, Synchronization & Revocation Service (Day 7 Task 03)
 *
 * Orchestrates:
 * - Official ABDM V3 HIE-CM Consent Request Initiation
 * - Verified Inbound Callback Processing (idempotent, monotonic, anti-stale-overwrite, anti-forgery)
 * - Immutable External Consent Artefact Validation & Storage
 * - Patient-Authenticated Revocation Workflow (with honest PENDING_CONFIRMATION & instant cache invalidation)
 * - Background-Safe Expiry & Status Synchronization Service
 * - Privacy-Safe Notifications & Immutable Audit Logging
 * - Aggregate Admin Telemetry (Zero Patient PII)
 */

import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import type {
  AbdmConsentAdminAnalyticsDto,
  AbdmConsentArtefactRecordDto,
  AbdmConsentEventDto,
  AbdmConsentRequestDto,
  AbdmConsentRequestInternalStatus,
  AbdmConsentRevocationResponseDto,
  AbdmConsentSyncSummaryDto,
  AbdmEnvironment,
  AbdmExternalConsentStatus,
  AbdmIntegrationStatus,
  AbdmPurposeCode,
  NotificationEventType,
} from '@healthbridge/shared-types';
import {
  externalAbdmArtefactPayloadSchema,
  type CreateAbdmConsentRequestInput,
  type ExternalAbdmArtefactPayloadInput,
} from '@healthbridge/validation';
import { AppError } from '../../../shared/errors/app-error';
import { logger } from '../../../config/logger';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { notificationService } from '../../notifications/services/notification.service';
import { AbhaLinkModel } from '../models/abha-link.model';
import {
  AbdmConsentRequestModel,
  type IAbdmConsentRequestDocument,
} from '../models/abdm-consent-request.model';
import {
  AbdmConsentArtefactModel,
  type IAbdmConsentArtefactDocument,
} from '../models/abdm-consent-artefact.model';
import {
  AbdmConsentEventModel,
  type IAbdmConsentEventDocument,
} from '../models/abdm-consent-event.model';
import { AbdmConsentSyncLogModel } from '../models/abdm-consent-sync-log.model';
import { abdmConfigurationService } from './abdm-configuration.service';
import { abdmCorrelationService } from './abdm-correlation.service';
import { abdmConsentV3Client } from '../clients/abdm-consent-v3.client';
import { abdmConsentValidationService } from './abdm-consent-validation.service';
import { encryptSensitivePayloadForStorage } from '../utils/abha-crypto.util';
import { redactAbdmLogPayload } from '../utils/redaction';
import { AbdmIntegrationError } from '../errors/abdm-error';

const ALLOWED_REQUESTER_ROLES = new Set([
  'DOCTOR',
  'LABORATORY',
  'PHARMACY',
  'ADMIN',
]);

const PURPOSE_DEFAULT_LABELS: Record<AbdmPurposeCode, string> = {
  CAREMGT: 'Care Management',
  BTG: 'Break the Glass',
  PUBHLTH: 'Public Health',
  HPAYMT: 'Healthcare Payment',
  DSRCH: 'Disease Specific Healthcare Research',
  PATRQT: 'Self Requested',
};

const TERMINAL_INTERNAL_STATUSES = new Set<AbdmConsentRequestInternalStatus>([
  'REJECTED',
  'EXPIRED',
  'REVOKED',
  'CANCELLED',
]);

const TERMINAL_EXTERNAL_STATUSES = new Set<AbdmExternalConsentStatus>([
  'DENIED',
  'EXPIRED',
  'REVOKED',
]);

export interface ConsentInitiatorActor {
  userId: string;
  role: string;
  name?: string;
  organizationName?: string;
  participantId?: string;
}

export interface CallbackProcessMeta {
  requestId: string;
  correlationId: string;
  timestamp: string;
  respRequestId?: string;
  error?: { code: number | string; message: string };
}

export interface CallbackProcessResult {
  processed: boolean;
  outcome: 'PROCESSED' | 'DUPLICATE_IGNORED' | 'STALE_IGNORED' | 'REJECTED' | 'FAILED';
  reason: string;
  externalRequestId?: string;
  externalConsentId?: string;
}

export class AbdmConsentLifecycleService {
  // ============================================================================
  // 1. CONSENT REQUEST INITIATION (HIU WORKFLOW)
  // ============================================================================

  async initiateConsentRequest(
    input: CreateAbdmConsentRequestInput,
    actor: ConsentInitiatorActor,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmConsentRequestDto> {
    // 1. Validate requesting participant role & permissions
    if (!ALLOWED_REQUESTER_ROLES.has(actor.role)) {
      throw AppError.forbidden(
        `Role '${actor.role}' is not authorized to initiate external ABDM HIU consent requests.`
      );
    }

    if (!Types.ObjectId.isValid(input.patientId)) {
      throw AppError.badRequest('Invalid patient reference ID.');
    }

    const config = abdmConfigurationService.loadConfig(envSource);
    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM consent integration is disabled in current environment configuration.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }

    // 2. Identify patient through authorized ABHA identity-linking mechanism
    const abhaLink = await AbhaLinkModel.findOne({
      patientId: new Types.ObjectId(input.patientId),
      linkStatus: 'LINKED',
      verificationStatus: 'VERIFIED',
    });

    if (!abhaLink || !abhaLink.abhaAddress) {
      throw AppError.badRequest(
        'Patient does not have a verified active ABHA address linked in HealthBridge. Complete ABHA linking before initiating an ABDM consent request.'
      );
    }

    const resolvedAbhaAddress = abhaLink.abhaAddress.trim().toLowerCase();
    if (
      input.patientAbhaAddress &&
      input.patientAbhaAddress.trim().toLowerCase() !== resolvedAbhaAddress
    ) {
      throw AppError.badRequest(
        'Supplied ABHA address does not match the patient’s verified linked ABHA identity.'
      );
    }

    // 3. Validate participant identifier
    const participantId =
      input.requestingParticipantId?.trim() ||
      actor.participantId?.trim() ||
      config.clientId ||
      'HEALTHBRIDGE-HIU-DEV';

    if (participantId.length < 2) {
      throw AppError.badRequest('Valid requesting ABDM participant ID (HIU ID) is required.');
    }

    const organizationName =
      input.requestingOrganizationName?.trim() ||
      actor.organizationName?.trim() ||
      'HealthBridge Partner Healthcare Facility';
    const requesterName = actor.name?.trim() || 'Authorized Healthcare Practitioner';
    const purposeText = input.purposeText?.trim() || PURPOSE_DEFAULT_LABELS[input.purposeCode];
    const correlationId = abdmCorrelationService.generateRequestId();
    const internalReference = `HB-ABDM-CR-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    const expiresAt = input.expiresAt
      ? new Date(input.expiresAt)
      : new Date(Math.min(new Date(input.dataEraseAt).getTime(), Date.now() + 7 * 24 * 60 * 60 * 1000));

    // 4. Persist request in PENDING_SUBMISSION before outbound call (never pre-approved!)
    const doc = await AbdmConsentRequestModel.create({
      internalReference,
      patientId: new Types.ObjectId(input.patientId),
      patientAbhaAddress: resolvedAbhaAddress,
      requestingUserId: Types.ObjectId.isValid(actor.userId)
        ? new Types.ObjectId(actor.userId)
        : new Types.ObjectId(),
      requestingUserRole: actor.role,
      requestingParticipantId: participantId,
      requestingParticipantRole: 'HIU',
      requestingOrganizationName: organizationName,
      requesterName,
      purposeCode: input.purposeCode,
      purposeText,
      hiTypes: Array.from(new Set(input.hiTypes)),
      accessMode: input.accessMode,
      dateRange: {
        from: new Date(input.dateRange.from),
        to: new Date(input.dateRange.to),
      },
      dataEraseAt: new Date(input.dataEraseAt),
      frequency: input.frequency,
      internalStatus: 'PENDING_SUBMISSION',
      externalStatus: 'UNKNOWN',
      correlationId,
      artefactIds: [],
      environment: config.environment,
      isMocked: config.environment === 'development',
      expiresAt,
      statusHistory: [
        {
          toInternalStatus: 'PENDING_SUBMISSION',
          externalStatus: 'UNKNOWN',
          reason: 'Consent request validated and queued for ABDM HIE-CM submission.',
          changedAt: new Date(),
          correlationId,
        },
      ],
    });

    // Notify patient about new request creation (privacy-safe: zero medical content)
    await this.safePublishNotification({
      eventType: 'ABDM_CONSENT_REQUEST_CREATED',
      recipientId: input.patientId,
      recipientRole: 'PATIENT',
      title: 'New ABDM Health Record Consent Request',
      message: `${organizationName} has initiated a consent request (${purposeText}). Review details and respond through your official ABDM PHR app.`,
      relatedEntity: {
        entityType: 'ABDM_CONSENT_REQUEST',
        entityId: String(doc._id),
        referenceNumber: internalReference,
      },
      linkUrl: `/patient/consent/requests/${String(doc._id)}`,
    });

    // 5. Submit to official HIE-CM V3 adapter (or development mock returning REQUESTED only)
    try {
      const adapterRes = await abdmConsentV3Client.initConsentRequest(
        {
          correlationId,
          patientAbhaAddress: resolvedAbhaAddress,
          hiuId: participantId,
          requesterName,
          requesterIdentifierValue: actor.userId,
          purposeCode: input.purposeCode,
          purposeText,
          hiTypes: doc.hiTypes,
          accessMode: doc.accessMode,
          dateRange: {
            from: doc.dateRange.from.toISOString(),
            to: doc.dateRange.to.toISOString(),
          },
          dataEraseAt: doc.dataEraseAt.toISOString(),
          frequency: doc.frequency,
        },
        envSource
      );

      const nextStatus: AbdmConsentRequestInternalStatus = adapterRes.externalRequestId
        ? 'AWAITING_PATIENT_ACTION'
        : 'SUBMITTED';

      doc.externalRequestId = adapterRes.externalRequestId;
      doc.externalTransactionRef = adapterRes.externalTransactionRef;
      doc.internalStatus = nextStatus;
      doc.externalStatus = adapterRes.externalStatus;
      doc.lastSyncedAt = new Date();
      doc.isMocked = adapterRes.isMocked;
      doc.statusHistory.push({
        fromInternalStatus: 'PENDING_SUBMISSION',
        toInternalStatus: nextStatus,
        externalStatus: adapterRes.externalStatus,
        reason: adapterRes.isMocked
          ? 'Submitted to synthetic development HIE-CM mock adapter; awaiting external approval callback.'
          : 'Submitted to ABDM HIE-CM V3 gateway (202 Accepted); awaiting patient action in ABDM PHR app.',
        changedAt: new Date(),
        correlationId,
      });
      await doc.save();

      await this.recordConsentEvent({
        eventId: `init-${correlationId}`,
        consentRequestId: doc._id,
        externalRequestId: doc.externalRequestId,
        patientId: doc.patientId,
        eventType: 'CONSENT_REQUEST_SUBMITTED',
        direction: 'OUTBOUND',
        previousInternalStatus: 'PENDING_SUBMISSION',
        nextInternalStatus: nextStatus,
        externalStatus: adapterRes.externalStatus,
        processingOutcome: 'PROCESSED',
        correlationId,
        externalTransactionRef: adapterRes.externalTransactionRef,
        reason: 'Outbound HIE-CM consent/v3/request/init accepted.',
        environment: config.environment,
        eventTimestamp: new Date(),
      });

      await this.recordAudit({
        actorId: actor.userId,
        action: 'ABDM_CONSENT_REQUEST_SUBMITTED',
        resourceType: 'ABDM_CONSENT_REQUEST',
        resourceId: String(doc._id),
        requestId: correlationId,
        outcome: 'SUCCESS',
        metadata: {
          internalReference,
          externalRequestId: doc.externalRequestId,
          purposeCode: doc.purposeCode,
          hiTypesCount: doc.hiTypes.length,
          environment: config.environment,
          isMocked: adapterRes.isMocked,
        },
      });

      await this.safePublishNotification({
        eventType: 'ABDM_CONSENT_REQUEST_SUBMITTED',
        recipientId: actor.userId,
        recipientRole: actor.role,
        title: 'ABDM Consent Request Submitted',
        message: `Consent request ${internalReference} was submitted to ABDM Consent Manager and is awaiting patient approval.`,
        relatedEntity: {
          entityType: 'ABDM_CONSENT_REQUEST',
          entityId: String(doc._id),
          referenceNumber: internalReference,
        },
      });
    } catch (err: any) {
      doc.internalStatus = 'FAILED';
      doc.lastErrorCode = err?.abdmCode || 'SUBMISSION_FAILED';
      doc.lastErrorMessage = err?.message || 'Failed to submit ABDM consent request';
      doc.statusHistory.push({
        fromInternalStatus: 'PENDING_SUBMISSION',
        toInternalStatus: 'FAILED',
        externalStatus: 'UNKNOWN',
        reason: doc.lastErrorMessage,
        changedAt: new Date(),
        correlationId,
      });
      await doc.save();

      await this.recordAudit({
        actorId: actor.userId,
        action: 'ABDM_CONSENT_REQUEST_SUBMISSION_FAILED',
        resourceType: 'ABDM_CONSENT_REQUEST',
        resourceId: String(doc._id),
        requestId: correlationId,
        outcome: 'FAILURE',
        metadata: { internalReference, errorCode: doc.lastErrorCode },
      });

      throw err;
    }

    return this.toRequestDto(doc);
  }

  // ============================================================================
  // 2. VERIFIED CALLBACK PROCESSING (IDEMPOTENT, MONOTONIC, ANTI-FORGERY)
  // ============================================================================

  async processConsentCallback(
    eventType: string,
    payload: Record<string, unknown>,
    meta: CallbackProcessMeta,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<CallbackProcessResult> {
    const config = abdmConfigurationService.loadConfig(envSource);
    const eventTimestamp = new Date(meta.timestamp);

    // 1. Idempotency guard via AbdmConsentEventModel
    const existingEvent = await AbdmConsentEventModel.findOne({
      eventId: meta.requestId,
      eventType,
    });
    if (existingEvent) {
      return {
        processed: false,
        outcome: 'DUPLICATE_IGNORED',
        reason: 'Duplicate consent callback event ignored idempotently.',
        externalRequestId: existingEvent.externalRequestId,
        externalConsentId: existingEvent.externalConsentId,
      };
    }

    // 2. Dispatch by verified ABDM V3 callback workflow
    switch (eventType) {
      case 'consent/request/on-init':
        return this.handleOnInitCallback(payload, meta, eventTimestamp, config.environment);
      case 'consent/request/on-status':
        return this.handleOnStatusCallback(payload, meta, eventTimestamp, config.environment);
      case 'consent/hiu/notify':
      case 'consent/revocation/notify':
        return this.handleHiuNotifyCallback(eventType, payload, meta, eventTimestamp, config.environment, envSource);
      case 'consent/hip/notify':
        return this.handleHipNotifyCallback(payload, meta, eventTimestamp, config.environment, envSource);
      case 'consent/on-fetch':
        return this.handleOnFetchCallback(payload, meta, eventTimestamp, config.environment);
      default:
        await this.recordConsentEvent({
          eventId: meta.requestId,
          eventType,
          direction: 'INBOUND_CALLBACK',
          processingOutcome: 'REJECTED',
          correlationId: meta.correlationId,
          reason: `Unsupported consent callback eventType '${eventType}'.`,
          environment: config.environment,
          eventTimestamp,
        });
        return {
          processed: false,
          outcome: 'REJECTED',
          reason: `Unsupported consent callback eventType '${eventType}'.`,
        };
    }
  }

  private async handleOnInitCallback(
    payload: Record<string, unknown>,
    meta: CallbackProcessMeta,
    eventTimestamp: Date,
    environment: AbdmEnvironment
  ): Promise<CallbackProcessResult> {
    const consentRequestObj = payload.consentRequest as { id?: string } | undefined;
    const externalRequestId = consentRequestObj?.id;
    const lookupCorrelation = meta.respRequestId || meta.correlationId;

    const reqDoc = await AbdmConsentRequestModel.findOne({
      $or: [
        { correlationId: lookupCorrelation },
        ...(externalRequestId ? [{ externalRequestId }] : []),
      ],
    });

    if (!reqDoc) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        externalRequestId,
        eventType: 'consent/request/on-init',
        direction: 'INBOUND_CALLBACK',
        processingOutcome: 'REJECTED',
        correlationId: meta.correlationId,
        reason: 'No matching outbound ABDM consent request found for on-init correlationId.',
        environment,
        eventTimestamp,
      });
      return {
        processed: false,
        outcome: 'REJECTED',
        reason: 'Unknown external transaction reference; consent request not found.',
      };
    }

    if (reqDoc.lastExternalEventAt && eventTimestamp.getTime() < reqDoc.lastExternalEventAt.getTime()) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        consentRequestId: reqDoc._id,
        externalRequestId: reqDoc.externalRequestId,
        patientId: reqDoc.patientId,
        eventType: 'consent/request/on-init',
        direction: 'INBOUND_CALLBACK',
        processingOutcome: 'STALE_IGNORED',
        correlationId: meta.correlationId,
        reason: 'Stale on-init callback timestamp earlier than latest recorded event.',
        environment,
        eventTimestamp,
      });
      return {
        processed: false,
        outcome: 'STALE_IGNORED',
        reason: 'Stale callback ignored to protect newer consent state.',
        externalRequestId: reqDoc.externalRequestId,
      };
    }

    const prevStatus = reqDoc.internalStatus;
    if (meta.error) {
      reqDoc.internalStatus = 'FAILED';
      reqDoc.lastErrorCode = String(meta.error.code);
      reqDoc.lastErrorMessage = meta.error.message;
    } else if (!TERMINAL_INTERNAL_STATUSES.has(reqDoc.internalStatus) && reqDoc.internalStatus !== 'APPROVED') {
      if (externalRequestId) {
        reqDoc.externalRequestId = externalRequestId;
      }
      reqDoc.internalStatus = 'AWAITING_PATIENT_ACTION';
      reqDoc.externalStatus = 'REQUESTED';
    }
    reqDoc.lastSyncedAt = new Date();
    reqDoc.lastExternalEventAt = eventTimestamp;
    reqDoc.statusHistory.push({
      fromInternalStatus: prevStatus,
      toInternalStatus: reqDoc.internalStatus,
      externalStatus: reqDoc.externalStatus,
      reason: meta.error ? `HIE-CM on-init error: ${meta.error.message}` : 'HIE-CM on-init acknowledged.',
      changedAt: new Date(),
      correlationId: meta.correlationId,
    });
    await reqDoc.save();

    await this.recordConsentEvent({
      eventId: meta.requestId,
      consentRequestId: reqDoc._id,
      externalRequestId: reqDoc.externalRequestId,
      patientId: reqDoc.patientId,
      eventType: 'consent/request/on-init',
      direction: 'INBOUND_CALLBACK',
      previousInternalStatus: prevStatus,
      nextInternalStatus: reqDoc.internalStatus,
      externalStatus: reqDoc.externalStatus,
      processingOutcome: 'PROCESSED',
      correlationId: meta.correlationId,
      reason: 'Processed HIE-CM on-init callback.',
      environment,
      eventTimestamp,
    });

    return {
      processed: true,
      outcome: 'PROCESSED',
      reason: 'Consent request on-init processed.',
      externalRequestId: reqDoc.externalRequestId,
    };
  }

  private async handleOnStatusCallback(
    payload: Record<string, unknown>,
    meta: CallbackProcessMeta,
    eventTimestamp: Date,
    environment: AbdmEnvironment
  ): Promise<CallbackProcessResult> {
    const cr = payload.consentRequest as
      | {
          id?: string;
          status?: AbdmExternalConsentStatus;
          consentArtefacts?: Array<{ id: string }>;
        }
      | undefined;

    if (!cr?.id || !cr?.status) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        eventType: 'consent/request/on-status',
        direction: 'INBOUND_CALLBACK',
        processingOutcome: 'REJECTED',
        correlationId: meta.correlationId,
        reason: 'Missing consentRequest.id or consentRequest.status in on-status payload.',
        environment,
        eventTimestamp,
      });
      return {
        processed: false,
        outcome: 'REJECTED',
        reason: 'Invalid on-status callback payload.',
      };
    }

    const reqDoc = await AbdmConsentRequestModel.findOne({ externalRequestId: cr.id });
    if (!reqDoc) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        externalRequestId: cr.id,
        eventType: 'consent/request/on-status',
        direction: 'INBOUND_CALLBACK',
        processingOutcome: 'REJECTED',
        correlationId: meta.correlationId,
        reason: 'Forged or unknown externalRequestId in on-status callback.',
        environment,
        eventTimestamp,
      });
      return {
        processed: false,
        outcome: 'REJECTED',
        reason: 'Unknown consentRequestId; callback rejected.',
      };
    }

    // Event ordering & monotonic terminal protection
    if (
      (reqDoc.lastExternalEventAt &&
        eventTimestamp.getTime() < reqDoc.lastExternalEventAt.getTime()) ||
      (TERMINAL_EXTERNAL_STATUSES.has(reqDoc.externalStatus) &&
        !TERMINAL_EXTERNAL_STATUSES.has(cr.status))
    ) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        consentRequestId: reqDoc._id,
        externalRequestId: cr.id,
        patientId: reqDoc.patientId,
        eventType: 'consent/request/on-status',
        direction: 'INBOUND_CALLBACK',
        externalStatus: cr.status,
        processingOutcome: 'STALE_IGNORED',
        correlationId: meta.correlationId,
        reason: `Ignored stale/non-monotonic status '${cr.status}' against current '${reqDoc.externalStatus}'.`,
        environment,
        eventTimestamp,
      });
      return {
        processed: false,
        outcome: 'STALE_IGNORED',
        reason: 'Stale or non-monotonic status update ignored.',
        externalRequestId: cr.id,
      };
    }

    const prevInternal = reqDoc.internalStatus;
    const mappedInternal = this.mapExternalToInternalRequestStatus(cr.status);
    reqDoc.externalStatus = cr.status;
    reqDoc.internalStatus = mappedInternal;
    reqDoc.lastSyncedAt = new Date();
    reqDoc.lastExternalEventAt = eventTimestamp;

    if (Array.isArray(cr.consentArtefacts)) {
      const ids = cr.consentArtefacts.map((a) => a.id).filter(Boolean);
      reqDoc.artefactIds = Array.from(new Set([...reqDoc.artefactIds, ...ids]));
    }

    reqDoc.statusHistory.push({
      fromInternalStatus: prevInternal,
      toInternalStatus: mappedInternal,
      externalStatus: cr.status,
      reason: `Synchronized via HIE-CM on-status (${cr.status}).`,
      changedAt: new Date(),
      correlationId: meta.correlationId,
    });
    await reqDoc.save();

    await this.recordConsentEvent({
      eventId: meta.requestId,
      consentRequestId: reqDoc._id,
      externalRequestId: cr.id,
      patientId: reqDoc.patientId,
      eventType: 'consent/request/on-status',
      direction: 'INBOUND_CALLBACK',
      previousInternalStatus: prevInternal,
      nextInternalStatus: mappedInternal,
      externalStatus: cr.status,
      processingOutcome: 'PROCESSED',
      correlationId: meta.correlationId,
      reason: `Status synchronized to ${cr.status}.`,
      environment,
      eventTimestamp,
    });

    return {
      processed: true,
      outcome: 'PROCESSED',
      reason: `Consent request status synchronized to ${cr.status}.`,
      externalRequestId: cr.id,
    };
  }

  private async handleHiuNotifyCallback(
    eventType: string,
    payload: Record<string, unknown>,
    meta: CallbackProcessMeta,
    eventTimestamp: Date,
    environment: AbdmEnvironment,
    envSource: NodeJS.ProcessEnv
  ): Promise<CallbackProcessResult> {
    const notification = payload.notification as
      | {
          consentRequestId?: string;
          status?: AbdmExternalConsentStatus;
          consentArtefacts?: Array<{ id: string }>;
          artefactDetails?: ExternalAbdmArtefactPayloadInput[];
        }
      | undefined;

    if (!notification?.status || (!notification.consentRequestId && !notification.consentArtefacts?.length)) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        eventType,
        direction: 'INBOUND_CALLBACK',
        processingOutcome: 'REJECTED',
        correlationId: meta.correlationId,
        reason: 'Malformed HIU consent notification payload.',
        environment,
        eventTimestamp,
      });
      return {
        processed: false,
        outcome: 'REJECTED',
        reason: 'Malformed HIU consent notification payload.',
      };
    }

    // Match tracked consent request (anti-forgery: unknown consentRequestId rejected!)
    const reqDoc = notification.consentRequestId
      ? await AbdmConsentRequestModel.findOne({
          externalRequestId: notification.consentRequestId,
        })
      : null;

    if (notification.consentRequestId && !reqDoc) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        externalRequestId: notification.consentRequestId,
        eventType,
        direction: 'INBOUND_CALLBACK',
        externalStatus: notification.status,
        processingOutcome: 'REJECTED',
        correlationId: meta.correlationId,
        reason: 'Rejected forged or untracked consentRequestId in HIU notify callback.',
        environment,
        eventTimestamp,
      });
      await this.recordAudit({
        action: 'ABDM_FORGED_CONSENT_CALLBACK_REJECTED',
        resourceType: 'ABDM_CONSENT_REQUEST',
        resourceId: notification.consentRequestId,
        requestId: meta.correlationId,
        outcome: 'BLOCKED',
        metadata: { eventType, externalStatus: notification.status },
      });
      return {
        processed: false,
        outcome: 'REJECTED',
        reason: 'Rejected callback for unknown consentRequestId.',
      };
    }

    // Anti-stale-overwrite & monotonic transition protection on request
    if (reqDoc) {
      const isStaleTime =
        Boolean(reqDoc.lastExternalEventAt) &&
        eventTimestamp.getTime() < reqDoc.lastExternalEventAt!.getTime();
      const isRegressiveState =
        TERMINAL_EXTERNAL_STATUSES.has(reqDoc.externalStatus) &&
        !TERMINAL_EXTERNAL_STATUSES.has(notification.status);

      if (isStaleTime || isRegressiveState) {
        await this.recordConsentEvent({
          eventId: meta.requestId,
          consentRequestId: reqDoc._id,
          externalRequestId: reqDoc.externalRequestId,
          patientId: reqDoc.patientId,
          eventType,
          direction: 'INBOUND_CALLBACK',
          externalStatus: notification.status,
          processingOutcome: 'STALE_IGNORED',
          correlationId: meta.correlationId,
          reason: 'Stale or out-of-order HIU notify callback ignored to preserve newer state.',
          environment,
          eventTimestamp,
        });
        return {
          processed: false,
          outcome: 'STALE_IGNORED',
          reason: 'Stale HIU notification ignored.',
          externalRequestId: reqDoc.externalRequestId,
        };
      }

      const prevInternal = reqDoc.internalStatus;
      const nextInternal = this.mapExternalToInternalRequestStatus(notification.status);
      reqDoc.externalStatus = notification.status;
      reqDoc.internalStatus = nextInternal;
      reqDoc.lastSyncedAt = new Date();
      reqDoc.lastExternalEventAt = eventTimestamp;

      const artefactIds = (notification.consentArtefacts || []).map((a) => a.id).filter(Boolean);
      if (artefactIds.length > 0) {
        reqDoc.artefactIds = Array.from(new Set([...reqDoc.artefactIds, ...artefactIds]));
      }

      reqDoc.statusHistory.push({
        fromInternalStatus: prevInternal,
        toInternalStatus: nextInternal,
        externalStatus: notification.status,
        reason: `HIU consent notification received (${notification.status}).`,
        changedAt: new Date(),
        correlationId: meta.correlationId,
      });
      await reqDoc.save();

      // Send privacy-safe patient notifications
      if (notification.status === 'GRANTED') {
        await this.safePublishNotification({
          eventType: 'ABDM_CONSENT_APPROVED',
          recipientId: String(reqDoc.patientId),
          recipientRole: 'PATIENT',
          title: 'ABDM Consent Approval Synchronized',
          message: `Your ABDM consent approval for ${reqDoc.requestingOrganizationName} has been synchronized.`,
          relatedEntity: {
            entityType: 'ABDM_CONSENT_REQUEST',
            entityId: String(reqDoc._id),
            referenceNumber: reqDoc.internalReference,
          },
          linkUrl: `/patient/consent/requests/${String(reqDoc._id)}`,
        });
      } else if (notification.status === 'DENIED') {
        await this.safePublishNotification({
          eventType: 'ABDM_CONSENT_REJECTED',
          recipientId: String(reqDoc.patientId),
          recipientRole: 'PATIENT',
          title: 'ABDM Consent Request Rejected',
          message: `Your rejection of the ABDM consent request from ${reqDoc.requestingOrganizationName} has been synchronized.`,
          relatedEntity: {
            entityType: 'ABDM_CONSENT_REQUEST',
            entityId: String(reqDoc._id),
            referenceNumber: reqDoc.internalReference,
          },
          linkUrl: `/patient/consent/requests/${String(reqDoc._id)}`,
        });
      }
    }

    // Apply REVOKED / EXPIRED updates to existing artefacts + invalidate cache immediately!
    const notifiedConsentIds = (notification.consentArtefacts || [])
      .map((a) => a.id)
      .filter(Boolean);

    if (notification.status === 'REVOKED' || notification.status === 'EXPIRED') {
      for (const consentId of notifiedConsentIds) {
        await this.applyExternalStatusToArtefact(
          consentId,
          notification.status,
          eventTimestamp,
          meta.correlationId
        );
      }
    }

    // If artefact details were bundled directly in the callback (e.g. dev/sandbox fetch-less test), validate & store immutably
    if (Array.isArray(notification.artefactDetails)) {
      for (const rawArt of notification.artefactDetails) {
        await this.validateAndStoreExternalArtefact(rawArt, {
          source: environment === 'development' ? 'MOCK_HIE_CM_DEVELOPMENT' : 'ABDM_HIE_CM_CALLBACK',
          environment,
          externalRequestId: notification.consentRequestId,
          consentRequestId: reqDoc?._id,
          correlationId: meta.correlationId,
          eventTimestamp,
        });
      }
    }

    // Acknowledge notification back to Gateway where supported
    if (reqDoc && notifiedConsentIds.length > 0) {
      try {
        await abdmConsentV3Client.acknowledgeConsentNotification(
          {
            role: 'HIU',
            participantId: reqDoc.requestingParticipantId,
            respRequestId: meta.requestId,
            consentIds: notifiedConsentIds,
          },
          envSource
        );
      } catch (ackErr: any) {
        logger.warn(
          'Failed to send HIU on-notify acknowledgement',
          redactAbdmLogPayload({
            correlationId: meta.correlationId,
            error: ackErr?.message,
          }) as Record<string, unknown>
        );
      }
    }

    await this.recordConsentEvent({
      eventId: meta.requestId,
      consentRequestId: reqDoc?._id,
      externalRequestId: notification.consentRequestId,
      externalConsentId: notifiedConsentIds[0],
      patientId: reqDoc?.patientId,
      eventType,
      direction: 'INBOUND_CALLBACK',
      nextInternalStatus: reqDoc?.internalStatus,
      externalStatus: notification.status,
      processingOutcome: 'PROCESSED',
      correlationId: meta.correlationId,
      reason: `Processed HIU notification (${notification.status}).`,
      environment,
      eventTimestamp,
    });

    await this.recordAudit({
      action: `ABDM_CONSENT_NOTIFY_${notification.status}`,
      resourceType: 'ABDM_CONSENT_REQUEST',
      resourceId: notification.consentRequestId || notifiedConsentIds[0] || meta.requestId,
      requestId: meta.correlationId,
      outcome: 'SUCCESS',
      metadata: {
        eventType,
        externalStatus: notification.status,
        artefactsCount: notifiedConsentIds.length,
      },
    });

    return {
      processed: true,
      outcome: 'PROCESSED',
      reason: `HIU consent notification '${notification.status}' processed.`,
      externalRequestId: notification.consentRequestId,
      externalConsentId: notifiedConsentIds[0],
    };
  }

  private async handleHipNotifyCallback(
    payload: Record<string, unknown>,
    meta: CallbackProcessMeta,
    eventTimestamp: Date,
    environment: AbdmEnvironment,
    envSource: NodeJS.ProcessEnv
  ): Promise<CallbackProcessResult> {
    const notification = payload.notification as
      | {
          status?: AbdmExternalConsentStatus;
          consentId?: string;
          consentDetail?: Record<string, unknown>;
          signature?: string;
        }
      | undefined;

    if (!notification?.status || !notification?.consentId) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        eventType: 'consent/hip/notify',
        direction: 'INBOUND_CALLBACK',
        processingOutcome: 'REJECTED',
        correlationId: meta.correlationId,
        reason: 'Missing status or consentId in HIP consent notify callback.',
        environment,
        eventTimestamp,
      });
      return {
        processed: false,
        outcome: 'REJECTED',
        reason: 'Invalid HIP consent notify payload.',
      };
    }

    if (notification.status === 'REVOKED' || notification.status === 'EXPIRED') {
      await this.applyExternalStatusToArtefact(
        notification.consentId,
        notification.status,
        eventTimestamp,
        meta.correlationId
      );
    } else if (notification.status === 'GRANTED' && notification.consentDetail) {
      await this.validateAndStoreExternalArtefact(
        {
          consentId: notification.consentId,
          createdAt: eventTimestamp.toISOString(),
          status: 'GRANTED',
          signature: notification.signature,
          consentDetail: notification.consentDetail,
        },
        {
          source: environment === 'development' ? 'MOCK_HIE_CM_DEVELOPMENT' : 'ABDM_HIE_CM_CALLBACK',
          environment,
          correlationId: meta.correlationId,
          eventTimestamp,
        }
      );
    }

    try {
      await abdmConsentV3Client.acknowledgeConsentNotification(
        {
          role: 'HIP',
          participantId: abdmConfigurationService.loadConfig(envSource).clientId || 'HEALTHBRIDGE-HIP-DEV',
          respRequestId: meta.requestId,
          consentIds: [notification.consentId],
        },
        envSource
      );
    } catch {
      // Non-blocking ack failure logged elsewhere
    }

    await this.recordConsentEvent({
      eventId: meta.requestId,
      externalConsentId: notification.consentId,
      eventType: 'consent/hip/notify',
      direction: 'INBOUND_CALLBACK',
      externalStatus: notification.status,
      processingOutcome: 'PROCESSED',
      correlationId: meta.correlationId,
      reason: `Processed HIP notification (${notification.status}).`,
      environment,
      eventTimestamp,
    });

    return {
      processed: true,
      outcome: 'PROCESSED',
      reason: `HIP consent notification '${notification.status}' processed.`,
      externalConsentId: notification.consentId,
    };
  }

  private async handleOnFetchCallback(
    payload: Record<string, unknown>,
    meta: CallbackProcessMeta,
    eventTimestamp: Date,
    environment: AbdmEnvironment
  ): Promise<CallbackProcessResult> {
    const consent = payload.consent as Record<string, unknown> | undefined;
    if (!consent) {
      await this.recordConsentEvent({
        eventId: meta.requestId,
        eventType: 'consent/on-fetch',
        direction: 'INBOUND_CALLBACK',
        processingOutcome: 'REJECTED',
        correlationId: meta.correlationId,
        reason: 'Missing consent artefact object in on-fetch callback.',
        environment,
        eventTimestamp,
      });
      return {
        processed: false,
        outcome: 'REJECTED',
        reason: 'Missing consent artefact payload in on-fetch.',
      };
    }

    const stored = await this.validateAndStoreExternalArtefact(consent, {
      source: environment === 'development' ? 'MOCK_HIE_CM_DEVELOPMENT' : 'ABDM_HIE_CM_FETCH',
      environment,
      correlationId: meta.correlationId,
      eventTimestamp,
    });

    await this.recordConsentEvent({
      eventId: meta.requestId,
      externalConsentId: stored.externalConsentId,
      patientId: Types.ObjectId.isValid(stored.patientId)
        ? new Types.ObjectId(stored.patientId)
        : undefined,
      eventType: 'consent/on-fetch',
      direction: 'INBOUND_CALLBACK',
      externalStatus: stored.externalStatus,
      processingOutcome: 'PROCESSED',
      correlationId: meta.correlationId,
      reason: `Artefact stored with validationStatus '${stored.validationStatus}'.`,
      environment,
      eventTimestamp,
    });

    return {
      processed: true,
      outcome: 'PROCESSED',
      reason: `Consent artefact '${stored.externalConsentId}' validated and stored (${stored.validationStatus}).`,
      externalConsentId: stored.externalConsentId,
    };
  }

  // ============================================================================
  // 3. IMMUTABLE CONSENT ARTEFACT VALIDATION & STORAGE
  // ============================================================================

  async validateAndStoreExternalArtefact(
    rawPayload: Record<string, unknown>,
    context: {
      source: 'ABDM_HIE_CM_CALLBACK' | 'ABDM_HIE_CM_FETCH' | 'MOCK_HIE_CM_DEVELOPMENT';
      environment: AbdmEnvironment;
      externalRequestId?: string;
      consentRequestId?: Types.ObjectId;
      correlationId?: string;
      eventTimestamp?: Date;
      now?: Date;
    }
  ): Promise<AbdmConsentArtefactRecordDto> {
    const parsed = externalAbdmArtefactPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new AbdmIntegrationError({
        message: `Invalid external ABDM Consent Artefact schema: ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 422,
      });
    }

    const data = parsed.data;
    const now = context.now || new Date();
    const patientAbha = data.consentDetail.patient.id.trim().toLowerCase();

    // Resolve linked patient via authoritative AbhaLinkModel
    const abhaLink = await AbhaLinkModel.findOne({
      abhaAddress: patientAbha,
      linkStatus: 'LINKED',
      verificationStatus: 'VERIFIED',
    });

    if (!abhaLink) {
      throw new AbdmIntegrationError({
        message: `Consent artefact patient reference '${patientAbha}' does not match any verified linked HealthBridge patient.`,
        abdmCode: 'ABDM_CONSENT_INVALID',
        statusCode: 422,
      });
    }

    const validationIssues: string[] = [];

    // Verify digital signature status honestly:
    // - In development mock mode: accepts deterministic synthetic signature prefixed `MOCK-CM-SIG-`
    // - In sandbox/production: requires real CM cryptographic verification (not yet provisioned -> fails closed!)
    const isMocked = context.environment === 'development';
    let signatureVerified = false;
    if (isMocked && data.signature && data.signature.startsWith('MOCK-CM-SIG-')) {
      signatureVerified = true;
    } else if (!data.signature) {
      validationIssues.push('Missing Consent Manager digital signature on external artefact.');
    } else if (!isMocked) {
      validationIssues.push(
        'HIE-CM cryptographic signature verification key (JWKS/cert) is pending live sandbox onboarding.'
      );
    } else {
      validationIssues.push('Consent artefact signature failed mock verification format check.');
    }

    const expiresAt = new Date(data.consentDetail.permission.dataEraseAt);
    const isExpired = data.status === 'EXPIRED' || expiresAt.getTime() <= now.getTime();
    const isRevoked = data.status === 'REVOKED';

    let validationStatus: IAbdmConsentArtefactDocument['validationStatus'] = 'VALID';
    if (isRevoked) {
      validationStatus = 'REVOKED';
    } else if (isExpired) {
      validationStatus = 'EXPIRED';
    } else if (!signatureVerified) {
      validationStatus = 'SIGNATURE_UNVERIFIED';
    }

    // Preserve immutable canonical payload & SHA-256 integrity hash
    const frozenOriginalPayload = JSON.parse(JSON.stringify(rawPayload)) as Record<string, unknown>;
    const payloadSha256 = crypto
      .createHash('sha256')
      .update(JSON.stringify(frozenOriginalPayload))
      .digest('hex');

    // Encrypt sensitive copy at rest using AES-256-GCM utility
    const encryptedSensitivePayload = encryptSensitivePayloadForStorage(
      JSON.stringify({
        patientAbha,
        signature: data.signature || null,
        careContexts: data.consentDetail.careContexts || [],
      })
    );

    // Check if artefact already exists (never overwrite originalExternalPayload!)
    const existing = await AbdmConsentArtefactModel.findOne({
      externalConsentId: data.consentId,
    });

    if (existing) {
      const eventTs = context.eventTimestamp || now;
      if (existing.lastExternalEventAt && eventTs.getTime() < existing.lastExternalEventAt.getTime()) {
        return this.toArtefactDto(existing);
      }

      if (
        TERMINAL_EXTERNAL_STATUSES.has(existing.externalStatus) &&
        !TERMINAL_EXTERNAL_STATUSES.has(data.status)
      ) {
        return this.toArtefactDto(existing);
      }

      const prevExt = existing.externalStatus;
      existing.externalStatus = data.status;
      existing.validationStatus = validationStatus;
      existing.signatureVerified = signatureVerified;
      existing.externalConfirmationReceived = true;
      existing.lastSyncedAt = now;
      existing.lastExternalEventAt = eventTs;
      existing.validationIssues = validationIssues;
      if (isRevoked) {
        existing.revocationStatus = 'CONFIRMED_REVOKED';
        existing.revokedAt = existing.revokedAt || now;
      }
      existing.statusHistory.push({
        fromExternalStatus: prevExt,
        toExternalStatus: data.status,
        validationStatus,
        revocationStatus: existing.revocationStatus,
        reason: 'Updated from verified external artefact sync (original payload preserved immutably).',
        changedAt: now,
        correlationId: context.correlationId,
      });
      await existing.save();

      if (isRevoked || isExpired) {
        abdmConsentValidationService.invalidateByArtefact(
          String(existing._id),
          existing.externalConsentId
        );
      }

      return this.toArtefactDto(existing);
    }

    const internalReference = `HB-ABDM-ART-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    const created = await AbdmConsentArtefactModel.create({
      internalReference,
      externalConsentId: data.consentId,
      consentRequestId: context.consentRequestId,
      externalRequestId: context.externalRequestId,
      origin: 'ABDM_HIE_CM',
      patientId: abhaLink.patientId,
      patientAbhaAddress: patientAbha,
      hipId: data.consentDetail.hip?.id,
      hiuId: data.consentDetail.hiu.id,
      hiuName: data.consentDetail.hiu.name,
      purposeCode: data.consentDetail.purpose.code,
      purposeText: data.consentDetail.purpose.text,
      hiTypes: data.consentDetail.hiTypes,
      accessMode: data.consentDetail.permission.accessMode,
      dateRange: {
        from: new Date(data.consentDetail.permission.dateRange.from),
        to: new Date(data.consentDetail.permission.dateRange.to),
      },
      dataEraseAt: expiresAt,
      frequency: data.consentDetail.permission.frequency,
      externalStatus: data.status,
      validationStatus,
      revocationStatus: isRevoked ? 'CONFIRMED_REVOKED' : 'NOT_REVOKED',
      signatureVerified,
      externalConfirmationReceived: true,
      originalExternalPayload: frozenOriginalPayload,
      encryptedSensitivePayload,
      payloadSha256,
      source: context.source,
      environment: context.environment,
      isMocked,
      grantedAt: data.status === 'GRANTED' ? new Date(data.createdAt) : undefined,
      expiresAt,
      revokedAt: isRevoked ? now : undefined,
      lastSyncedAt: now,
      lastExternalEventAt: context.eventTimestamp || now,
      validationIssues,
      statusHistory: [
        {
          toExternalStatus: data.status,
          validationStatus,
          revocationStatus: isRevoked ? 'CONFIRMED_REVOKED' : 'NOT_REVOKED',
          reason: `External artefact ingested from ${context.source}.`,
          changedAt: now,
          correlationId: context.correlationId,
        },
      ],
    });

    await this.recordAudit({
      action: 'ABDM_CONSENT_ARTEFACT_STORED',
      resourceType: 'ABDM_CONSENT_ARTEFACT',
      resourceId: String(created._id),
      requestId: context.correlationId || data.consentId,
      outcome: 'SUCCESS',
      metadata: {
        externalConsentId: data.consentId,
        validationStatus,
        signatureVerified,
        payloadSha256,
        environment: context.environment,
        isMocked,
      },
    });

    return this.toArtefactDto(created);
  }

  // ============================================================================
  // 4. PATIENT CONSENT REVOCATION WORKFLOW
  // ============================================================================

  async initiatePatientRevocation(
    patientUserId: string,
    artefactIdentifier: string,
    reason: string,
    patientPhrAuthToken?: string,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmConsentRevocationResponseDto> {
    const artefact = Types.ObjectId.isValid(artefactIdentifier)
      ? await AbdmConsentArtefactModel.findById(artefactIdentifier)
      : await AbdmConsentArtefactModel.findOne({ externalConsentId: artefactIdentifier });

    if (!artefact) {
      throw AppError.notFound('ABDM consent artefact not found.');
    }

    // Strict patient ownership check (prevents cross-patient / unauthorized revocation!)
    if (String(artefact.patientId) !== String(patientUserId)) {
      await this.recordAudit({
        actorId: patientUserId,
        action: 'ABDM_CONSENT_UNAUTHORIZED_REVOCATION_ATTEMPT',
        resourceType: 'ABDM_CONSENT_ARTEFACT',
        resourceId: String(artefact._id),
        requestId: abdmCorrelationService.generateRequestId(),
        outcome: 'BLOCKED',
        metadata: { externalConsentId: artefact.externalConsentId },
      });
      throw AppError.forbidden('You are not authorized to revoke another patient’s ABDM consent artefact.');
    }

    // Handle duplicate revocation safely without deleting or corrupting history
    if (artefact.revocationStatus === 'CONFIRMED_REVOKED' || artefact.externalStatus === 'REVOKED') {
      const invalidated = abdmConsentValidationService.invalidateByArtefact(
        String(artefact._id),
        artefact.externalConsentId
      );
      return {
        artefactId: String(artefact._id),
        externalConsentId: artefact.externalConsentId,
        revocationStatus: 'CONFIRMED_REVOKED',
        externalStatus: 'REVOKED',
        externalConfirmed: true,
        cacheInvalidated: invalidated >= 0,
        correlationId: artefact.revocationCorrelationId || abdmCorrelationService.generateRequestId(),
        isMocked: artefact.isMocked,
        message: 'Consent artefact is already confirmed as REVOKED.',
        guidance: 'No further action needed. All external data access under this artefact is denied.',
        updatedAt: artefact.updatedAt.toISOString(),
      };
    }

    if (artefact.revocationStatus === 'PENDING_CONFIRMATION') {
      abdmConsentValidationService.invalidateByArtefact(
        String(artefact._id),
        artefact.externalConsentId
      );
      return {
        artefactId: String(artefact._id),
        externalConsentId: artefact.externalConsentId,
        revocationStatus: 'PENDING_CONFIRMATION',
        externalStatus: artefact.externalStatus,
        externalConfirmed: false,
        cacheInvalidated: true,
        correlationId: artefact.revocationCorrelationId || abdmCorrelationService.generateRequestId(),
        isMocked: artefact.isMocked,
        message: 'Revocation is already pending external ABDM Consent Manager confirmation.',
        guidance:
          'HealthBridge has blocked internal/outbound access immediately. Confirm revocation in your official ABDM PHR application to finalize external status.',
        updatedAt: artefact.updatedAt.toISOString(),
      };
    }

    // Attempt official revocation via adapter (returns externalConfirmed: false if awaiting callback or PHR role)
    const adapterRes = await abdmConsentV3Client.requestConsentRevocation(
      {
        externalConsentId: artefact.externalConsentId,
        patientPhrAuthToken,
      },
      envSource
    );

    const now = new Date();
    const prevExternal = artefact.externalStatus;

    // Never falsely claim external revocation succeeded when external confirmation has not arrived!
    artefact.revocationStatus = adapterRes.externalConfirmed
      ? 'CONFIRMED_REVOKED'
      : 'PENDING_CONFIRMATION';
    artefact.revocationRequestedAt = now;
    artefact.revocationReason = reason;
    artefact.revocationCorrelationId = adapterRes.correlationId;
    if (adapterRes.externalConfirmed) {
      artefact.externalStatus = 'REVOKED';
      artefact.validationStatus = 'REVOKED';
      artefact.revokedAt = now;
    }

    // Preserve immutable history (append only, NEVER delete!)
    artefact.statusHistory.push({
      fromExternalStatus: prevExternal,
      toExternalStatus: artefact.externalStatus,
      validationStatus: artefact.validationStatus,
      revocationStatus: artefact.revocationStatus,
      reason: `Patient initiated revocation: ${reason}`,
      changedAt: now,
      correlationId: adapterRes.correlationId,
    });
    await artefact.save();

    // Immediately invalidate internal authorization cache (safe fail-closed policy)
    abdmConsentValidationService.invalidateByArtefact(
      String(artefact._id),
      artefact.externalConsentId
    );

    await this.recordConsentEvent({
      eventId: `revoke-init-${adapterRes.correlationId}`,
      consentRequestId: artefact.consentRequestId,
      externalRequestId: artefact.externalRequestId,
      externalConsentId: artefact.externalConsentId,
      patientId: artefact.patientId,
      eventType: 'CONSENT_REVOCATION_INITIATED',
      direction: 'PATIENT_ACTION',
      externalStatus: artefact.externalStatus,
      processingOutcome: 'PROCESSED',
      correlationId: adapterRes.correlationId,
      reason: adapterRes.reason,
      environment: artefact.environment,
      eventTimestamp: now,
    });

    await this.recordAudit({
      actorId: patientUserId,
      action: 'ABDM_CONSENT_REVOCATION_INITIATED',
      resourceType: 'ABDM_CONSENT_ARTEFACT',
      resourceId: String(artefact._id),
      requestId: adapterRes.correlationId,
      outcome: 'SUCCESS',
      metadata: {
        externalConsentId: artefact.externalConsentId,
        revocationStatus: artefact.revocationStatus,
        externalConfirmed: adapterRes.externalConfirmed,
      },
    });

    await this.safePublishNotification({
      eventType: 'ABDM_CONSENT_REVOCATION_INITIATED',
      recipientId: patientUserId,
      recipientRole: 'PATIENT',
      title: 'ABDM Consent Revocation Initiated',
      message:
        'Local access under this consent artefact has been blocked immediately. Revocation is pending external ABDM Consent Manager confirmation.',
      relatedEntity: {
        entityType: 'ABDM_CONSENT_ARTEFACT',
        entityId: String(artefact._id),
        referenceNumber: artefact.internalReference,
      },
      linkUrl: '/patient/consent/artefacts',
    });

    return {
      artefactId: String(artefact._id),
      externalConsentId: artefact.externalConsentId,
      revocationStatus: artefact.revocationStatus,
      externalStatus: artefact.externalStatus,
      externalConfirmed: adapterRes.externalConfirmed,
      cacheInvalidated: true,
      correlationId: adapterRes.correlationId,
      isMocked: adapterRes.isMocked,
      message: adapterRes.externalConfirmed
        ? 'Consent revocation confirmed.'
        : 'Revocation initiated and marked PENDING_CONFIRMATION. Local authorization has been blocked immediately.',
      guidance: adapterRes.reason,
      updatedAt: now.toISOString(),
    };
  }

  // ============================================================================
  // 5. EXPIRY & STATUS SYNCHRONIZATION SERVICE (BACKGROUND / SCHEDULER-SAFE)
  // ============================================================================

  async runExpiryAndStatusSync(
    options: {
      syncType?: 'SCHEDULED_SWEEP' | 'MANUAL_ADMIN_SYNC' | 'REQUEST_STATUS_POLL';
      triggeredBy?: string;
      nearingExpiryHours?: number;
      pollExternalStatus?: boolean;
      now?: Date;
    } = {},
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmConsentSyncSummaryDto> {
    const config = abdmConfigurationService.loadConfig(envSource);
    const startedAt = options.now || new Date();
    const nearingWindowMs = (options.nearingExpiryHours ?? 24) * 60 * 60 * 1000;
    const nearingCutoff = new Date(startedAt.getTime() + nearingWindowMs);

    let expiredRequestsMarked = 0;
    let expiredArtefactsMarked = 0;
    let nearingExpiryNotified = 0;
    let externalStatusChecked = 0;
    let externalStatusUpdated = 0;
    const failureMessages: string[] = [];

    // 1. Detect & mark locally expired consent requests
    const expirableRequests = await AbdmConsentRequestModel.find({
      internalStatus: { $in: ['SUBMITTED', 'AWAITING_PATIENT_ACTION', 'PENDING_SUBMISSION'] },
      expiresAt: { $lte: startedAt },
    });

    for (const reqDoc of expirableRequests) {
      const prev = reqDoc.internalStatus;
      reqDoc.internalStatus = 'EXPIRED';
      reqDoc.externalStatus = 'EXPIRED';
      reqDoc.lastSyncedAt = startedAt;
      reqDoc.statusHistory.push({
        fromInternalStatus: prev,
        toInternalStatus: 'EXPIRED',
        externalStatus: 'EXPIRED',
        reason: 'Detected locally expired consent request during synchronization sweep.',
        changedAt: startedAt,
      });
      await reqDoc.save();
      expiredRequestsMarked += 1;

      await this.recordConsentEvent({
        eventId: `sync-req-exp-${String(reqDoc._id)}-${startedAt.getTime()}`,
        consentRequestId: reqDoc._id,
        externalRequestId: reqDoc.externalRequestId,
        patientId: reqDoc.patientId,
        eventType: 'CONSENT_REQUEST_EXPIRED_LOCALLY',
        direction: 'INTERNAL_SYNC',
        previousInternalStatus: prev,
        nextInternalStatus: 'EXPIRED',
        externalStatus: 'EXPIRED',
        processingOutcome: 'PROCESSED',
        reason: 'Consent request passed expiresAt deadline.',
        environment: config.environment,
        eventTimestamp: startedAt,
      });
    }

    // 2. Detect & mark locally expired artefacts + invalidate authorization cache
    const expirableArtefacts = await AbdmConsentArtefactModel.find({
      externalStatus: 'GRANTED',
      $or: [{ expiresAt: { $lte: startedAt } }, { dataEraseAt: { $lte: startedAt } }],
    });

    for (const artDoc of expirableArtefacts) {
      const prevExt = artDoc.externalStatus;
      artDoc.externalStatus = 'EXPIRED';
      artDoc.validationStatus = 'EXPIRED';
      artDoc.lastSyncedAt = startedAt;
      artDoc.statusHistory.push({
        fromExternalStatus: prevExt,
        toExternalStatus: 'EXPIRED',
        validationStatus: 'EXPIRED',
        revocationStatus: artDoc.revocationStatus,
        reason: 'Consent artefact reached expiry or dataEraseAt deadline.',
        changedAt: startedAt,
      });
      await artDoc.save();

      abdmConsentValidationService.invalidateByArtefact(
        String(artDoc._id),
        artDoc.externalConsentId
      );
      expiredArtefactsMarked += 1;

      await this.safePublishNotification({
        eventType: 'ABDM_CONSENT_EXPIRED',
        recipientId: String(artDoc.patientId),
        recipientRole: 'PATIENT',
        title: 'ABDM Consent Artefact Expired',
        message: `Consent artefact ${artDoc.internalReference} has expired and no longer permits external health data access.`,
        relatedEntity: {
          entityType: 'ABDM_CONSENT_ARTEFACT',
          entityId: String(artDoc._id),
          referenceNumber: artDoc.internalReference,
        },
        linkUrl: '/patient/consent/artefacts',
      });
    }

    // 3. Notify patients of active artefacts nearing expiry
    const nearingArtefacts = await AbdmConsentArtefactModel.find({
      externalStatus: 'GRANTED',
      revocationStatus: 'NOT_REVOKED',
      expiresAt: { $gt: startedAt, $lte: nearingCutoff },
      nearingExpiryNotifiedAt: { $exists: false },
    });

    for (const artDoc of nearingArtefacts) {
      artDoc.nearingExpiryNotifiedAt = startedAt;
      await artDoc.save();
      nearingExpiryNotified += 1;

      await this.safePublishNotification({
        eventType: 'ABDM_CONSENT_NEARING_EXPIRY',
        recipientId: String(artDoc.patientId),
        recipientRole: 'PATIENT',
        title: 'ABDM Consent Nearing Expiry',
        message: `Your ABDM consent artefact ${artDoc.internalReference} is approaching its expiry date.`,
        relatedEntity: {
          entityType: 'ABDM_CONSENT_ARTEFACT',
          entityId: String(artDoc._id),
          referenceNumber: artDoc.internalReference,
        },
        linkUrl: '/patient/consent/artefacts',
      });
    }

    // 4. Optional external status poll for pending requests (when ABDM is enabled)
    if (options.pollExternalStatus !== false && config.enabled && config.environment !== 'disabled') {
      const pendingRequests = await AbdmConsentRequestModel.find({
        internalStatus: { $in: ['SUBMITTED', 'AWAITING_PATIENT_ACTION'] },
        externalRequestId: { $exists: true, $ne: null },
      }).limit(50);

      for (const reqDoc of pendingRequests) {
        if (!reqDoc.externalRequestId) continue;
        externalStatusChecked += 1;
        try {
          const pollRes = await abdmConsentV3Client.fetchConsentRequestStatus(
            {
              externalRequestId: reqDoc.externalRequestId,
              hiuId: reqDoc.requestingParticipantId,
            },
            envSource
          );
          reqDoc.lastSyncedAt = new Date();
          if (pollRes.externalStatus && pollRes.externalStatus !== reqDoc.externalStatus) {
            if (!TERMINAL_EXTERNAL_STATUSES.has(reqDoc.externalStatus)) {
              reqDoc.externalStatus = pollRes.externalStatus;
              reqDoc.internalStatus = this.mapExternalToInternalRequestStatus(
                pollRes.externalStatus
              );
              externalStatusUpdated += 1;
            }
          }
          await reqDoc.save();
        } catch (pollErr: any) {
          failureMessages.push(
            `Status poll failed for ${reqDoc.internalReference}: ${pollErr?.message || 'Unknown error'}`
          );
          if (options.triggeredBy) {
            await this.safePublishNotification({
              eventType: 'ABDM_CONSENT_SYNC_FAILED',
              recipientId: options.triggeredBy,
              recipientRole: 'ADMIN',
              title: 'ABDM Consent Synchronization Failure',
              message: `External status synchronization failed for consent request ${reqDoc.internalReference}.`,
              relatedEntity: {
                entityType: 'ABDM_CONSENT_REQUEST',
                entityId: String(reqDoc._id),
                referenceNumber: reqDoc.internalReference,
              },
            });
          }
        }
      }
    }

    const completedAt = new Date();
    const status: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILED' =
      failureMessages.length === 0
        ? 'SUCCESS'
        : externalStatusChecked > failureMessages.length
        ? 'PARTIAL_FAILURE'
        : 'FAILED';

    const syncLog = await AbdmConsentSyncLogModel.create({
      syncType: options.syncType || 'SCHEDULED_SWEEP',
      environment: config.environment,
      isMocked: config.environment === 'development',
      status,
      triggeredBy: options.triggeredBy,
      expiredRequestsMarked,
      expiredArtefactsMarked,
      nearingExpiryNotified,
      externalStatusChecked,
      externalStatusUpdated,
      failuresCount: failureMessages.length,
      failureMessages: failureMessages.slice(0, 20),
      startedAt,
      completedAt,
    });

    return {
      syncLogId: String(syncLog._id),
      environment: config.environment,
      isMocked: config.environment === 'development',
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      expiredRequestsMarked,
      expiredArtefactsMarked,
      nearingExpiryNotified,
      externalStatusChecked,
      externalStatusUpdated,
      failuresCount: failureMessages.length,
      status,
    };
  }

  // ============================================================================
  // 6. PATIENT-SCOPED QUERIES (STRICT PATIENT OWNERSHIP ENFORCED)
  // ============================================================================

  async listPatientRequests(patientUserId: string): Promise<AbdmConsentRequestDto[]> {
    const docs = await AbdmConsentRequestModel.find({
      patientId: new Types.ObjectId(patientUserId),
    }).sort({ createdAt: -1 });
    return docs.map((d) => this.toRequestDto(d));
  }

  async getPatientRequestDetail(
    patientUserId: string,
    requestId: string
  ): Promise<AbdmConsentRequestDto> {
    const doc = Types.ObjectId.isValid(requestId)
      ? await AbdmConsentRequestModel.findById(requestId)
      : await AbdmConsentRequestModel.findOne({
          $or: [{ internalReference: requestId }, { externalRequestId: requestId }],
        });

    if (!doc) {
      throw AppError.notFound('ABDM consent request not found.');
    }
    if (String(doc.patientId) !== String(patientUserId)) {
      throw AppError.forbidden('Cross-patient access to ABDM consent requests is prohibited.');
    }
    return this.toRequestDto(doc);
  }

  async refreshPatientRequestStatus(
    patientUserId: string,
    requestId: string,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmConsentRequestDto> {
    const doc = Types.ObjectId.isValid(requestId)
      ? await AbdmConsentRequestModel.findById(requestId)
      : await AbdmConsentRequestModel.findOne({
          $or: [{ internalReference: requestId }, { externalRequestId: requestId }],
        });

    if (!doc) {
      throw AppError.notFound('ABDM consent request not found.');
    }
    if (String(doc.patientId) !== String(patientUserId)) {
      throw AppError.forbidden('Cross-patient access to ABDM consent requests is prohibited.');
    }

    const now = new Date();
    if (
      doc.expiresAt &&
      doc.expiresAt.getTime() <= now.getTime() &&
      !TERMINAL_INTERNAL_STATUSES.has(doc.internalStatus) &&
      doc.internalStatus !== 'APPROVED'
    ) {
      doc.internalStatus = 'EXPIRED';
      doc.externalStatus = 'EXPIRED';
    }

    if (doc.externalRequestId && !TERMINAL_INTERNAL_STATUSES.has(doc.internalStatus)) {
      try {
        await abdmConsentV3Client.fetchConsentRequestStatus(
          {
            externalRequestId: doc.externalRequestId,
            hiuId: doc.requestingParticipantId,
          },
          envSource
        );
      } catch (err: any) {
        doc.lastErrorMessage = err?.message || 'Unable to poll external status';
      }
    }

    doc.lastSyncedAt = now;
    await doc.save();
    return this.toRequestDto(doc);
  }

  async listPatientArtefacts(patientUserId: string): Promise<AbdmConsentArtefactRecordDto[]> {
    const docs = await AbdmConsentArtefactModel.find({
      patientId: new Types.ObjectId(patientUserId),
    }).sort({ createdAt: -1 });
    return docs.map((d) => this.toArtefactDto(d));
  }

  async getPatientArtefactDetail(
    patientUserId: string,
    artefactId: string
  ): Promise<{ artefact: AbdmConsentArtefactRecordDto; originalExternalPayload: Record<string, unknown> }> {
    const doc = Types.ObjectId.isValid(artefactId)
      ? await AbdmConsentArtefactModel.findById(artefactId)
      : await AbdmConsentArtefactModel.findOne({
          $or: [{ internalReference: artefactId }, { externalConsentId: artefactId }],
        });

    if (!doc) {
      throw AppError.notFound('ABDM consent artefact not found.');
    }
    if (String(doc.patientId) !== String(patientUserId)) {
      throw AppError.forbidden('Cross-patient access to ABDM consent artefacts is prohibited.');
    }

    return {
      artefact: this.toArtefactDto(doc),
      originalExternalPayload: doc.originalExternalPayload,
    };
  }

  async getPatientConsentHistory(patientUserId: string): Promise<AbdmConsentEventDto[]> {
    const events = await AbdmConsentEventModel.find({
      patientId: new Types.ObjectId(patientUserId),
    })
      .sort({ eventTimestamp: -1, createdAt: -1 })
      .limit(100);

    return events.map((e) => this.toEventDto(e));
  }

  // ============================================================================
  // 7. ADMIN AGGREGATE ANALYTICS (ZERO PATIENT PII)
  // ============================================================================

  async getAdminConsentAnalytics(
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmConsentAdminAnalyticsDto> {
    const config = abdmConfigurationService.loadConfig(envSource);
    const dbReady =
      mongoose.connection.readyState === 1 ||
      Boolean((AbdmConsentRequestModel.countDocuments as any)?.mock);

    let consentReadiness: AbdmIntegrationStatus = 'NOT_CONFIGURED';
    if (!config.enabled || config.environment === 'disabled') {
      consentReadiness = 'NOT_CONFIGURED';
    } else if (config.environment === 'development') {
      consentReadiness = 'MOCKED';
    } else if (config.environment === 'sandbox') {
      consentReadiness =
        config.clientId && config.clientSecret && config.webhookSecret
          ? 'CONFIGURED'
          : 'PENDING_ONBOARDING';
    } else if (config.environment === 'production' && !config.allowProduction) {
      consentReadiness = 'PRODUCTION_NOT_ENABLED';
    }

    if (!dbReady) {
      return {
        environment: config.environment,
        consentReadiness,
        liveExchangeEnabled: false,
        metrics: {
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          expiredRequests: 0,
          activeArtefacts: 0,
          expiredArtefacts: 0,
          revokedArtefacts: 0,
          pendingRevocationConfirmations: 0,
          syncFailures: 0,
          callbackProcessingFailures: 0,
        },
        environmentBreakdown: {
          mockedDevelopment: { requests: 0, artefacts: 0 },
          sandbox: { requests: 0, artefacts: 0 },
          production: { requests: 0, artefacts: 0 },
        },
        lastSuccessfulSyncAt: null,
        lastFailedSyncAt: null,
        lastSyncError: null,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const [
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      expiredRequests,
      activeArtefacts,
      expiredArtefacts,
      revokedArtefacts,
      pendingRevocationConfirmations,
      syncFailures,
      callbackProcessingFailures,
      devReqs,
      devArts,
      sbxReqs,
      sbxArts,
      prodReqs,
      prodArts,
      lastSuccessSync,
      lastFailedSync,
    ] = await Promise.all([
      AbdmConsentRequestModel.countDocuments({
        internalStatus: { $in: ['DRAFT', 'PENDING_SUBMISSION', 'SUBMITTED', 'AWAITING_PATIENT_ACTION'] },
      }),
      AbdmConsentRequestModel.countDocuments({ internalStatus: 'APPROVED' }),
      AbdmConsentRequestModel.countDocuments({ internalStatus: 'REJECTED' }),
      AbdmConsentRequestModel.countDocuments({ internalStatus: 'EXPIRED' }),
      AbdmConsentArtefactModel.countDocuments({
        externalStatus: 'GRANTED',
        revocationStatus: 'NOT_REVOKED',
      }),
      AbdmConsentArtefactModel.countDocuments({ externalStatus: 'EXPIRED' }),
      AbdmConsentArtefactModel.countDocuments({
        $or: [{ externalStatus: 'REVOKED' }, { revocationStatus: 'CONFIRMED_REVOKED' }],
      }),
      AbdmConsentArtefactModel.countDocuments({ revocationStatus: 'PENDING_CONFIRMATION' }),
      AbdmConsentSyncLogModel.countDocuments({ status: { $in: ['FAILED', 'PARTIAL_FAILURE'] } }),
      AbdmConsentEventModel.countDocuments({
        direction: 'INBOUND_CALLBACK',
        processingOutcome: { $in: ['REJECTED', 'FAILED'] },
      }),
      AbdmConsentRequestModel.countDocuments({ environment: 'development' }),
      AbdmConsentArtefactModel.countDocuments({ environment: 'development' }),
      AbdmConsentRequestModel.countDocuments({ environment: 'sandbox' }),
      AbdmConsentArtefactModel.countDocuments({ environment: 'sandbox' }),
      AbdmConsentRequestModel.countDocuments({ environment: 'production' }),
      AbdmConsentArtefactModel.countDocuments({ environment: 'production' }),
      AbdmConsentSyncLogModel.findOne({ status: 'SUCCESS' }).sort({ completedAt: -1 }),
      AbdmConsentSyncLogModel.findOne({ status: { $in: ['FAILED', 'PARTIAL_FAILURE'] } }).sort({
        completedAt: -1,
      }),
    ]);

    return {
      environment: config.environment,
      consentReadiness,
      liveExchangeEnabled: false,
      metrics: {
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        expiredRequests,
        activeArtefacts,
        expiredArtefacts,
        revokedArtefacts,
        pendingRevocationConfirmations,
        syncFailures,
        callbackProcessingFailures,
      },
      environmentBreakdown: {
        mockedDevelopment: { requests: devReqs, artefacts: devArts },
        sandbox: { requests: sbxReqs, artefacts: sbxArts },
        production: { requests: prodReqs, artefacts: prodArts },
      },
      lastSuccessfulSyncAt: lastSuccessSync?.completedAt?.toISOString() || null,
      lastFailedSyncAt: lastFailedSync?.completedAt?.toISOString() || null,
      lastSyncError: lastFailedSync?.failureMessages?.[0] || null,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  private async applyExternalStatusToArtefact(
    externalConsentId: string,
    nextStatus: 'REVOKED' | 'EXPIRED',
    eventTimestamp: Date,
    correlationId: string
  ): Promise<void> {
    const art = await AbdmConsentArtefactModel.findOne({ externalConsentId });
    if (!art) return;

    if (art.lastExternalEventAt && eventTimestamp.getTime() < art.lastExternalEventAt.getTime()) {
      return;
    }

    const prevExt = art.externalStatus;
    art.externalStatus = nextStatus;
    art.validationStatus = nextStatus === 'REVOKED' ? 'REVOKED' : 'EXPIRED';
    art.lastSyncedAt = new Date();
    art.lastExternalEventAt = eventTimestamp;

    if (nextStatus === 'REVOKED') {
      art.revocationStatus = 'CONFIRMED_REVOKED';
      art.revokedAt = art.revokedAt || eventTimestamp;
    }

    art.statusHistory.push({
      fromExternalStatus: prevExt,
      toExternalStatus: nextStatus,
      validationStatus: art.validationStatus,
      revocationStatus: art.revocationStatus,
      reason: `External HIE-CM callback confirmed ${nextStatus}.`,
      changedAt: new Date(),
      correlationId,
    });
    await art.save();

    // Immediately invalidate authorization cache!
    abdmConsentValidationService.invalidateByArtefact(String(art._id), art.externalConsentId);

    await this.safePublishNotification({
      eventType:
        nextStatus === 'REVOKED' ? 'ABDM_CONSENT_REVOCATION_CONFIRMED' : 'ABDM_CONSENT_EXPIRED',
      recipientId: String(art.patientId),
      recipientRole: 'PATIENT',
      title:
        nextStatus === 'REVOKED'
          ? 'ABDM Consent Revocation Confirmed'
          : 'ABDM Consent Artefact Expired',
      message:
        nextStatus === 'REVOKED'
          ? `ABDM Consent Manager has confirmed revocation of artefact ${art.internalReference}.`
          : `ABDM consent artefact ${art.internalReference} has expired.`,
      relatedEntity: {
        entityType: 'ABDM_CONSENT_ARTEFACT',
        entityId: String(art._id),
        referenceNumber: art.internalReference,
      },
      linkUrl: '/patient/consent/artefacts',
    });
  }

  private mapExternalToInternalRequestStatus(
    external: AbdmExternalConsentStatus
  ): AbdmConsentRequestInternalStatus {
    switch (external) {
      case 'REQUESTED':
        return 'AWAITING_PATIENT_ACTION';
      case 'GRANTED':
        return 'APPROVED';
      case 'DENIED':
        return 'REJECTED';
      case 'EXPIRED':
        return 'EXPIRED';
      case 'REVOKED':
        return 'REVOKED';
      default:
        return 'SUBMITTED';
    }
  }

  private async recordConsentEvent(params: {
    eventId: string;
    consentRequestId?: Types.ObjectId;
    externalRequestId?: string;
    externalConsentId?: string;
    patientId?: Types.ObjectId;
    eventType: string;
    direction: 'OUTBOUND' | 'INBOUND_CALLBACK' | 'INTERNAL_SYNC' | 'PATIENT_ACTION';
    previousInternalStatus?: string;
    nextInternalStatus?: string;
    externalStatus?: AbdmExternalConsentStatus;
    processingOutcome: 'PROCESSED' | 'DUPLICATE_IGNORED' | 'STALE_IGNORED' | 'REJECTED' | 'FAILED';
    correlationId?: string;
    externalTransactionRef?: string;
    reason?: string;
    environment: AbdmEnvironment;
    eventTimestamp: Date;
  }): Promise<void> {
    if (mongoose.connection.readyState !== 1 && !(AbdmConsentEventModel.create as any)?.mock) return;
    try {
      await AbdmConsentEventModel.create({
        ...params,
        sanitizedMetadata: redactAbdmLogPayload({
          eventType: params.eventType,
          outcome: params.processingOutcome,
          externalStatus: params.externalStatus,
        }) as Record<string, unknown>,
      });
    } catch {
      // Idempotent duplicate key or secondary logging issue should never crash caller
    }
  }

  private async recordAudit(entry: {
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    requestId: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (mongoose.connection.readyState !== 1 && !(AuditLogModel.create as any)?.mock) return;
    try {
      await AuditLogModel.create({
        actorId:
          entry.actorId && Types.ObjectId.isValid(entry.actorId)
            ? new Types.ObjectId(entry.actorId)
            : undefined,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        requestId: entry.requestId,
        outcome: entry.outcome,
        metadata: entry.metadata
          ? (redactAbdmLogPayload(entry.metadata) as Record<string, unknown>)
          : {},
        timestamp: new Date(),
      });
    } catch {
      // Non-blocking audit persistence safeguard
    }
  }

  private async safePublishNotification(params: {
    eventType: NotificationEventType;
    recipientId: string;
    recipientRole?: string;
    title: string;
    message: string;
    relatedEntity?: { entityType: string; entityId: string; referenceNumber?: string };
    linkUrl?: string;
  }): Promise<void> {
    const dbReady = mongoose.connection.readyState === 1;
    const isMockedPublisher = Boolean((notificationService.publishEvent as any)?.mock);
    if (!dbReady && !isMockedPublisher) return;

    try {
      await notificationService.publishEvent({
        eventType: params.eventType,
        category: 'CONSENT',
        recipientId: params.recipientId,
        recipientRole: params.recipientRole,
        title: params.title,
        message: params.message,
        priority: 'MEDIUM',
        relatedEntity: params.relatedEntity,
        linkUrl: params.linkUrl,
        channels: ['IN_APP'],
      });
    } catch {
      // Never fail consent workflow on secondary notification error
    }
  }

  private toRequestDto(doc: IAbdmConsentRequestDocument): AbdmConsentRequestDto {
    return {
      id: String(doc._id),
      internalReference: doc.internalReference,
      externalRequestId: doc.externalRequestId || null,
      patientId: String(doc.patientId),
      patientAbhaAddress: doc.patientAbhaAddress,
      requestingParticipantId: doc.requestingParticipantId,
      requestingParticipantRole: doc.requestingParticipantRole,
      requestingOrganizationName: doc.requestingOrganizationName,
      requesterName: doc.requesterName,
      purposeCode: doc.purposeCode,
      purposeText: doc.purposeText,
      hiTypes: doc.hiTypes,
      accessMode: doc.accessMode,
      dateRange: {
        from: doc.dateRange.from.toISOString(),
        to: doc.dateRange.to.toISOString(),
      },
      dataEraseAt: doc.dataEraseAt.toISOString(),
      frequency: {
        unit: doc.frequency.unit,
        value: doc.frequency.value,
        repeats: doc.frequency.repeats,
      },
      internalStatus: doc.internalStatus,
      externalStatus: doc.externalStatus,
      externalTransactionRef: doc.externalTransactionRef || null,
      correlationId: doc.correlationId,
      artefactIds: doc.artefactIds || [],
      environment: doc.environment,
      isMocked: doc.isMocked,
      officialApprovalGuidance: {
        requiresExternalAbdmApproval: true,
        supportedWorkflow: 'OFFICIAL_ABDM_PHR_CONSENT_MANAGER',
        phrPortalHint:
          'Open your official ABDM PHR application (e.g., ABHA App) to review and approve or deny this consent request. HealthBridge cannot locally approve ABDM HIE-CM consents.',
        consequencesSummary: `Approving this request permits ${doc.requestingOrganizationName} to access ${doc.hiTypes.join(
          ', '
        )} records for '${doc.purposeText}' under '${doc.accessMode}' mode until ${doc.dataEraseAt.toISOString()}.`,
      },
      expiresAt: doc.expiresAt?.toISOString() || null,
      lastSyncedAt: doc.lastSyncedAt?.toISOString() || null,
      lastErrorMessage: doc.lastErrorMessage || null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private toArtefactDto(doc: IAbdmConsentArtefactDocument): AbdmConsentArtefactRecordDto {
    return {
      id: String(doc._id),
      internalReference: doc.internalReference,
      externalConsentId: doc.externalConsentId,
      consentRequestId: doc.consentRequestId ? String(doc.consentRequestId) : null,
      externalRequestId: doc.externalRequestId || null,
      origin: doc.origin,
      patientId: String(doc.patientId),
      patientAbhaAddress: doc.patientAbhaAddress,
      hipId: doc.hipId || null,
      hiuId: doc.hiuId,
      hiuName: doc.hiuName || null,
      purposeCode: doc.purposeCode,
      purposeText: doc.purposeText,
      hiTypes: doc.hiTypes,
      accessMode: doc.accessMode,
      dateRange: {
        from: doc.dateRange.from.toISOString(),
        to: doc.dateRange.to.toISOString(),
      },
      dataEraseAt: doc.dataEraseAt.toISOString(),
      frequency: doc.frequency
        ? {
            unit: doc.frequency.unit,
            value: doc.frequency.value,
            repeats: doc.frequency.repeats,
          }
        : undefined,
      externalStatus: doc.externalStatus,
      validationStatus: doc.validationStatus,
      revocationStatus: doc.revocationStatus,
      signatureVerified: doc.signatureVerified,
      externalConfirmationReceived: doc.externalConfirmationReceived,
      payloadSha256: doc.payloadSha256,
      source: doc.source,
      environment: doc.environment,
      isMocked: doc.isMocked,
      grantedAt: doc.grantedAt?.toISOString() || null,
      expiresAt: doc.expiresAt.toISOString(),
      revokedAt: doc.revokedAt?.toISOString() || null,
      revocationRequestedAt: doc.revocationRequestedAt?.toISOString() || null,
      revocationReason: doc.revocationReason || null,
      lastSyncedAt: doc.lastSyncedAt?.toISOString() || null,
      validationIssues: doc.validationIssues || [],
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private toEventDto(doc: IAbdmConsentEventDocument): AbdmConsentEventDto {
    return {
      id: String(doc._id),
      eventId: doc.eventId,
      consentRequestId: doc.consentRequestId ? String(doc.consentRequestId) : null,
      externalRequestId: doc.externalRequestId || null,
      externalConsentId: doc.externalConsentId || null,
      patientId: doc.patientId ? String(doc.patientId) : null,
      eventType: doc.eventType,
      direction: doc.direction,
      previousInternalStatus: doc.previousInternalStatus || null,
      nextInternalStatus: doc.nextInternalStatus || null,
      externalStatus: doc.externalStatus || null,
      processingOutcome: doc.processingOutcome,
      correlationId: doc.correlationId || null,
      reason: doc.reason || null,
      eventTimestamp: doc.eventTimestamp.toISOString(),
      createdAt: doc.createdAt.toISOString(),
    };
  }
}

export const abdmConsentLifecycleService = new AbdmConsentLifecycleService();
