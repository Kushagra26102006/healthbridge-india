/**
 * HealthBridge India — ABDM Health Information Discovery Service (Day 7 Task 04)
 *
 * Manages care-context discovery sessions separately from ABHA identity linking and
 * Consent Manager authorization. Enforces:
 *   - Verified active ABHA link for the patient (`AbhaLinkModel`)
 *   - Strict actor-derived patient ownership (never trusts client-supplied patientId for PATIENT)
 *   - Idempotent duplicate discovery prevention (`idempotencyKey`)
 *   - Authenticated discovery callback processing
 *   - Immutable `AuditLogModel` logging (zero plaintext clinical data)
 */

import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import type {
  AbdmDiscoveredCareContextDto,
  AbdmDiscoveryRequestDto,
  AbdmDiscoveryStatus,
  AbdmHealthInfoType,
} from '@healthbridge/shared-types';
import { abdmConfigurationService } from './abdm-configuration.service';
import { abdmCorrelationService } from './abdm-correlation.service';
import {
  AbdmDiscoveryRequestModel,
  type IAbdmDiscoveryRequestDocument,
} from '../models/abdm-discovery-request.model';
import { AbdmLinkedHealthRecordModel } from '../models/abdm-linked-health-record.model';
import { AbhaLinkModel } from '../models/abha-link.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { NotificationModel } from '../../notifications/models/notification.model';
import { AbdmIntegrationError } from '../errors/abdm-error';

const ALLOWED_PARTICIPANT_ID_REGEX = /^[A-Za-z0-9._-]{3,120}$/;

export interface InitiateDiscoveryInput {
  actorId: string;
  actorRole: string;
  patientId?: string;
  participantId: string;
  participantName?: string;
  requestedCategories: AbdmHealthInfoType[];
  idempotencyKey?: string;
}

export interface ProcessDiscoveryCallbackInput {
  eventId: string;
  timestamp: string;
  externalTransactionRef: string;
  participantId: string;
  status: 'DISCOVERY_COMPLETED' | 'NO_MATCH_FOUND' | 'FAILED';
  careContexts: AbdmDiscoveredCareContextDto[];
  errorReason?: string;
}

