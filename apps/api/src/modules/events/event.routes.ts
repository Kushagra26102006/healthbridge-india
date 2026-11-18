/**
 * HealthBridge India — Admin-Only Event Observability & Recovery Routes (Day 8 Task 03)
 *
 * SECURITY INVARIANTS:
 *   - Strictly `authenticate` + `authorize(['ADMIN'])` + dedicated `adminEventRateLimiter`.
 *   - ZERO public or client-facing event-publishing endpoints (domain events may ONLY be
 *     published internally by backend domain services via `eventPublisher`).
 */

import { Router, Request } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { createRateLimiter } from '../../middleware/rate-limit';
import { eventController } from './event.controller';

export const adminEventRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute sliding window
  max: 60,
  message: 'Admin event operations rate limit exceeded. Please wait briefly.',
  keyGenerator: (req: Request) =>
    req.user?.userId
      ? `admin-events:${req.user.userId}`
      : `admin-events-ip:${req.ip || req.socket.remoteAddress || 'unknown'}`,
});

export const eventRoutes = Router();

// Strictly authenticated ADMIN operational endpoints only
eventRoutes.use(authenticate);
eventRoutes.use(authorize(['ADMIN']));
eventRoutes.use(adminEventRateLimiter);

eventRoutes.get('/health', eventController.getHealth);
eventRoutes.get('/dead-letter', eventController.listDeadLetter);
eventRoutes.get('/', eventController.listEvents);
eventRoutes.get('/:eventId', eventController.getEventDetail);
eventRoutes.post('/:eventId/retry', eventController.retryEvent);

export default eventRoutes;
