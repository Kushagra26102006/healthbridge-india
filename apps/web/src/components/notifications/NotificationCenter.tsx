'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  Search,
  Settings,
  History,
  RotateCw,
} from 'lucide-react';
import {
  useNotifications,
  useNotificationUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/features/notifications/hooks/use-notifications';
import { NotificationCard } from './NotificationCard';
import { NotificationCategoryTabs, NotificationTabKey } from './NotificationCategoryTabs';
import { NotificationEmptyState } from './NotificationEmptyState';
import type { NotificationCategory } from '@healthbridge/shared-types';

interface NotificationCenterProps {
  roleTitle?: string;
  preferencesUrl: string;
  historyUrl?: string;
}

export function NotificationCenter({
  roleTitle = 'Notification Center',
  preferencesUrl,
  historyUrl,
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<NotificationTabKey>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const categoryFilter: NotificationCategory | 'ALL' | undefined =
    activeTab === 'ALL' || activeTab === 'UNREAD' ? 'ALL' : (activeTab as NotificationCategory);
  const unreadOnly = activeTab === 'UNREAD';

  const { data, isLoading, refetch, isFetching } = useNotifications({
    page,
    limit,
    category: categoryFilter,
    unreadOnly,
    search: searchTerm.trim() || undefined,
  });

  const { data: countData } = useNotificationUnreadCount();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const notifications = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const unreadCount = countData?.unreadCount || 0;
  const categoryCounts = countData?.categoryCounts || {};

  const handleTabChange = (tab: NotificationTabKey) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleMarkAllRead = () => {
    const targetCat =
      activeTab !== 'ALL' && activeTab !== 'UNREAD' ? (activeTab as NotificationCategory) : undefined;
    markAllRead(targetCat);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts & Communications</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{roleTitle}</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding prescriptions, orders, inventory alerts, and security notices.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            title="Refresh alerts"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-teal-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-teal-600" />
              <span>Mark all as read</span>
            </button>
          )}

          {historyUrl && (
            <Link
              href={historyUrl}
              className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-xs flex items-center gap-1.5"
              title="Delivery Audit History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delivery History</span>
            </Link>
          )}

          <Link
            href={preferencesUrl}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <NotificationCategoryTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          categoryCounts={categoryCounts}
          totalCount={total}
          unreadCount={unreadCount}
        />

        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications by title, entity reference..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <NotificationEmptyState isUnreadOnly={unreadOnly} />
        ) : (
          notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkRead={(id) => markRead(id)}
              onDelete={(id) => deleteNotification(id)}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
            notifications
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
