'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificationStreamUrl, notificationApi } from '../api/notification-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useToast } from '@/components/ui/toast';
import { useLiveAnnouncer } from '@/components/accessibility/LiveAnnouncer';
import { invalidateDashboardQueriesForEvent } from '../lib/dashboard-sync';
import {
  broadcastNotificationSync,
  clearSeenEventIds,
  markAndCheckDuplicateEventId,
  subscribeNotificationSync,
} from '../lib/cross-tab-sync';
import type {
  DashboardSyncHintDto,
  NotificationFilterDto,
  NotificationCategory,
  NotificationUnreadCountDto,
  UpdateUserNotificationPreferencesDto,
} from '@healthbridge/shared-types';

export type NotificationStreamConnectionState =
  | 'connected'
  | 'reconnecting'
  | 'polling_fallback'
  | 'disconnected';

/**
 * User-scoped TanStack Query keys guarantee that switching accounts or logging out
 * can NEVER display another user's cached notifications.
 */
export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  forUser: (userId?: string) => ['notifications', userId || 'anonymous'] as const,
  list: (userId?: string, filter?: NotificationFilterDto) =>
    ['notifications', userId || 'anonymous', 'list', filter] as const,
  unreadCount: (userId?: string) =>
    ['notifications', userId || 'anonymous', 'unread-count'] as const,
  preferences: (userId?: string) =>
    ['notifications', userId || 'anonymous', 'preferences'] as const,
  deliveryHistory: (userId?: string) =>
    ['notifications', userId || 'anonymous', 'delivery-history'] as const,
};

// Module-level singleton guard to prevent duplicate SSE connections within the same tab
let activeTabEventSource: EventSource | null = null;
let activeTabUserId: string | null = null;
let activeTabSubscribers = 0;

/**
 * Fetch paginated user notifications (strictly scoped to authenticated user)
 */
export function useNotifications(filter?: NotificationFilterDto) {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(userId, filter),
    queryFn: () => notificationApi.getNotifications(filter),
    enabled: Boolean(isAuthenticated && userId),
    staleTime: 15 * 1000,
    retry: 1,
  });
}

/**
 * Fetch total unread count and category breakdown with automatic polling fallback
 */
export function useUnreadNotificationCount(streamState?: NotificationStreamConnectionState) {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;

  // Poll faster (15s) when in polling fallback, gently (60s) when SSE is healthy
  const refetchInterval =
    streamState === 'connected' ? 60 * 1000 : 15 * 1000;

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(userId),
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: Boolean(isAuthenticated && userId),
    refetchInterval,
    staleTime: 10 * 1000,
    retry: 1,
  });
}

// Backward-compatible alias used by existing components
export const useNotificationUnreadCount = useUnreadNotificationCount;

/**
 * Fetch notification preferences & honestly reported configured channels
 */
export function useNotificationPreferences() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.preferences(userId),
    queryFn: () => notificationApi.getPreferences(),
    enabled: Boolean(isAuthenticated && userId),
    staleTime: 30 * 1000,
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (dto: UpdateUserNotificationPreferencesDto) =>
      notificationApi.updatePreferences(dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.preferences(userId), updated);
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.preferences(userId),
      });
    },
  });
}

/**
 * Reset notification preferences to defaults
 */
export function useResetNotificationPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: () => notificationApi.resetPreferences(),
    onSuccess: (resetPrefs) => {
      queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.preferences(userId), resetPrefs);
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.preferences(userId),
      });
    },
  });
}

/**
 * Mark single notification as read with safe optimistic update, error rollback,
 * and cross-tab synchronization.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onMutate: async (id: string) => {
      const unreadKey = NOTIFICATION_QUERY_KEYS.unreadCount(userId);
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEYS.forUser(userId) });

      const previousUnread = queryClient.getQueryData<NotificationUnreadCountDto>(unreadKey);
      if (previousUnread && previousUnread.unreadCount > 0) {
        queryClient.setQueryData<NotificationUnreadCountDto>(unreadKey, {
          ...previousUnread,
          unreadCount: Math.max(0, previousUnread.unreadCount - 1),
        });
      }
      return { previousUnread, id };
    },
    onError: (_err, _id, context) => {
      if (context?.previousUnread) {
        queryClient.setQueryData(
          NOTIFICATION_QUERY_KEYS.unreadCount(userId),
          context.previousUnread
        );
      }
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.forUser(userId),
      });
      if (userId) {
        broadcastNotificationSync({
          type: 'MARK_READ',
          userId,
          notificationId: id,
          timestamp: Date.now(),
        });
      }
    },
  });
}

/**
 * Mark all notifications as read with cross-tab synchronization
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (category?: NotificationCategory) => notificationApi.markAllAsRead(category),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.forUser(userId),
      });
      if (userId) {
        broadcastNotificationSync({
          type: 'MARK_ALL_READ',
          userId,
          timestamp: Date.now(),
        });
      }
    },
  });
}

/**
 * Delete / dismiss notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.forUser(userId),
      });
    },
  });
}

/**
 * Fetch notification delivery history
 */
