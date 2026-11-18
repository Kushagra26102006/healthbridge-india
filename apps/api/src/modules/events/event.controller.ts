/**
 * HealthBridge India — Admin-Only Event Observability & Controlled Replay Controller (Day 8 Task 03)
 */

import { Request, Response } from 'express';
import {
  eventAdminListQuerySchema,
  eventReplayBodySchema,
} from '@healthbridge/validation';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import { eventObservabilityService } from './event.service';

export class EventController {
  /**
   * GET /api/v1/events/health
   */
  getHealth = asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await eventObservabilityService.getHealthMetrics();
    sendSuccess(res, metrics, 'Event processing health metrics retrieved');
  });

  /**
   * GET /api/v1/events
   */
  listEvents = asyncHandler(async (req: Request, res: Response) => {
    const query = eventAdminListQuerySchema.parse(req.query);
    const result = await eventObservabilityService.listEvents(query);
    sendSuccess(res, result, 'Domain outbox events retrieved');
  });

  /**
   * GET /api/v1/events/dead-letter
   */
  listDeadLetter = asyncHandler(async (req: Request, res: Response) => {
    const query = eventAdminListQuerySchema.parse({
      ...req.query,
      status: 'DEAD_LETTER',
    });
    const result = await eventObservabilityService.listEvents(query);
    sendSuccess(res, result, 'Dead-letter events retrieved');
  });

  /**
   * GET /api/v1/events/:eventId
   */
  getEventDetail = asyncHandler(async (req: Request, res: Response) => {
    const detail = await eventObservabilityService.getEventDetail(
      String(req.params.eventId)
    );
    sendSuccess(res, detail, 'Redacted domain event details retrieved');
  });

  /**
   * POST /api/v1/events/:eventId/retry
   */
  retryEvent = asyncHandler(async (req: Request, res: Response) => {
    const body = eventReplayBodySchema.parse(req.body);
    const outcome = await eventObservabilityService.replayEvent({
      eventId: String(req.params.eventId),
      actorId: req.user!.userId,
      actorRole: req.user!.role,
      reason: body.reason,
    });
    sendSuccess(res, outcome, 'Domain event scheduled for controlled idempotent replay');
  });
}

export const eventController = new EventController();
