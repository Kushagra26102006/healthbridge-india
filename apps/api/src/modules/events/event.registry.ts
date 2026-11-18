/**
 * HealthBridge India — Domain Event Handler Registry (Day 8 Task 03)
 *
 * Separates domain event definitions from handler subscriptions. Each handler
 * carries a unique stable `name` used in `(eventId, handlerName)` idempotency locks.
 */

import type { DomainEventType } from '@healthbridge/shared-types';
import type { EventHandlerDefinition } from './event.types';

export class EventHandlerRegistry {
  private readonly handlersByType = new Map<DomainEventType, EventHandlerDefinition[]>();
  private readonly registeredNames = new Set<string>();

  register(handler: EventHandlerDefinition): void {
    if (this.registeredNames.has(handler.name)) {
      return;
    }
    this.registeredNames.add(handler.name);

    for (const eventType of handler.eventTypes) {
      const list = this.handlersByType.get(eventType) || [];
      list.push(handler);
      this.handlersByType.set(eventType, list);
    }
  }

  registerMany(handlers: EventHandlerDefinition[]): void {
    for (const handler of handlers) {
      this.register(handler);
    }
  }

  getHandlersFor(eventType: DomainEventType): EventHandlerDefinition[] {
    return [...(this.handlersByType.get(eventType) || [])];
  }

  listRegisteredHandlerNames(): string[] {
    return Array.from(this.registeredNames);
  }

  clear(): void {
    this.handlersByType.clear();
    this.registeredNames.clear();
  }
}

export const eventHandlerRegistry = new EventHandlerRegistry();