export function useNotificationDeliveryHistory(limit = 50) {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [...NOTIFICATION_QUERY_KEYS.deliveryHistory(userId), limit],
    queryFn: () => notificationApi.getDeliveryHistory(limit),
    enabled: Boolean(isAuthenticated && userId),
  });
}

/**
 * Real-Time Server-Sent Events (SSE) + Cross-Tab Sync + Narrowly Scoped Dashboard Refresh Hook
 *
 * Guarantees:
 *   - Uses HTTP-only session cookies (`withCredentials: true`) — NEVER passes access tokens in URLs
 *   - Deduplicates SSE connections per tab (singleton per authenticated userId)
 *   - Automatically degrades to authenticated polling fallback when SSE drops or is blocked
 *   - Synchronizes read status, unread counts, and logout across browser tabs via BroadcastChannel
 *   - Performs narrowly scoped TanStack Query invalidation for the authenticated user's role
 *   - Clears notification caches immediately on logout or account switch
 */
export function useNotificationStream(): {
  connectionState: NotificationStreamConnectionState;
} {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const userRole = user?.role;

  const { toast } = useToast();
  const { announce } = useLiveAnnouncer();
  const toastRef = useRef(toast);
  const announceRef = useRef(announce);
  toastRef.current = toast;
  announceRef.current = announce;

  const [connectionState, setConnectionState] =
    useState<NotificationStreamConnectionState>('disconnected');
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const consecutiveErrorsRef = useRef(0);

  // Account-switching & logout cache isolation guard
  useEffect(() => {
    if (prevUserIdRef.current && prevUserIdRef.current !== userId) {
      queryClient.removeQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.forUser(prevUserIdRef.current),
      });
      clearSeenEventIds();
      if (userId) {
        broadcastNotificationSync({
          type: 'USER_SWITCHED',
          userId,
          timestamp: Date.now(),
        });
      }
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  // Cross-tab synchronization listener (BroadcastChannel + localStorage fallback)
  useEffect(() => {
    if (typeof window === 'undefined') return () => {};

    return subscribeNotificationSync((msg) => {
      if (msg.type === 'LOGOUT') {
        queryClient.removeQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
        clearSeenEventIds();
        if (activeTabEventSource) {
          activeTabEventSource.close();
          activeTabEventSource = null;
          activeTabUserId = null;
        }
        setConnectionState('disconnected');
        return;
      }

      if (msg.type === 'USER_SWITCHED' && userId && msg.userId !== userId) {
        queryClient.removeQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
        clearSeenEventIds();
        return;
      }

      if (!userId || msg.userId !== userId) {
        return;
      }

      if (msg.type === 'MARK_READ' || msg.type === 'MARK_ALL_READ') {
        void queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.forUser(userId),
        });
      } else if (msg.type === 'UNREAD_COUNT_SYNC') {
        queryClient.setQueryData(
          NOTIFICATION_QUERY_KEYS.unreadCount(userId),
          (prev: NotificationUnreadCountDto | undefined) => ({
            categoryCounts: prev?.categoryCounts || {},
            unreadCount: msg.unreadCount,
          })
        );
      } else if (msg.type === 'NOTIFICATION_RECEIVED') {
        markAndCheckDuplicateEventId(msg.eventId);
        void queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.forUser(userId),
        });
      }
    });
  }, [userId, queryClient]);

  // Real-Time SSE stream lifecycle with polling fallback
  useEffect(() => {
    if (!isAuthenticated || !userId || typeof window === 'undefined') {
      setConnectionState('disconnected');
      return () => {};
    }

    if (typeof EventSource === 'undefined') {
      setConnectionState('polling_fallback');
      return () => {};
    }

    // Close stale stream if switching user within same tab
    if (activeTabEventSource && activeTabUserId !== userId) {
      activeTabEventSource.close();
      activeTabEventSource = null;
      activeTabUserId = null;
    }

    activeTabSubscribers += 1;

    if (!activeTabEventSource) {
      try {
        const sseUrl = getNotificationStreamUrl();
        activeTabEventSource = new EventSource(sseUrl, { withCredentials: true });
        activeTabUserId = userId;
      } catch {
        setConnectionState('polling_fallback');
        activeTabSubscribers = Math.max(0, activeTabSubscribers - 1);
        return () => {};
      }
    }

    const es = activeTabEventSource;

    const onConnected = () => {
      consecutiveErrorsRef.current = 0;
      setConnectionState('connected');
    };

    const onNotification = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data || '{}');
        const eventId = event.lastEventId || parsed?.id;
        if (eventId && markAndCheckDuplicateEventId(eventId)) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.forUser(userId),
        });

        invalidateDashboardQueriesForEvent(queryClient, {
          role: userRole,
          category: parsed?.category,
          eventType: parsed?.eventType,
          resourceId: parsed?.relatedEntity?.entityId,
        });

        if (eventId) {
          broadcastNotificationSync({
            type: 'NOTIFICATION_RECEIVED',
            userId,
            eventId,
            timestamp: Date.now(),
          });
        }

        // Polite, privacy-safe live toast + screen-reader announcement (never exposes clinical PHI)
        const safeTitle =
          typeof parsed?.title === 'string' && parsed.title.trim()
            ? parsed.title.trim()
            : 'New HealthBridge notification';
        const safeCategory =
          typeof parsed?.category === 'string' ? parsed.category : 'SYSTEM';
        toastRef.current({
          variant: safeCategory === 'SECURITY' ? 'warning' : 'info',
          title: safeTitle,
          description: `Category: ${safeCategory}. Open Notifications to review safely.`,
        });
        announceRef.current(
          `New notification: ${safeTitle}`,
          safeCategory === 'SECURITY' ? 'assertive' : 'polite'
        );
      } catch {
        void queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.forUser(userId),
        });
      }
    };

    const onDashboardSync = (event: MessageEvent) => {
      try {
        const hint = JSON.parse(event.data || '{}') as DashboardSyncHintDto;
        invalidateDashboardQueriesForEvent(queryClient, {
          role: userRole,
          category: hint.category,
          eventType: hint.eventType,
          resourceId: hint.resourceId,
        });
      } catch {
        // Ignore malformed sync hint
      }
    };

    const onUnreadCount = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data || '{}');
        if (typeof data?.unreadCount === 'number') {
          queryClient.setQueryData(
            NOTIFICATION_QUERY_KEYS.unreadCount(userId),
            (prev: NotificationUnreadCountDto | undefined) => ({
              categoryCounts: prev?.categoryCounts || {},
              unreadCount: data.unreadCount,
            })
          );
          broadcastNotificationSync({
            type: 'UNREAD_COUNT_SYNC',
            userId,
            unreadCount: data.unreadCount,
            timestamp: Date.now(),
          });
        }
      } catch {
        // Ignore malformed unread count payload
      }
    };

    const onSessionExpired = () => {
      es.close();
      if (activeTabEventSource === es) {
        activeTabEventSource = null;
        activeTabUserId = null;
      }
      queryClient.removeQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
      setConnectionState('disconnected');
    };

    const onError = () => {
      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current >= 3) {
        // Degrade gracefully to authenticated polling fallback (e.g. serverless proxy timeout)
        es.close();
        if (activeTabEventSource === es) {
          activeTabEventSource = null;
          activeTabUserId = null;
        }
        setConnectionState('polling_fallback');
      } else {
        setConnectionState('reconnecting');
      }
    };

    es.addEventListener('connected', onConnected);
    es.addEventListener('notification', onNotification);
    es.addEventListener('dashboard_sync', onDashboardSync);
    es.addEventListener('unread_count', onUnreadCount);
    es.addEventListener('session_expired', onSessionExpired);
    es.addEventListener('error', onError);

    if (es.readyState === EventSource.OPEN) {
      setConnectionState('connected');
    }

    return () => {
      es.removeEventListener('connected', onConnected);
      es.removeEventListener('notification', onNotification);
      es.removeEventListener('dashboard_sync', onDashboardSync);
      es.removeEventListener('unread_count', onUnreadCount);
      es.removeEventListener('session_expired', onSessionExpired);
      es.removeEventListener('error', onError);

      activeTabSubscribers = Math.max(0, activeTabSubscribers - 1);
      if (activeTabSubscribers === 0 && activeTabEventSource) {
        activeTabEventSource.close();
        activeTabEventSource = null;
        activeTabUserId = null;
      }
    };
  }, [isAuthenticated, userId, userRole, queryClient]);

  return { connectionState };
}

// Backward-compatible alias
export const useRealTimeNotificationStream = useNotificationStream;
