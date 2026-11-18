/**
 * HealthBridge India — Cross-Tab Notification & Session Sync (Day 8 Task 04)
 *
 * Uses the Web `BroadcastChannel` API when available, with an automatic `localStorage`
 * `storage`-event fallback for browsers/contexts where BroadcastChannel is unavailable.
 *
 * PRIVACY INVARIANT:
 *   NEVER transmits clinical content, notification titles/messages, or patient data across tabs.
 *   Only opaque operational control signals (`type`, `userId`, `notificationId`, `unreadCount`,
 *   `eventId`, `timestamp`) are exchanged.
 */

const CHANNEL_NAME = 'healthbridge-notifications-sync-v1';
const STORAGE_FALLBACK_KEY = 'hb_notif_sync_event_v1';

export type CrossTabNotificationMessage =
  | {
      type: 'MARK_READ';
      userId: string;
      notificationId: string;
      timestamp: number;
    }
  | {
      type: 'MARK_ALL_READ';
      userId: string;
      timestamp: number;
    }
  | {
      type: 'UNREAD_COUNT_SYNC';
      userId: string;
      unreadCount: number;
      timestamp: number;
    }
  | {
      type: 'NOTIFICATION_RECEIVED';
      userId: string;
      eventId: string;
      timestamp: number;
    }
  | {
      type: 'LOGOUT';
      userId?: string;
      timestamp: number;
    }
  | {
      type: 'USER_SWITCHED';
      userId: string;
      timestamp: number;
    };

type MessageHandler = (msg: CrossTabNotificationMessage) => void;

const seenEventIdsAcrossTabs = new Set<string>();

/**
 * Prevents duplicate toasts or duplicate SSE handling when multiple browser tabs
 * receive the same notification event ID.
 */
export function markAndCheckDuplicateEventId(eventId: string): boolean {
  if (!eventId) return false;
  if (seenEventIdsAcrossTabs.has(eventId)) {
    return true;
  }
  seenEventIdsAcrossTabs.add(eventId);
  if (seenEventIdsAcrossTabs.size > 500) {
    const oldest = seenEventIdsAcrossTabs.values().next().value;
    if (oldest) seenEventIdsAcrossTabs.delete(oldest);
  }
  return false;
}

export function clearSeenEventIds(): void {
  seenEventIdsAcrossTabs.clear();
}

export function broadcastNotificationSync(msg: CrossTabNotificationMessage): void {
  if (typeof window === 'undefined') return;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(msg);
      channel.close();
      return;
    }
  } catch {
    // Fallback to localStorage storage event below
  }

  try {
    window.localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(msg));
    window.localStorage.removeItem(STORAGE_FALLBACK_KEY);
  } catch {
    // Ignore storage quota or private mode restrictions
  }
}

export function subscribeNotificationSync(handler: MessageHandler): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<CrossTabNotificationMessage>) => {
        if (event.data && typeof event.data.type === 'string') {
          handler(event.data);
        }
      };
    } catch {
      channel = null;
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_FALLBACK_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as CrossTabNotificationMessage;
      if (parsed && typeof parsed.type === 'string') {
        handler(parsed);
      }
    } catch {
      // Ignore malformed storage payloads
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.close();
    }
    window.removeEventListener('storage', handleStorage);
  };
}
