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
  Calendar,
  AlertCircle,
  Wifi,
  X,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadNotificationCount,
  useNotificationStream,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/features/notifications/hooks/use-notifications';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { NotificationCard } from './NotificationCard';
import { NotificationCategoryTabs, NotificationTabKey } from './NotificationCategoryTabs';
import { NotificationEmptyState } from './NotificationEmptyState';
import type {
  NotificationCategory,
  NotificationReadStatusFilter,
  UserRole,
} from '@healthbridge/shared-types';

interface NotificationCenterProps {
  roleTitle?: string;
  roleSubtitle?: string;
  preferencesUrl: string;
  historyUrl?: string;
}

export function NotificationCenter({
  roleTitle = 'Notification Center',
  roleSubtitle = 'Real-time privacy-safe alerts and workflow updates scoped to your account.',
  preferencesUrl,
  historyUrl,
}: NotificationCenterProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NotificationTabKey>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { connectionState } = useNotificationStream();

  const categoryFilter: NotificationCategory | 'ALL' =
    activeTab === 'ALL' || activeTab === 'UNREAD' || activeTab === 'READ'
      ? 'ALL'
      : (activeTab as NotificationCategory);

  const readStatus: NotificationReadStatusFilter =
    activeTab === 'UNREAD' ? 'UNREAD' : activeTab === 'READ' ? 'READ' : 'ALL';

  const { data, isLoading, isError, refetch, isFetching } = useNotifications({
    page,
    limit,
    category: categoryFilter,
    readStatus,
    unreadOnly: activeTab === 'UNREAD',
    search: searchTerm.trim() || undefined,
    startDate: startDate ? new Date(`${startDate}T00:00:00.000Z`).toISOString() : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : undefined,
  });

  const { data: countData } = useUnreadNotificationCount(connectionState);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const notifications = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const unreadCount = countData?.unreadCount || 0;
  const categoryCounts = countData?.categoryCounts || {};

  const hasDateFilter = Boolean(startDate || endDate);

  const handleTabChange = (tab: NotificationTabKey) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleMarkAllRead = () => {
    const targetCat =
      activeTab !== 'ALL' && activeTab !== 'UNREAD' && activeTab !== 'READ'
        ? (activeTab as NotificationCategory)
        : undefined;
    markAllRead(targetCat);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setActiveTab('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts &amp; Communications</span>
            <span
              className={`ml-1 inline-flex items-center gap-1 normal-case text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                connectionState === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}
            >
              <Wifi className="w-2.5 h-2.5" />
              <span>
                {connectionState === 'connected' ? 'Real-Time Sync Active' : 'Polling Fallback Active'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {roleTitle}
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{roleSubtitle}</p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
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
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-200 hover:text-teal-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-teal-600" />
              <span>Mark all as read</span>
            </button>
          )}

          {historyUrl && (
            <Link
              href={historyUrl}
              className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
              title="Delivery Audit History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delivery History</span>
            </Link>
          )}

          <Link
            href={preferencesUrl}
            className="px-3 py-2 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs, Search & Date Filters */}
      <div className="space-y-3">
        <NotificationCategoryTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          categoryCounts={categoryCounts}
          totalCount={total}
          unreadCount={unreadCount}
          role={user?.role as UserRole | undefined}
        />

        <div className="flex flex-col md:flex-row md:items-center gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title or reference..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              aria-label="Search notifications"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter from date"
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter to date"
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg text-xs"
              />
            </div>

            {(searchTerm || hasDateFilter || activeTab !== 'ALL') && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List / Skeleton / Error / Empty */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-center space-y-2.5">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto" />
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-200">
              Could not load your notifications right now.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <NotificationEmptyState isUnreadOnly={activeTab === 'UNREAD'} />
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
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
            notifications
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
