/**
 * HealthBridge India — Domain Event to Notification Handler Bridge (Day 8 Task 04)
 *
 * Connects the transactional outbox event foundation (`apps/api/src/modules/events/`)
 * to the unified notification pipeline:
 *   Domain Event -> Notification Event Handler -> Recipient Resolver -> Authorization
 *   -> Privacy-Safe Template -> Persistence -> Real-Time SSE + Dashboard Sync Hint
 */

import type { NotificationEventType, UserRole } from '@healthbridge/shared-types';
import type { EventExecutionContext, EventHandlerDefinition } from '../../events/event.types';
import {
  notificationRecipientResolver,
  type NotificationRecipientCandidate,
} from './notification-recipient.resolver';
import { notificationService } from './notification.service';

function extractRecipientCandidates(
  payload: Record<string, unknown>
): NotificationRecipientCandidate[] {
  const candidates: NotificationRecipientCandidate[] = [];

  if (typeof payload.patientId === 'string') {
    candidates.push({ userId: payload.patientId, role: 'PATIENT' });
  }
  if (typeof payload.doctorId === 'string') {
    candidates.push({ userId: payload.doctorId, role: 'DOCTOR' });
  }
  if (typeof payload.orderingDoctorId === 'string') {
    candidates.push({ userId: payload.orderingDoctorId, role: 'DOCTOR' });
  }
  if (typeof payload.pharmacyId === 'string') {
    candidates.push({ userId: payload.pharmacyId, role: 'PHARMACY' });
  }
  if (typeof payload.laboratoryId === 'string') {
    candidates.push({ userId: payload.laboratoryId, role: 'LABORATORY' });
  }
  if (typeof payload.requesterId === 'string' && typeof payload.requesterRole === 'string') {
    candidates.push({
      userId: payload.requesterId,
      role: payload.requesterRole as UserRole,
    });
  }

  return candidates;
}

export const unifiedNotificationEventHandler: EventHandlerDefinition = {
  name: 'unified-notification-dispatcher',
  description:
    'Resolves authorized recipients, applies privacy-safe templates, persists notifications, and pushes SSE + dashboard sync frames.',
  eventTypes: [
    'APPOINTMENT_BOOKED',
    'APPOINTMENT_CONFIRMED',
    'APPOINTMENT_RESCHEDULED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_COMPLETED',
    'PRESCRIPTION_ISSUED',
    'PRESCRIPTION_CANCELLED',
    'PRESCRIPTION_DISPENSED',
    'PRESCRIPTION_PARTIALLY_DISPENSED',
    'DISPENSING_COMPLETED',
    'STOCK_LOW',
    'STOCK_EXPIRED',
    'PHARMACY_ORDER_UPDATED',
    'LAB_ORDER_CREATED',
    'LAB_ORDER_ACCEPTED',
    'SAMPLE_COLLECTED',
    'SAMPLE_REJECTED',
    'REPORT_PUBLISHED',
    'REPORT_AMENDED',
    'CONSENT_GRANTED',
    'CONSENT_REVOKED',
    'ABHA_LINKED',
    'EXTERNAL_RECORD_IMPORTED',
  ],
  async handle(ctx: EventExecutionContext): Promise<void> {
    const payload = (ctx.event.payload || {}) as Record<string, unknown>;
    const candidates = extractRecipientCandidates(payload);

    // Map domain event names to NotificationEventType cleanly
    const eventTypeMap: Partial<Record<string, NotificationEventType>> = {
      DISPENSING_COMPLETED: 'PRESCRIPTION_DISPENSED',
      STOCK_LOW: 'LOW_STOCK',
      STOCK_EXPIRED: 'NEAR_EXPIRY',
      PHARMACY_ORDER_UPDATED: 'ORDER_PROCESSING',
    };

    const notifEventType =
      eventTypeMap[ctx.event.eventType] || (ctx.event.eventType as NotificationEventType);

    const notificationPayloads = notificationRecipientResolver.resolvePayloads({
      eventId: ctx.event.eventId,
      eventType: notifEventType,
      candidates,
      relatedEntity: {
        entityType: ctx.event.aggregateType,
        entityId: ctx.event.aggregateId,
      },
    });

    for (const notifPayload of notificationPayloads) {
      await notificationService.publishEvent(notifPayload);
    }
  },
};
