/**
 * HealthBridge India — ABDM Transfer Acknowledgement Service (Day 7 Task 04)
 *
 * Processes inbound and outbound ABDM V3 transfer acknowledgements (`health-information/notify`,
 * `hip/on-request`, `hiu/on-request`) idempotently, mapping verified external session statuses
 * (`ACKNOWLEDGED | TRANSFERRED | PARTIAL_TRANSFERRED | RECEIVED | FAILED | EXPIRED`) into
 * internal transfer states without overwriting completed transfer history.
 */

import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import type {
  AbdmExternalHiStatus,
  AbdmExternalSessionStatus,
  AbdmHieParticipantRole,
  AbdmTransferAcknowledgementDto,
} from '@healthbridge/shared-types';
import {
  AbdmTransferAcknowledgementModel,
  type IAbdmTransferAcknowledgementDocument,
} from '../models/abdm-transfer-acknowledgement.model';
import { AbdmHealthInformationTransferModel } from '../models/abdm-health-information-transfer.model';
import {
  abdmHealthInformationTransferService,
  mapExternalSessionStatusToTransferState,
} from './abdm-health-information-transfer.service';
import { abdmHieV3Client } from '../clients/abdm-hie-v3.client';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AbdmIntegrationError } from '../errors/abdm-error';

export interface RecordAcknowledgementInput {
  acknowledgementRef?: string;
  externalTransactionId: string;
  role: AbdmHieParticipantRole;
  ackType:
    | 'REQUEST_RECEIVED'
    | 'TRANSFER_INITIATED'
    | 'TRANSFER_ACCEPTED'
    | 'TRANSFER_COMPLETED'
    | 'TRANSFER_REJECTED'
    | 'TRANSFER_FAILED';
  externalSessionStatus: AbdmExternalSessionStatus;
  careContextStatuses: Array<{
    careContextReference: string;
    hiStatus: AbdmExternalHiStatus;
    description?: string;
  }>;
  failureCategory?: string;
  timestamp?: string;
  sendOutboundNotify?: boolean;
  notifierId?: string;
}

export class AbdmTransferAcknowledgementService {
  private toDto(
    doc: IAbdmTransferAcknowledgementDocument,
    duplicate = false
  ): AbdmTransferAcknowledgementDto {
    return {
      id: String(doc._id),
      acknowledgementRef: doc.acknowledgementRef,
      transferId: String(doc.transferId),
      externalTransactionId: doc.externalTransactionId,
      role: doc.role,
      ackType: doc.ackType,
      externalSessionStatus: doc.externalSessionStatus,
      careContextStatuses: doc.careContextStatuses || [],
      failureCategory: doc.failureCategory,
      correlationId: doc.correlationId,
      duplicate,
      acknowledgedAt: doc.acknowledgedAt.toISOString(),
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async processAcknowledgement(
    input: RecordAcknowledgementInput,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<AbdmTransferAcknowledgementDto> {
    const ackRef = input.acknowledgementRef || `ACK-${crypto.randomUUID().slice(0, 12).toUpperCase()}`;

    // Idempotency check
    const existing = await AbdmTransferAcknowledgementModel.findOne({
      acknowledgementRef: ackRef,
      externalTransactionId: input.externalTransactionId,
      ackType: input.ackType,
    });
    if (existing) {
      return this.toDto(existing, true);
    }

    const transfer = await AbdmHealthInformationTransferModel.findOne({
      externalTransactionId: input.externalTransactionId,
      role: input.role,
    });
    if (!transfer) {
      throw new AbdmIntegrationError({
        message: `Unknown ABDM transfer transaction '${input.externalTransactionId}' for role '${input.role}'.`,
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }

    const eventTime = input.timestamp ? new Date(input.timestamp) : new Date();
    const ackDoc = await AbdmTransferAcknowledgementModel.create({
      acknowledgementRef: ackRef,
      transferId: transfer._id,
      externalTransactionId: input.externalTransactionId,
      role: input.role,
      ackType: input.ackType,
      externalSessionStatus: input.externalSessionStatus,
      careContextStatuses: input.careContextStatuses,
      failureCategory: input.failureCategory,
      correlationId: transfer.correlationId,
      acknowledgedAt: eventTime,
    });

    // Map external status to internal state while respecting completed transfer immutability
    const targetState = mapExternalSessionStatusToTransferState(input.externalSessionStatus);
    if (
      transfer.status !== 'COMPLETED' &&
      transfer.status !== 'CANCELLED' &&
      transfer.status !== 'EXPIRED' &&
      abdmHealthInformationTransferService.canTransition(transfer.status, targetState)
    ) {
      await abdmHealthInformationTransferService.transitionState({
        transfer,
        toState: targetState,
        externalStatus: input.externalSessionStatus,
        source: 'ACKNOWLEDGEMENT',
        reason: `Acknowledgement ${input.ackType} (${input.externalSessionStatus})`,
        correlationId: transfer.correlationId,
        eventTimestamp: eventTime,
        failureCode: input.failureCategory,
      });
    }

    if (input.sendOutboundNotify) {
      await abdmHieV3Client.notifyHealthInfoTransfer(
        {
          transactionId: input.externalTransactionId,
          consentId: transfer.externalConsentId,
          notifierType: input.role,
          notifierId: input.notifierId || transfer.participantId,
          sessionStatus: input.externalSessionStatus,
          statusResponses: input.careContextStatuses,
        },
        envSource
      );
    }

    if (mongoose.connection.readyState === 1) {
      await AuditLogModel.create({
        userId: transfer.patientId,
        action: 'ABDM_TRANSFER_ACKNOWLEDGEMENT_PROCESSED',
        resource: 'ABDM_TRANSFER_ACKNOWLEDGEMENT',
        resourceId: String(ackDoc._id),
        status: input.ackType === 'TRANSFER_FAILED' || input.ackType === 'TRANSFER_REJECTED' ? 'FAILURE' : 'SUCCESS',
        metadata: {
          acknowledgementRef: ackRef,
          transferId: String(transfer._id),
          role: input.role,
          ackType: input.ackType,
          externalSessionStatus: input.externalSessionStatus,
          failureCategory: input.failureCategory,
          correlationId: transfer.correlationId,
        },
      }).catch(() => undefined);
    }

    return this.toDto(ackDoc, false);
  }

  async listByTransfer(transferId: string): Promise<AbdmTransferAcknowledgementDto[]> {
    if (!Types.ObjectId.isValid(transferId)) return [];
    const docs = await AbdmTransferAcknowledgementModel.find({
      transferId: new Types.ObjectId(transferId),
    }).sort({ createdAt: -1 });
    return docs.map((d) => this.toDto(d, false));
  }
}

export const abdmTransferAcknowledgementService = new AbdmTransferAcknowledgementService();
