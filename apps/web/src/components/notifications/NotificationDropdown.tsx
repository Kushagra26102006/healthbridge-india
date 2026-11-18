'use client';

import React from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import { Check, ExternalLink, Settings, Wifi, RefreshCw } from 'lucide-react';
import { dropdownEntrance } from '@/lib/motion/variants';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationStreamConnectionState,
} from '@/features/notifications/hooks/use-notifications';
import { NotificationCard } from './NotificationCard';
import { NotificationEmptyState } from './NotificationEmptyState';
import { NotificationSkeleton } from './NotificationSkeleton';

interface NotificationDropdownProps {
  onClose: () => void;
  centerUrl: string;
  preferencesUrl: string;
  connectionState?: NotificationStreamConnectionState;
}

export function NotificationDropdown({
  onClose,
  centerUrl,
  preferencesUrl,
  connectionState = 'connected',
}: NotificationDropdownProps) {
  const { data, isLoading, isError, refetch } = useNotifications({ limit: 5 });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <m.div
      role="dialog"
      aria-label="Recent notifications"
      variants={dropdownEntrance}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="glass-dropdown absolute right-0 mt-2 w-80 sm:w-96 rounded-xl overflow-hidden z-50 text-foreground origin-top-right"
    >
      {/* Dropdown Header */}
      <div className="p-3.5 bg-muted/60 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/15 text-rose-700 dark:text-rose-300 rounded-pill">
              {unreadCount} new
            </span>
          )}
          <span
            title={
              connectionState === 'connected'
                ? 'Live SSE real-time stream connected'
                : connectionState === 'reconnecting'
                  ? 'Reconnecting real-time notification stream'
                  : 'Using automatic polling fallback'
            }
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-pill ${
              connectionState === 'connected'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
            }`}
          >
            <Wifi className="w-2.5 h-2.5" aria-hidden="true" />
            <span>
              {connectionState === 'connected'
                ? 'Live'
                : connectionState === 'reconnecting'
                  ? 'Reconnecting…'
                  : 'Sync'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead(undefined)}
              disabled={isMarkingAll}
              className="text-[11px] font-medium text-secondary hover:opacity-80 flex items-center gap-1 hover:underline focus-ring rounded-sm"
            >
              <Check className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}

          <Link
            href={preferencesUrl}
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors focus-ring"
            title="Notification Preferences"
            aria-label="Notification preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Notifications Body */}
      <div className="max-h-80 overflow-y-auto divide-y divide-border/70 p-2 space-y-1.5 scrollbar-thin">
        {isLoading ? (
          <NotificationSkeleton count={3} compact />
        ) : isError ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-xs text-error">
              Unable to load notifications right now.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline focus-ring rounded-sm"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <NotificationEmptyState isUnreadOnly={false} />
        ) : (
          notifications.map((notif) => (
            <div key={notif.id}>
              <NotificationCard
                notification={notif}
                onMarkRead={(id) => markRead(id)}
                onNavigate={onClose}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer Navigation Link */}
      <div className="p-2.5 bg-muted/50 border-t border-border text-center">
        <Link
          href={centerUrl}
          onClick={onClose}
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline inline-flex items-center gap-1.5"
        >
          <span>Open Full Notification Center</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </m.div>
  );
}
