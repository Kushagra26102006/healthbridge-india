'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Settings, Wifi, RefreshCw } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationStreamConnectionState,
} from '@/features/notifications/hooks/use-notifications';
import { NotificationCard } from './NotificationCard';
import { NotificationEmptyState } from './NotificationEmptyState';

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
    <div
      role="dialog"
      aria-label="Recent notifications"
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 text-slate-800 dark:text-slate-100 animate-in fade-in-50 zoom-in-95 duration-100"
    >
      {/* Dropdown Header */}
      <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full">
              {unreadCount} new
            </span>
          )}
          <span
            title={
              connectionState === 'connected'
                ? 'Live SSE real-time stream connected'
                : 'Using automatic polling fallback'
            }
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              connectionState === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
            }`}
          >
            <Wifi className="w-2.5 h-2.5" />
            <span>{connectionState === 'connected' ? 'Live' : 'Sync'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead(undefined)}
              disabled={isMarkingAll}
              className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 hover:underline"
            >
              <Check className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}

          <Link
            href={preferencesUrl}
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700"
            title="Notification Preferences"
            aria-label="Notification preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Notifications Body */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1.5 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Unable to load notifications right now.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
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
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
        <Link
          href={centerUrl}
          onClick={onClose}
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline inline-flex items-center gap-1.5"
        >
          <span>Open Full Notification Center</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