export class AbdmHealthInformationDiscoveryService {
  private toDto(doc: IAbdmDiscoveryRequestDocument): AbdmDiscoveryRequestDto {
    return {
      id: String(doc._id),
      internalDiscoveryRef: doc.internalDiscoveryRef,
      externalTransactionRef: doc.externalTransactionRef,
      patientId: String(doc.patientId),
      initiatingActorId: String(doc.initiatingActorId),
      initiatingActorRole: doc.initiatingActorRole,
      participantId: doc.participantId,
      participantName: doc.participantName,
      participantRole: doc.participantRole,
      requestedCategories: doc.requestedCategories,
      status: doc.status,
      discoveredCareContexts: doc.discoveredCareContexts || [],
      correlationId: doc.correlationId,
      environment: doc.environment,
      isMocked: doc.isMocked,
      failureReason: doc.failureReason,
      expiresAt: doc.expiresAt?.toISOString(),
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  private assertOperational(envSource: NodeJS.ProcessEnv = process.env) {
    const config = abdmConfigurationService.loadConfig(envSource);
    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM health information discovery is unavailable while ABDM integration is disabled.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }
    if (config.environment === 'production' && !config.allowProduction) {
      throw new AbdmIntegrationError({
        message: 'ABDM production mode is locked (ABDM_ALLOW_PRODUCTION=false).',
        abdmCode: 'ABDM_PRODUCTION_LOCKED',
        statusCode: 403,
      });
    }
    return config;
  }

  async initiateDiscovery(
    input: InitiateDiscoveryInput,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmDiscoveryRequestDto> {
    const config = this.assertOperational(envSource);

    // Derive target patient strictly from JWT for PATIENT role
    const targetPatientId =
      input.actorRole === 'PATIENT' ? input.actorId : input.patientId || '';
    if (!targetPatientId || !Types.ObjectId.isValid(targetPatientId)) {
      throw new AbdmIntegrationError({
        message: 'Valid patient reference is required to initiate ABDM care-context discovery.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    if (input.actorRole === 'PATIENT' && input.patientId && input.patientId !== input.actorId) {
      throw new AbdmIntegrationError({
        message: 'Patients may only initiate discovery for their own health records.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    if (!ALLOWED_PARTICIPANT_ID_REGEX.test(input.participantId)) {
      throw new AbdmIntegrationError({
        message: 'Invalid ABDM participant identifier format.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    // Require verified active ABHA link (ABHA linking is a prerequisite, NOT consent!)
    const activeAbhaLink = await AbhaLinkModel.findOne({
      patientId: new Types.ObjectId(targetPatientId),
      isActive: true,
      verificationStatus: 'VERIFIED',
    });
    if (!activeAbhaLink) {
      throw new AbdmIntegrationError({
        message:
          'Patient must have a verified ABHA identity link before discovering external ABDM care contexts.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    // Idempotent duplicate discovery guard
    if (input.idempotencyKey) {
      const existing = await AbdmDiscoveryRequestModel.findOne({
        patientId: new Types.ObjectId(targetPatientId),
        idempotencyKey: input.idempotencyKey,
      });
      if (existing) {
        return this.toDto(existing);
      }
    }

    // Prevent concurrent pending duplicate discovery for same patient + participant
    const pendingDuplicate = await AbdmDiscoveryRequestModel.findOne({
      patientId: new Types.ObjectId(targetPatientId),
      participantId: input.participantId,
      status: 'DISCOVERY_PENDING',
      expiresAt: { $gt: new Date() },
    });
    if (pendingDuplicate) {
      throw new AbdmIntegrationError({
        message: 'A discovery request for this participant is already pending for this patient.',
        abdmCode: 'ABDM_DUPLICATE_RESOURCE',
        statusCode: 409,
      });
    }

    const requestId = crypto.randomUUID();
    const correlationId = abdmCorrelationService.registerOutboundRequest(
      'ABDM_DISCOVERY_INIT',
      requestId
    ).requestId;
    const internalDiscoveryRef = `DISC-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;
    const externalTransactionRef = `txn-disc-${crypto.randomUUID()}`;
    const isMocked = config.environment === 'development';

    const doc = await AbdmDiscoveryRequestModel.create({
      internalDiscoveryRef,
      externalTransactionRef,
      idempotencyKey: input.idempotencyKey,
      patientId: new Types.ObjectId(targetPatientId),
      initiatingActorId: new Types.ObjectId(input.actorId),
      initiatingActorRole: input.actorRole,
      participantId: input.participantId,
      participantName: input.participantName || input.participantId,
      participantRole: 'HIU',
      requestedCategories: input.requestedCategories,
      status: 'DISCOVERY_PENDING',
      discoveredCareContexts: [],
      correlationId,
      environment: config.environment,
      isMocked,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await this.writeAudit({
      userId: input.actorId,
      action: 'ABDM_DISCOVERY_INITIATED',
      resourceId: String(doc._id),
      metadata: {
        internalDiscoveryRef,
        participantId: input.participantId,
        requestedCategories: input.requestedCategories,
        environment: config.environment,
        isMocked,
        correlationId,
      },
    });

    return this.toDto(doc);
  }

  async processDiscoveryCallback(
    input: ProcessDiscoveryCallbackInput
  ): Promise<{ discovery: AbdmDiscoveryRequestDto; duplicate: boolean }> {
    const doc = await AbdmDiscoveryRequestModel.findOne({
      externalTransactionRef: input.externalTransactionRef,
    });
    if (!doc) {
      throw new AbdmIntegrationError({
        message: `Unknown external discovery transaction '${input.externalTransactionRef}'.`,
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }

    // Participant integrity check
    if (doc.participantId !== input.participantId) {
      throw new AbdmIntegrationError({
        message: 'Discovery callback participantId does not match initiating discovery request.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    // Idempotent duplicate / terminal protection
    if (
      doc.status === 'DISCOVERY_COMPLETED' ||
      doc.status === 'NO_MATCH_FOUND' ||
      doc.status === 'FAILED'
    ) {
      return { discovery: this.toDto(doc), duplicate: true };
    }

    const callbackTime = new Date(input.timestamp);
    if (doc.lastCallbackAt && callbackTime < doc.lastCallbackAt) {
      return { discovery: this.toDto(doc), duplicate: true };
    }

    // Check which discovered care contexts are already linked
    const existingLinks = await AbdmLinkedHealthRecordModel.find({
      patientId: doc.patientId,
      participantId: doc.participantId,
      status: 'LINKED',
    }).select('careContextReference');
    const linkedRefs = new Set(existingLinks.map((l) => l.careContextReference));

    const enrichedContexts: AbdmDiscoveredCareContextDto[] = (input.careContexts || []).map(
      (ctx) => ({
        ...ctx,
        alreadyLinked: linkedRefs.has(ctx.careContextReference),
      })
    );

    const nextStatus: AbdmDiscoveryStatus =
      input.status === 'FAILED'
        ? 'FAILED'
        : enrichedContexts.length > 0
          ? 'DISCOVERY_COMPLETED'
          : 'NO_MATCH_FOUND';

    doc.status = nextStatus;
    doc.discoveredCareContexts = enrichedContexts;
    doc.failureReason = input.errorReason;
    doc.lastCallbackAt = callbackTime;
    await doc.save();

    await this.writeAudit({
      userId: String(doc.patientId),
      action: 'ABDM_DISCOVERY_CALLBACK_PROCESSED',
      resourceId: String(doc._id),
      metadata: {
        internalDiscoveryRef: doc.internalDiscoveryRef,
        status: nextStatus,
        discoveredCount: enrichedContexts.length,
        correlationId: doc.correlationId,
      },
    });

    if (nextStatus === 'DISCOVERY_COMPLETED') {
      await this.sendPrivacySafeNotification(
        String(doc.patientId),
        'ABDM_DISCOVERY_COMPLETED',
        'ABDM Care Context Discovery Completed',
        `${enrichedContexts.length} care context(s) discovered at ${doc.participantName || doc.participantId}. Explicit record linking and consent are still required before data exchange.`,
        String(doc._id),
        doc.internalDiscoveryRef
      );
    }

    return { discovery: this.toDto(doc), duplicate: false };
  }

  async getDiscoveryById(
    id: string,
    actorId: string,
    actorRole: string
  ): Promise<AbdmDiscoveryRequestDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AbdmIntegrationError({
        message: 'Invalid discovery request ID.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }
    const doc = await AbdmDiscoveryRequestModel.findById(id);
    if (!doc) {
      throw new AbdmIntegrationError({
        message: 'ABDM discovery request not found.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }
    if (actorRole === 'PATIENT' && String(doc.patientId) !== actorId) {
      throw new AbdmIntegrationError({
        message: 'Forbidden: cannot access another patient discovery record.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }
    return this.toDto(doc);
  }

  async listDiscoveryHistory(
    actorId: string,
    actorRole: string,
    patientIdFilter?: string
  ): Promise<AbdmDiscoveryRequestDto[]> {
    const query: Record<string, unknown> = {};
    if (actorRole === 'PATIENT') {
      query.patientId = new Types.ObjectId(actorId);
    } else if (patientIdFilter && Types.ObjectId.isValid(patientIdFilter)) {
      query.patientId = new Types.ObjectId(patientIdFilter);
    } else if (actorRole !== 'ADMIN') {
      query.initiatingActorId = new Types.ObjectId(actorId);
    }

    const docs = await AbdmDiscoveryRequestModel.find(query).sort({ createdAt: -1 }).limit(50);
    return docs.map((d) => this.toDto(d));
  }

  private async writeAudit(params: {
    userId: string;
    action: string;
    resourceId: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    if (mongoose.connection.readyState !== 1) return;
    await AuditLogModel.create({
      userId: Types.ObjectId.isValid(params.userId) ? new Types.ObjectId(params.userId) : undefined,
      action: params.action,
      resource: 'ABDM_DISCOVERY',
      resourceId: params.resourceId,
      status: 'SUCCESS',
      metadata: params.metadata,
    }).catch(() => undefined);
  }

  private async sendPrivacySafeNotification(
    userId: string,
    eventType: 'ABDM_DISCOVERY_COMPLETED',
    title: string,
    message: string,
    entityId: string,
    referenceNumber: string
  ): Promise<void> {
    if (mongoose.connection.readyState !== 1 || !Types.ObjectId.isValid(userId)) return;
    await NotificationModel.create({
      userId: new Types.ObjectId(userId),
      category: 'CONSENT',
      eventType,
      title,
      message,
      priority: 'MEDIUM',
      relatedEntity: {
        entityType: 'AbdmDiscoveryRequest',
        entityId,
        referenceNumber,
      },
    }).catch(() => undefined);
  }
}

export const abdmHealthInformationDiscoveryService = new AbdmHealthInformationDiscoveryService();
