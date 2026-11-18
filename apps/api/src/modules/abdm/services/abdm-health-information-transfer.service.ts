/**
 * HealthBridge India — ABDM Health Information Transfer State Management Service (Day 7 Task 04)
 *
 * Enforces explicit, auditable state transitions across the 15-state HIE lifecycle:
 *   DRAFT -> DISCOVERY_PENDING -> DISCOVERY_COMPLETED -> LINKING_PENDING -> CONSENT_PENDING ->
 *   AUTHORIZED -> REQUEST_SUBMITTED -> TRANSFER_PENDING -> TRANSFER_RECEIVED ->
 *   VALIDATION_PENDING -> COMPLETED | REQUIRES_REVIEW | FAILED | CANCELLED | EXPIRED
 *
 * Guarantees:
 *   - Rejects invalid transitions (`ABDM_INVALID_STATE_TRANSITION`)
 *   - Preserves completed transfer history (terminal states `COMPLETED`, `CANCELLED`, `EXPIRED` cannot be overwritten)
 *   - Handles duplicate and out-of-order callback timestamps idempotently
 */

import { Types } from 'mongoose';
import type {
  AbdmExternalSessionStatus,
  AbdmHealthInformationTransferDto,
  AbdmHieTransferState,
} from '@healthbridge/shared-types';
import {
  AbdmHealthInformationTransferModel,
  type IAbdmHealthInformationTransferDocument,
} from '../models/abdm-health-information-transfer.model';
import { AbdmIntegrationError } from '../errors/abdm-error';

const TERMINAL_STATES = new Set<AbdmHieTransferState>(['COMPLETED', 'CANCELLED', 'EXPIRED']);

