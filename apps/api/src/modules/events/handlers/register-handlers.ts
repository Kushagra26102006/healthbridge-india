/**
 * HealthBridge India — Default Domain Event Handler Registration (Day 8 Task 03)
 */

import { eventHandlerRegistry } from '../event.registry';
import { timelineProjectionHandler } from './timeline-projection.handler';
import {
  operationalAuditHandler,
  pharmacyWorkflowHandler,
} from './workflow-automation.handlers';
import { unifiedNotificationEventHandler } from '../../notifications/services/notification-event.handler';

let initialized = false;

export function registerDefaultEventHandlers(): void {
  if (initialized) return;
  initialized = true;

  eventHandlerRegistry.registerMany([
    pharmacyWorkflowHandler,
    timelineProjectionHandler,
    unifiedNotificationEventHandler,
    operationalAuditHandler,
  ]);
}
