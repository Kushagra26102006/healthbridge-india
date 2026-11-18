/**
 * HealthBridge India — Role-Aware Notification Recipient Resolver (Day 8 Task 04)
 *
 * Implements the clean flow:
 *   Domain Event -> Recipient Resolution -> Role Authorization -> Template Rendering -> Persistence
 *
 * SECURITY INVARIANTS:
 *   1. Validates recipient role eligibility for each notification event type.
 *   2. NEVER routes patient clinical health notifications to ADMIN accounts.
 *   3. Verifies recipient user IDs are valid ObjectIds before dispatching.
 */

import { Types } from 'mongoose';
import type {
  NotificationEventPayload,
  NotificationEventType,
  UserRole,
} from '@healthbridge/shared-types';
import { renderNotificationTemplate } from './notification-template.registry';

export interface NotificationRecipientCandidate {
  userId: string;
  role: UserRole;
}

export interface ResolveNotificationRecipientsInput {
  eventId: string;
  eventType: NotificationEventType;
  candidates: NotificationRecipientCandidate[];
  relatedEntity?: {
    entityType: string;
    entityId: string;
    referenceNumber?: string;
  };
  customLinkUrl?: string;
}

const ADMIN_ALLOWED_EVENTS = new Set<NotificationEventType>([
  'SERVICE_FAILURE_ALERT',
  'INTEGRATION_FAILURE_ALERT',
  'EVENT_PROCESSING_FAILED',
  'SECURITY_ALERT',
  'LOGIN_ALERT',
  'PASSWORD_CHANGED',
  'SESSION_REVOKED',
  'SYSTEM_MAINTENANCE',
  'SYSTEM_ALERT',
]);

const ROLE_BLOCKED_EVENTS: Partial<Record<UserRole, Set<NotificationEventType>>> = {
  // Pharmacy NEVER receives clinical lab reports or encounter notes
  PHARMACY: new Set<NotificationEventType>([
    'REPORT_PUBLISHED',
    'REPORT_AMENDED',
    'LAB_REPORT_READY',
    'ENCOUNTER_FINALIZED',
  ]),
  // Laboratory NEVER receives pharmacy procurement/inventory alerts
  LABORATORY: new Set<NotificationEventType>([
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'PURCHASE_ORDER_APPROVED',
    'GOODS_RECEIVED',
  ]),
};

export class NotificationRecipientResolver {
  /**
   * Checks whether a recipient role is authorized to receive a notification of `eventType`.
   */
  isRecipientAuthorizedForEvent(role: UserRole, eventType: NotificationEventType): boolean {
    if (role === 'ADMIN') {
      return ADMIN_ALLOWED_EVENTS.has(eventType);
    }

    const blocked = ROLE_BLOCKED_EVENTS[role];
    if (blocked && blocked.has(eventType)) {
      return false;
    }

    return true;
  }

  /**
   * Resolves deduplicated, role-authorized, privacy-safe notification payloads ready
   * for `notificationService.publishEvent(...)`.
   */
  resolvePayloads(input: ResolveNotificationRecipientsInput): NotificationEventPayload[] {
    const seenRecipients = new Set<string>();
    const payloads: NotificationEventPayload[] = [];

    for (const candidate of input.candidates) {
      if (!candidate.userId || !Types.ObjectId.isValid(candidate.userId)) {
        continue;
      }

      if (seenRecipients.has(candidate.userId)) {
        continue;
      }

      if (!this.isRecipientAuthorizedForEvent(candidate.role, input.eventType)) {
        continue;
      }

      seenRecipients.add(candidate.userId);
      const rendered = renderNotificationTemplate(input.eventType, candidate.role);

      payloads.push({
        eventId: input.eventId,
        eventType: input.eventType,
        category: rendered.category,
        recipientId: candidate.userId,
        recipientRole: candidate.role,
        title: rendered.title,
        message: rendered.message,
        priority: rendered.priority,
        sourceModule: rendered.sourceModule,
        relatedEntity: input.relatedEntity,
        linkUrl: input.customLinkUrl || rendered.linkUrl,
        idempotencyKey: `evt:${input.eventId}:rcpt:${candidate.userId}`,
        metadata: {
          sourceModule: rendered.sourceModule,
          eventId: input.eventId,
        },
      });
    }

    return payloads;
  }
}

export const notificationRecipientResolver = new NotificationRecipientResolver();