const ALLOWED_TRANSITIONS: Record<AbdmHieTransferState, AbdmHieTransferState[]> = {
  DRAFT: ['DISCOVERY_PENDING', 'CONSENT_PENDING', 'AUTHORIZED', 'CANCELLED', 'FAILED'],
  DISCOVERY_PENDING: ['DISCOVERY_COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED'],
  DISCOVERY_COMPLETED: ['LINKING_PENDING', 'CONSENT_PENDING', 'AUTHORIZED', 'CANCELLED'],
  LINKING_PENDING: ['CONSENT_PENDING', 'AUTHORIZED', 'FAILED', 'EXPIRED', 'CANCELLED'],
  CONSENT_PENDING: ['AUTHORIZED', 'FAILED', 'EXPIRED', 'CANCELLED'],
  AUTHORIZED: ['REQUEST_SUBMITTED', 'TRANSFER_PENDING', 'VALIDATION_PENDING', 'FAILED', 'CANCELLED', 'EXPIRED'],
  REQUEST_SUBMITTED: ['TRANSFER_PENDING', 'TRANSFER_RECEIVED', 'FAILED', 'EXPIRED', 'CANCELLED'],
  TRANSFER_PENDING: ['TRANSFER_RECEIVED', 'VALIDATION_PENDING', 'COMPLETED', 'REQUIRES_REVIEW', 'FAILED', 'EXPIRED'],
  TRANSFER_RECEIVED: ['VALIDATION_PENDING', 'COMPLETED', 'REQUIRES_REVIEW', 'FAILED'],
  VALIDATION_PENDING: ['COMPLETED', 'REQUIRES_REVIEW', 'FAILED'],
  REQUIRES_REVIEW: ['COMPLETED', 'FAILED', 'CANCELLED'],
  FAILED: ['TRANSFER_PENDING'], // Controlled retry path only
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

export function mapExternalSessionStatusToTransferState(
  externalStatus: AbdmExternalSessionStatus
): AbdmHieTransferState {
  switch (externalStatus) {
    case 'REQUESTED':
      return 'REQUEST_SUBMITTED';
    case 'ACKNOWLEDGED':
      return 'TRANSFER_PENDING';
    case 'RECEIVED':
      return 'TRANSFER_RECEIVED';
    case 'TRANSFERRED':
      return 'COMPLETED';
    case 'PARTIAL_TRANSFERRED':
      return 'REQUIRES_REVIEW';
    case 'EXPIRED':
      return 'EXPIRED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'REQUIRES_REVIEW';
  }
}

export class AbdmHealthInformationTransferService {
  toDto(doc: IAbdmHealthInformationTransferDocument): AbdmHealthInformationTransferDto {
    return {
      id: String(doc._id),
      internalTransferRef: doc.internalTransferRef,
      externalTransactionId: doc.externalTransactionId,
      healthInformationRequestId: String(doc.healthInformationRequestId),
      role: doc.role,
      direction: doc.direction,
      patientId: String(doc.patientId),
      participantId: doc.participantId,
      consentArtefactId: doc.consentArtefactId,
      externalConsentId: doc.externalConsentId,
      hiTypes: doc.hiTypes,
      status: doc.status,
      externalSessionStatus: doc.externalSessionStatus,
      encryptionApplied: doc.encryptionApplied,
      encryptionProviderMode: doc.encryptionProviderMode,
      totalEntries: doc.totalEntries,
      validatedEntries: doc.validatedEntries,
      importedEntries: doc.importedEntries,
      quarantinedEntries: doc.quarantinedEntries,
      retryCount: doc.retryCount,
      stateHistory: doc.stateHistory || [],
      correlationId: doc.correlationId,
      environment: doc.environment,
      isMocked: doc.isMocked,
      failureCode: doc.failureCode,
      failureReason: doc.failureReason,
      completedAt: doc.completedAt?.toISOString(),
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  canTransition(from: AbdmHieTransferState, to: AbdmHieTransferState): boolean {
    if (from === to) return true;
    return (ALLOWED_TRANSITIONS[from] || []).includes(to);
  }

  async transitionState(params: {
    transfer: IAbdmHealthInformationTransferDocument;
    toState: AbdmHieTransferState;
    externalStatus?: AbdmExternalSessionStatus;
    source: 'LOCAL_WORKFLOW' | 'ABDM_CALLBACK' | 'HIP_DATA_PUSH' | 'ACKNOWLEDGEMENT' | 'REVIEWER';
    reason?: string;
    correlationId?: string;
    eventTimestamp?: Date;
    failureCode?: string;
    failureReason?: string;
  }): Promise<{ transfer: IAbdmHealthInformationTransferDocument; ignored: boolean }> {
    const { transfer, toState } = params;
    const currentState = transfer.status;

    // Duplicate same-state event is idempotent no-op
    if (currentState === toState) {
      return { transfer, ignored: true };
    }

    // Out-of-order older event must never overwrite newer state
    if (
      params.eventTimestamp &&
      transfer.lastEventTimestamp &&
      params.eventTimestamp < transfer.lastEventTimestamp
    ) {
      return { transfer, ignored: true };
    }

    // Terminal state protection: never overwrite COMPLETED/CANCELLED/EXPIRED history
    if (TERMINAL_STATES.has(currentState)) {
      throw new AbdmIntegrationError({
        message: `Cannot transition transfer '${transfer.internalTransferRef}' out of terminal state '${currentState}' to '${toState}'.`,
        abdmCode: 'ABDM_INVALID_STATE_TRANSITION',
        statusCode: 409,
      });
    }

    if (!this.canTransition(currentState, toState)) {
      throw new AbdmIntegrationError({
        message: `Invalid ABDM transfer state transition from '${currentState}' to '${toState}'.`,
        abdmCode: 'ABDM_INVALID_STATE_TRANSITION',
        statusCode: 409,
      });
    }

    transfer.status = toState;
    if (params.externalStatus) {
      transfer.externalSessionStatus = params.externalStatus;
    }
    if (params.eventTimestamp) {
      transfer.lastEventTimestamp = params.eventTimestamp;
    }
    if (params.failureCode) transfer.failureCode = params.failureCode;
    if (params.failureReason) transfer.failureReason = params.failureReason;
    if (toState === 'COMPLETED') {
      transfer.completedAt = new Date();
    }

    transfer.stateHistory.push({
      fromState: currentState,
      toState,
      externalStatus: params.externalStatus,
      source: params.source,
      reason: params.reason,
      correlationId: params.correlationId || transfer.correlationId,
      occurredAt: (params.eventTimestamp || new Date()).toISOString(),
    });

    await transfer.save();
    return { transfer, ignored: false };
  }

  async getTransferById(
    transferId: string,
    actorId: string,
    actorRole: string
  ): Promise<AbdmHealthInformationTransferDto> {
    if (!Types.ObjectId.isValid(transferId)) {
      throw new AbdmIntegrationError({
        message: 'Invalid ABDM transfer ID.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 400,
      });
    }
    const doc = await AbdmHealthInformationTransferModel.findById(transferId);
    if (!doc) {
      throw new AbdmIntegrationError({
        message: 'ABDM transfer not found.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 404,
      });
    }
    if (actorRole === 'PATIENT' && String(doc.patientId) !== actorId) {
      throw new AbdmIntegrationError({
        message: 'Forbidden: cannot view another patient ABDM transfer history.',
        abdmCode: 'ABDM_PARTICIPANT_UNAUTHORIZED',
        statusCode: 403,
      });
    }
    return this.toDto(doc);
  }

  async listTransfers(
    actorId: string,
    actorRole: string,
    filters?: { role?: 'HIP' | 'HIU'; patientId?: string }
  ): Promise<AbdmHealthInformationTransferDto[]> {
    const query: Record<string, unknown> = {};
    if (filters?.role) query.role = filters.role;
    if (actorRole === 'PATIENT') {
      query.patientId = new Types.ObjectId(actorId);
    } else if (filters?.patientId && Types.ObjectId.isValid(filters.patientId)) {
      query.patientId = new Types.ObjectId(filters.patientId);
    }
    const docs = await AbdmHealthInformationTransferModel.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    return docs.map((d) => this.toDto(d));
  }
}

export const abdmHealthInformationTransferService = new AbdmHealthInformationTransferService();
