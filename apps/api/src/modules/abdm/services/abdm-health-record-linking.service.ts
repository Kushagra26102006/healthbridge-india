/**
 * HealthBridge India — ABDM Health Record (Care Context) Linking Service (Day 7 Task 04)
 *
 * Strictly separates:
 *   1. ABHA identity linking (`AbhaLinkModel`)
 *   2. Care-context / health-record linking (`AbdmLinkedHealthRecordModel`)
 *   3. Consent authorization (`AbdmConsentArtefactModel`)
 *   4. Health information transfer (`AbdmHealthInformationTransferModel`)
 *
 * Having an ABHA link NEVER automatically links health records, and linking a health record
 * NEVER authorizes retrieval of clinical bundles without a validated ABDM Consent Artefact.
 */

import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import type {
  AbdmHealthInfoType,
  AbdmLinkedHealthRecordDto,
} from '@healthbridge/shared-types';
import { abdmConfigurationService } from './abdm-configuration.service';
import { abdmCorrelationService } from './abdm-correlation.service';
import { abdmHieV3Client } from '../clients/abdm-hie-v3.client';
import {
  AbdmLinkedHealthRecordModel,
  type IAbdmLinkedHealthRecordDocument,
} from '../models/abdm-linked-health-record.model';
import { AbhaLinkModel } from '../models/abha-link.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { NotificationModel } from '../../notifications/models/notification.model';
import { AbdmIntegrationError } from '../errors/abdm-error';

export interface InitiateRecordLinkingInput {
  actorId: string;
  actorRole: string;
  patientId?: string;
  discoveryId?: string;
  participantId: string;
  participantName?: string;
  careContextReference: string;
  careContextDisplay: string;
  hiTypes: AbdmHealthInfoType[];
  linkMode: 'USER_INITIATED' | 'HIP_INITIATED';
}

export interface ConfirmRecordLinkingInput {
  linkId: string;
  actorId: string;
  actorRole: string;
  otpToken?: string;
  externalLinkRef?: string;
  confirmed: boolean;
  failureReason?: string;
}

