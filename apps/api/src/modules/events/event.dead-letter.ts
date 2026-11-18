/**
 * HealthBridge India — Dead-Letter Inspection & Controlled Replay Service (Day 8 Task 03)
 *
 * SECURITY & SAFETY INVARIANTS:
 *   1. Preserves original `eventId` and `correlationId` so per-handler idempotency locks
 *      continue preventing duplicate side effects across already-succeeded handlers.
 *   2. Blocks unsafe or obsolete replays (authenticity errors, already-processed events,
 *      in-flight events, or events > 30 days old).
 *   3. Records full replay provenance (`replayHistory`) + `AuditLogModel` entry.
 */

import type { EventReplayResponseDto } from '@healthbridge/shared-types';
import { AppError } from '../../shared/errors/app-error';
import { AuditLogModel } from '../security/models/audit-log.model';
import { OutboxEventModel } from './models/outbox-event.model';
import { isReplayEligible } from './event.retry';
import { logger } from '../../utils/logger';

export class EventDeadLetterService {
  async replayFailedOrDeadLetterEvent(params: {
    eventId: string;
    actorId: string;
    actorRole: string;
    reason: string;
  }): Promise<EventReplayResponseDto> {
    if (params.actorRole !== 'ADMIN') {
      throw AppError.forbidden('Only administrators are authorized to replay domain events.');
    }

    const event = await OutboxEventModel.findOne({ eventId: params.eventId });
    if (!event) {
      throw AppError.notFound(`Domain event '${params.eventId}' was not found.`);
    }

    const eligibility = isReplayEligible({
      status: event.status,
      eventType: event.eventType,
      errorCategory: event.errorCategory,
      createdAt: event.createdAt,
    });

    if (!eligibility.eligible) {
      throw AppError.badRequest(
        eligibility.reason || 'This event is not eligible for replay.'
      );
    }

    const previousStatus = event.status;
    const now = new Date();

    const updated = await OutboxEventModel.findOneAndUpdate(
      {
        eventId: params.eventId,
        status: { $in: ['FAILED', 'DEAD_LETTER'] },
      },
      {
        $set: {
          status: 'PENDING',
          nextRetryAt: now,
          'metadata.lastReplayBy': params.actorId,
          'metadata.lastReplayReason': params.reason,
        },
        $inc: {
          'metadata.replayCount': 1,
        },
        $unset: {
          leaseOwner: 1,
          leaseExpiresAt: 1,
          deadLetteredAt: 1,
        },
        $push: {
          replayHistory: {
            replayedAt: now,
            actorId: params.actorId,
            reason: params.reason,
            previousStatus,
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      throw AppError.conflict(
        'Event status changed concurrently and could not be scheduled for replay.'
      );
    }

    await AuditLogModel.create({
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: 'DOMAIN_EVENT_REPLAYED',
      resourceType: 'OUTBOX_EVENT',
      resourceId: params.eventId,
      timestamp: now,
      outcome: 'SUCCESS',
      metadata: {
        eventType: updated.eventType,
        previousStatus,
        newStatus: 'PENDING',
        replayCount: updated.metadata?.replayCount || 1,
        reason: params.reason,
      },
    }).catch(() => undefined);

    logger.info('Administrator scheduled controlled event replay', {
      eventId: params.eventId,
      eventType: updated.eventType,
      previousStatus,
      replayCount: updated.metadata?.replayCount || 1,
    });

    return {
      eventId: updated.eventId,
      previousStatus,
      newStatus: updated.status,
      replayCount: updated.metadata?.replayCount || 1,
      replayedAt: now.toISOString(),
      message: 'Event re-queued safely for idempotent processing while preserving original event identity.',
    };
  }
}

export const eventDeadLetterService = new EventDeadLetterService();
