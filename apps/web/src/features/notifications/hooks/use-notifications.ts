'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notification-api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type {
  NotificationFilterDto,
  NotificationCategory,
  UpdateUserNotificationPreferencesDto,
} from '@healthbridge/shared-types';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (filter?: NotificationFilterDto) => ['notifications', 'list', filter] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  preferences: ['notifications', 'preferences'] as const,
  deliveryHistory: ['notifications', 'delivery-history'] as const,
};

/**
 * Fetch paginated user notifications
 */
export function useNotifications(filter?: NotificationFilterDto) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(filter),
    queryFn: () => notificationApi.getNotifications(filter),
    staleTime: 15 * 1000, // 15 seconds
  });
}

/**
 * Fetch total unread count and category breakdown
 */
export function useNotificationUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: Boolean(isAuthenticated),
    refetchInterval: 30 * 1000, // Fallback poll every 30 seconds
    staleTime: 10 * 1000,
  });
}

/**
 * Fetch notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.preferences,
    queryFn: () => notificationApi.getPreferences(),
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateUserNotificationPreferencesDto) =>
      notificationApi.updatePreferences(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.preferences });
    },
  });
}

/**
 * Reset notification preferences to defaults
 */
export function useResetNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.resetPreferences(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.preferences });
    },
  });
}

/**
 * Mark single notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category?: NotificationCategory) => notificationApi.markAllAsRead(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * Delete / dismiss notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * Fetch notification delivery history
 */
export function useNotificationDeliveryHistory(limit = 50) {
  return useQuery({
    queryKey: [...NOTIFICATION_QUERY_KEYS.deliveryHistory, limit],
    queryFn: () => notificationApi.getDeliveryHistory(limit),
  });
}

/**
 * Real-Time Server-Sent Events (SSE) Hook
 * Establishes persistent live stream with backend.
 */
export function useRealTimeNotificationStream() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      return () => {};
    }

    // Connect to SSE stream
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/v1/notifications/stream`;

    try {
      const es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.addEventListener('notification', () => {
        // Invalidate notifications queries on incoming real-time push
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
      });

      es.addEventListener('unread_count', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.unreadCount !== undefined) {
            queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.unreadCount, (prev: any) => ({
              ...prev,
              unreadCount: data.unreadCount,
            }));
          }
        } catch {
          // ignore parsing error
        }
      });

      es.onerror = () => {
        // Automatically handled by browser reconnect
      };

      return () => {
        es.close();
        eventSourceRef.current = null;
      };
    } catch {
      // SSE not supported or blocked by environment, standard polling fallback active
      return () => {};
    }
  }, [isAuthenticated, queryClient]);
}
