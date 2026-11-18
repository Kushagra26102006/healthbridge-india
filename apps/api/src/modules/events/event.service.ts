/**
 * HealthBridge India — Admin Event Observability & Controlled Recovery Service (Day 8 Task 03)
 *
 * Strictly exposes redacted operational metrics and metadata to authorized ADMIN actors.
 * NEVER exposes raw patient clinical data or arbitrary event-publishing endpoints.
 */

import type {
  DomainEventOutboxDto,
  DomainEventSourceModule,
  DomainEventStatus,
  DomainEventType,
  EventAdminListResponseDto,
  EventHealthMetricsDto,
  EventReplayResponseDto,
  EventWorkerHeartbeatDto,
} from '@healthbridge/shared-types';
import { AppError } from '../../shared/errors/app-error';
import { OutboxEventModel } from './models/outbox-event.model';
import { WorkerHeartbeatModel } from './models/worker-heartbeat.model';
import { eventRepository } from './event.repository';
import { eventDeadLetterService } from './event.dead-letter';
import { mapOutboxEventToAdminDto } from './event.schema';
import { defaultEventWorker } from './event.processor';

const STALE_WORKER_THRESHOLD_MS = 60_000;

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface ListAdminEventsInput {
  search?: string;
  status?: DomainEventStatus;
  eventType?: DomainEventType;
  sourceModule?: DomainEventSourceModule;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export class EventObservabilityService {
  /**
   * Returns aggregate queue health, average processing duration, retry volume,
   * failure rate, worker heartbeats, and honest MongoDB transaction topology capability.
   */
  async getHealthMetrics(): Promise<EventHealthMetricsDto> {
    const [statusAgg, durationAgg, workerDocs] = await Promise.all([
      OutboxEventModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            retries: { $sum: '$retryCount' },
          },
        },
      ]),
      OutboxEventModel.aggregate([
        { $match: { processingDurationMs: { $exists: true, $gte: 0 } } },
        {
          $group: {
            _id: null,
            avgDurationMs: { $avg: '$processingDurationMs' },
          },
        },
      ]),
      WorkerHeartbeatModel.find({}).sort({ lastHeartbeatAt: -1 }).limit(25).lean(),
    ]);

    const counts = {
      pending: 0,
      processing: 0,
      processed: 0,
      retrying: 0,
      failed: 0,
      deadLetter: 0,
      total: 0,
    };

    let totalRetries = 0;

    for (const row of statusAgg || []) {
      const c = Number(row.count || 0);
      totalRetries += Number(row.retries || 0);
      counts.total += c;
      switch (row._id) {
        case 'PENDING':
          counts.pending = c;
          break;
        case 'PROCESSING':
          counts.processing = c;
          break;
        case 'PROCESSED':
          counts.processed = c;
          break;
        case 'RETRYING':
          counts.retrying = c;
          break;
        case 'FAILED':
          counts.failed = c;
          break;
        case 'DEAD_LETTER':
          counts.deadLetter = c;
          break;
      }
    }

    const terminalOrRetried =
      counts.processed + counts.failed + counts.deadLetter + counts.retrying;
    const failedTotal = counts.failed + counts.deadLetter;
    const handlerFailureRate =
      terminalOrRetried > 0
        ? Number(((failedTotal / terminalOrRetried) * 100).toFixed(2))
        : 0;

    const averageProcessingDurationMs = Number(
      (durationAgg?.[0]?.avgDurationMs || 0).toFixed(2)
    );

    const nowMs = Date.now();
    const workers: EventWorkerHeartbeatDto[] = (workerDocs || []).map((w: any) => {
      const lastBeatMs = w.lastHeartbeatAt ? new Date(w.lastHeartbeatAt).getTime() : 0;
      const isStale = w.status === 'RUNNING' && nowMs - lastBeatMs > STALE_WORKER_THRESHOLD_MS;
      return {
        workerId: w.workerId,
        status: isStale ? 'STALE' : w.status,
        startedAt: w.startedAt ? new Date(w.startedAt).toISOString() : new Date().toISOString(),
        lastHeartbeatAt: w.lastHeartbeatAt
          ? new Date(w.lastHeartbeatAt).toISOString()
          : new Date().toISOString(),
        processedCount: w.processedCount || 0,
        failedCount: w.failedCount || 0,
        activeLeaseCount: w.activeLeaseCount || 0,
        pollIntervalMs: w.pollIntervalMs || 2000,
        batchSize: w.batchSize || 20,
      };
    });

    if (workers.length === 0) {
      workers.push(defaultEventWorker.getLocalHealth());
    }

    return {
      counts,
      averageProcessingDurationMs,
      totalRetries,
      handlerFailureRate,
      topologyTransactionSupport: eventRepository.detectTransactionSupport(),
      workers,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Lists paginated, filtered, strictly redacted outbox events for authorized ADMIN inspection.
   */
  async listEvents(input: ListAdminEventsInput): Promise<EventAdminListResponseDto> {
    const query: Record<string, unknown> = {};

    if (input.status) query.status = input.status;
    if (input.eventType) query.eventType = input.eventType;
    if (input.sourceModule) query.sourceModule = input.sourceModule;

    if (input.from || input.to) {
      const range: Record<string, Date> = {};
      if (input.from) range.$gte = new Date(input.from);
      if (input.to) range.$lte = new Date(input.to);
      query.createdAt = range;
    }

    if (input.search && input.search.trim()) {
      const reg = new RegExp(escapeRegex(input.search.trim().slice(0, 100)), 'i');
      query.$or = [
        { eventId: reg },
        { correlationId: reg },
        { aggregateId: reg },
        { eventType: reg },
      ];
    }

    const skip = (input.page - 1) * input.limit;

    const [docs, total] = await Promise.all([
      OutboxEventModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(input.limit)
        .lean(),
      OutboxEventModel.countDocuments(query),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / input.limit);

    return {
      events: (docs || []).map((doc) => mapOutboxEventToAdminDto(doc)),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages,
        hasNext: totalPages > 0 && input.page < totalPages,
        hasPrev: input.page > 1 && totalPages > 0,
      },
    };
  }

  async getEventDetail(eventId: string): Promise<DomainEventOutboxDto> {
    const doc = await OutboxEventModel.findOne({ eventId }).lean();
    if (!doc) {
      throw AppError.notFound(`Domain event '${eventId}' not found.`);
    }
    const executions = await eventRepository.getHandlerExecutions(eventId);
    return mapOutboxEventToAdminDto(doc, executions);
  }

  async replayEvent(params: {
    eventId: string;
    actorId: string;
    actorRole: string;
    reason: string;
  }): Promise<EventReplayResponseDto> {
    return eventDeadLetterService.replayFailedOrDeadLetterEvent(params);
  }
}

export const eventObservabilityService = new EventObservabilityService();