export class AbdmHealthRecordLinkingService {
  private toDto(doc: IAbdmLinkedHealthRecordDocument): AbdmLinkedHealthRecordDto {
    return {
      id: String(doc._id),
      internalLinkRef: doc.internalLinkRef,
      externalLinkRef: doc.externalLinkRef,
      externalTransactionRef: doc.externalTransactionRef,
      patientId: String(doc.patientId),
      participantId: doc.participantId,
      participantName: doc.participantName,
      careContextReference: doc.careContextReference,
      careContextDisplay: doc.careContextDisplay,
      hiTypes: doc.hiTypes,
      linkMode: doc.linkMode,
      status: doc.status,
      unlinkScope: doc.unlinkScope,
      unlinkedAt: doc.unlinkedAt?.toISOString(),
      unlinkReason: doc.unlinkReason,
      correlationId: doc.correlationId,
      environment: doc.environment,
      isMocked: doc.isMocked,
      linkedAt: doc.linkedAt?.toISOString(),
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  private assertOperational(envSource: NodeJS.ProcessEnv = process.env) {
    const config = abdmConfigurationService.loadConfig(envSource);
    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM health-record linking is unavailable while ABDM integration is disabled.',
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

  async initiateLinking(
    input: InitiateRecordLinkingInput,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmLinkedHealthRecordDto> {
    const config = this.assertOperational(envSource);

    const targetPatientId =
      input.actorRole === 'PATIENT' ? input.actorId : input.patientId || '';
    if (!targetPatientId || !Types.ObjectId.isValid(targetPatientId)) {
      throw new AbdmIntegrationError({
        message: 'Valid patient reference is required for care-context linking.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }
    if (input.actorRole === 'PATIENT' && input.patientId && input.patientId !== input.actorId) {
      throw new AbdmIntegrationError({
        message: 'Patients may only link health records for their own account.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    // Verified ABHA link is required before care-context linking
    const activeAbha = await AbhaLinkModel.findOne({
      patientId: new Types.ObjectId(targetPatientId),
      isActive: true,
      verificationStatus: 'VERIFIED',
    });
    if (!activeAbha) {
      throw new AbdmIntegrationError({
        message: 'Patient must complete ABHA verification before linking external health records.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    // Duplicate prevention
    const duplicate = await AbdmLinkedHealthRecordModel.findOne({
      patientId: new Types.ObjectId(targetPatientId),
      participantId: input.participantId,
      careContextReference: input.careContextReference,
      status: { $in: ['LINKING_PENDING', 'OTP_VERIFICATION_PENDING', 'LINKED'] },
    });
    if (duplicate) {
      throw new AbdmIntegrationError({
        message: `Care context '${input.careContextReference}' from '${input.participantId}' is already linked or pending.`,
        abdmCode: 'ABDM_DUPLICATE_RESOURCE',
        statusCode: 409,
      });
    }

    const requestId = crypto.randomUUID();
    const correlationId = abdmCorrelationService.registerOutboundRequest(
      'ABDM_RECORD_LINK_INIT',
      requestId
    ).requestId;
    const internalLinkRef = `LNK-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;

    let externalTransactionRef = `txn-link-${crypto.randomUUID()}`;
    let isMocked = config.environment === 'development';

    if (input.linkMode === 'HIP_INITIATED') {
      const ack = await abdmHieV3Client.submitHipLinkCareContext(
        {
          abhaAddress: activeAbha.abhaAddress || 'verified-abha-patient@sbx',
          hipId: input.participantId,
          hiType: input.hiTypes[0] || 'OPConsultation',
          careContextReference: input.careContextReference,
          careContextDisplay: input.careContextDisplay,
        },
        envSource
      );
      externalTransactionRef = ack.externalTransactionId;
      isMocked = ack.isMocked;
    }

    const doc = await AbdmLinkedHealthRecordModel.create({
      internalLinkRef,
      externalTransactionRef,
      discoveryId:
        input.discoveryId && Types.ObjectId.isValid(input.discoveryId)
          ? new Types.ObjectId(input.discoveryId)
          : undefined,
      patientId: new Types.ObjectId(targetPatientId),
      participantId: input.participantId,
      participantName: input.participantName || input.participantId,
      careContextReference: input.careContextReference,
      careContextDisplay: input.careContextDisplay,
      hiTypes: input.hiTypes,
      linkMode: input.linkMode,
      status:
        input.linkMode === 'USER_INITIATED' ? 'OTP_VERIFICATION_PENDING' : 'LINKING_PENDING',
      correlationId,
      environment: config.environment,
      isMocked,
    });

    await this.writeAudit(input.actorId, 'ABDM_RECORD_LINK_INITIATED', String(doc._id), {
      internalLinkRef,
      participantId: input.participantId,
      careContextReference: input.careContextReference,
      linkMode: input.linkMode,
      environment: config.environment,
      isMocked,
    });

    return this.toDto(doc);
  }

  async confirmLinking(input: ConfirmRecordLinkingInput): Promise<AbdmLinkedHealthRecordDto> {
    if (!Types.ObjectId.isValid(input.linkId)) {
      throw new AbdmIntegrationError({
        message: 'Invalid health-record link ID.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    const doc = await AbdmLinkedHealthRecordModel.findById(input.linkId);
    if (!doc) {
      throw new AbdmIntegrationError({
        message: 'ABDM health-record link not found.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }

    if (input.actorRole === 'PATIENT' && String(doc.patientId) !== input.actorId) {
      throw new AbdmIntegrationError({
        message: 'Forbidden: cannot confirm another patient health-record link.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    if (doc.status === 'LINKED') {
      return this.toDto(doc);
    }

    if (doc.status === 'UNLINKED_LOCALLY' || doc.status === 'FAILED') {
      throw new AbdmIntegrationError({
        message: `Cannot confirm health-record link in terminal state '${doc.status}'.`,
        abdmCode: 'ABDM_INVALID_STATE_TRANSITION',
        statusCode: 409,
      });
    }

    if (!input.confirmed) {
      doc.status = 'FAILED';
      doc.failureReason = input.failureReason || 'Link confirmation rejected';
      await doc.save();
      return this.toDto(doc);
    }

    if (doc.linkMode === 'USER_INITIATED' && !input.otpToken && !input.externalLinkRef) {
      throw new AbdmIntegrationError({
        message: 'OTP token or verified external link reference is required to confirm user-initiated linking.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }

    doc.status = 'LINKED';
    doc.externalLinkRef = input.externalLinkRef || `ext-link-${crypto.randomUUID().slice(0, 8)}`;
    doc.linkedAt = new Date();
    await doc.save();

    await this.writeAudit(input.actorId, 'ABDM_RECORD_LINK_CONFIRMED', String(doc._id), {
      internalLinkRef: doc.internalLinkRef,
      participantId: doc.participantId,
      careContextReference: doc.careContextReference,
    });

    if (mongoose.connection.readyState === 1) {
      await NotificationModel.create({
        userId: doc.patientId,
        category: 'CONSENT',
        eventType: 'ABDM_RECORD_LINKED',
        title: 'Health Record Care Context Linked',
        message: `Care context '${doc.careContextDisplay}' from ${doc.participantName || doc.participantId} is linked. Separate ABDM consent is still required for data sharing.`,
        priority: 'LOW',
        relatedEntity: {
          entityType: 'AbdmLinkedHealthRecord',
          entityId: String(doc._id),
          referenceNumber: doc.internalLinkRef,
        },
      }).catch(() => undefined);
    }

    return this.toDto(doc);
  }

  /**
   * Unlinks a health-record care context locally inside HealthBridge.
   * Explicitly marks `unlinkScope = 'LOCAL_HEALTHBRIDGE_UNLINK_ONLY'` because ABDM V3 does not
   * expose a universal HIU-side remote unlinking API.
   */
  async unlinkRecord(
    linkId: string,
    actorId: string,
    actorRole: string,
    reason: string
  ): Promise<AbdmLinkedHealthRecordDto> {
    if (!Types.ObjectId.isValid(linkId)) {
      throw new AbdmIntegrationError({
        message: 'Invalid health-record link ID.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }
    const doc = await AbdmLinkedHealthRecordModel.findById(linkId);
    if (!doc) {
      throw new AbdmIntegrationError({
        message: 'ABDM health-record link not found.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }
    if (actorRole === 'PATIENT' && String(doc.patientId) !== actorId) {
      throw new AbdmIntegrationError({
        message: 'Forbidden: cannot unlink another patient health-record source.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }
    if (actorRole !== 'PATIENT' && actorRole !== 'ADMIN') {
      throw new AbdmIntegrationError({
        message: 'Only the owning patient or an administrator may unlink a local care-context reference.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }

    doc.status = 'UNLINKED_LOCALLY';
    doc.unlinkScope = 'LOCAL_HEALTHBRIDGE_UNLINK_ONLY';
    doc.unlinkedAt = new Date();
    doc.unlinkedBy = new Types.ObjectId(actorId);
    doc.unlinkReason = reason;
    await doc.save();

    await this.writeAudit(actorId, 'ABDM_RECORD_UNLINKED_LOCALLY', String(doc._id), {
      internalLinkRef: doc.internalLinkRef,
      unlinkScope: 'LOCAL_HEALTHBRIDGE_UNLINK_ONLY',
      reason,
    });

    return this.toDto(doc);
  }

  async getLinkById(
    linkId: string,
    actorId: string,
    actorRole: string
  ): Promise<AbdmLinkedHealthRecordDto> {
    if (!Types.ObjectId.isValid(linkId)) {
      throw new AbdmIntegrationError({
        message: 'Invalid health-record link ID.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }
    const doc = await AbdmLinkedHealthRecordModel.findById(linkId);
    if (!doc) {
      throw new AbdmIntegrationError({
        message: 'ABDM health-record link not found.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }
    if (actorRole === 'PATIENT' && String(doc.patientId) !== actorId) {
      throw new AbdmIntegrationError({
        message: 'Forbidden: cannot access another patient linked record.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }
    return this.toDto(doc);
  }

  async listLinks(
    actorId: string,
    actorRole: string,
    patientIdFilter?: string
  ): Promise<AbdmLinkedHealthRecordDto[]> {
    const query: Record<string, unknown> = {};
    if (actorRole === 'PATIENT') {
      query.patientId = new Types.ObjectId(actorId);
    } else if (patientIdFilter && Types.ObjectId.isValid(patientIdFilter)) {
      query.patientId = new Types.ObjectId(patientIdFilter);
    }
    const docs = await AbdmLinkedHealthRecordModel.find(query).sort({ createdAt: -1 }).limit(100);
    return docs.map((d) => this.toDto(d));
  }

  private async writeAudit(
    userId: string,
    action: string,
    resourceId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    if (mongoose.connection.readyState !== 1) return;
    await AuditLogModel.create({
      userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined,
      action,
      resource: 'ABDM_HEALTH_RECORD_LINK',
      resourceId,
      status: 'SUCCESS',
      metadata,
    }).catch(() => undefined);
  }
}

export const abdmHealthRecordLinkingService = new AbdmHealthRecordLinkingService();
