'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Settings } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/features/notifications/hooks/use-notifications';
import { NotificationCard } from './NotificationCard';
import { NotificationEmptyState } from './NotificationEmptyState';

interface NotificationDropdownProps {
  onClose: () => void;
  centerUrl: string;
  preferencesUrl: string;
}

export function NotificationDropdown({
  onClose,
  centerUrl,
  preferencesUrl,
}: NotificationDropdownProps) {
  const { data, isLoading } = useNotifications({ limit: 5 });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in-50 zoom-in-95 duration-100">
      {/* Dropdown Header */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead(undefined)}
              disabled={isMarkingAll}
              className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
            >
              <Check className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}

          <Link
            href={preferencesUrl}
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
            title="Notification Preferences"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Notifications Body */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5 scrollbar-thin">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <NotificationEmptyState isUnreadOnly={false} />
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} onClick={onClose}>
              <NotificationCard
                notification={notif}
                onMarkRead={(id) => markRead(id)}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer Navigation Link */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <Link
          href={centerUrl}
          onClick={onClose}
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1.5"
        >
          <span>Open Full Notification Center</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
