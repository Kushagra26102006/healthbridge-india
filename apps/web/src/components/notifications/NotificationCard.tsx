'use client';

import React from 'react';
import Link from 'next/link';
import {
  Pill,
  Package,
  AlertTriangle,
  ShoppingCart,
  ShieldAlert,
  Calendar,
  FileCheck,
  FlaskConical,
  Info,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import type { NotificationDto, NotificationCategory } from '@healthbridge/shared-types';

interface NotificationCardProps {
  notification: NotificationDto;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onNavigate?: () => void;
  isMarkingRead?: boolean;
}

function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return '';
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  onNavigate,
  isMarkingRead = false,
}: NotificationCardProps) {
  const getCategoryTheme = (category: NotificationCategory) => {
    switch (category) {
      case 'PRESCRIPTION':
        return {
          icon: <Pill className="w-4 h-4" />,
          bg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-900',
          dot: 'bg-sky-500',
        };
      case 'ORDER':
        return {
          icon: <Package className="w-4 h-4" />,
          bg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-900',
          dot: 'bg-teal-500',
        };
      case 'INVENTORY':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900',
          dot: 'bg-amber-500',
        };
      case 'PROCUREMENT':
        return {
          icon: <ShoppingCart className="w-4 h-4" />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900',
          dot: 'bg-indigo-500',
        };
      case 'SECURITY':
        return {
          icon: <ShieldAlert className="w-4 h-4" />,
          bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900',
          dot: 'bg-rose-500',
        };
      case 'APPOINTMENT':
        return {
          icon: <Calendar className="w-4 h-4" />,
          bg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-900',
          dot: 'bg-violet-500',
        };
      case 'CONSENT':
        return {
          icon: <FileCheck className="w-4 h-4" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900',
          dot: 'bg-emerald-500',
        };
      case 'LAB':
        return {
          icon: <FlaskConical className="w-4 h-4" />,
          bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900',
          dot: 'bg-purple-500',
        };
      case 'SYSTEM':
      default:
        return {
          icon: <Info className="w-4 h-4" />,
          bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700',
          dot: 'bg-slate-500',
        };
    }
  };

  const theme = getCategoryTheme(notification.category);
  const isUnread = !notification.isRead;
  const relativeTime = formatRelativeTime(notification.createdAt);
  const fullTimestamp = new Date(notification.createdAt).toLocaleString('en-IN');

  return (
    <article
      className={`p-4 rounded-xl border transition-all ${
        isUnread
          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600'
          : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-90'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Category Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${theme.bg}`}
          aria-hidden="true"
        >
          {theme.icon}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.bg}`}
              >
                {notification.category}
              </span>
              {isUnread ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                  Unread
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Read
                </span>
              )}
            </div>
            <time
              dateTime={notification.createdAt}
              title={fullTimestamp}
              className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0"
            >
              {relativeTime}
            </time>
          </div>

          <h4
            className={`text-xs sm:text-sm font-semibold truncate ${
              isUnread
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {notification.title}
          </h4>

          {/* Privacy-safe message */}
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          {/* Bottom Actions & Entity Link */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div>
              {notification.linkUrl ? (
                <Link
                  href={notification.linkUrl}
                  onClick={() => {
                    if (isUnread && onMarkRead) {
                      onMarkRead(notification.id);
                    }
                    onNavigate?.();
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : notification.relatedEntity?.referenceNumber ? (
                <span className="text-[11px] text-slate-400 font-mono">
                  Ref: {notification.relatedEntity.referenceNumber}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              {isUnread && onMarkRead && (
                <button
                  type="button"
                  onClick={() => onMarkRead(notification.id)}
                  disabled={isMarkingRead}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/70 dark:hover:bg-teal-950/60 rounded-md transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(notification.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                  title="Dismiss notification"
                  aria-label="Dismiss notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
