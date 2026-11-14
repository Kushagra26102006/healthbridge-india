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
  isMarkingRead?: boolean;
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  isMarkingRead = false,
}: NotificationCardProps) {
  const getCategoryTheme = (category: NotificationCategory) => {
    switch (category) {
      case 'PRESCRIPTION':
        return {
          icon: <Pill className="w-4 h-4" />,
          bg: 'bg-sky-50 text-sky-700 border-sky-100',
          dot: 'bg-sky-500',
        };
      case 'ORDER':
        return {
          icon: <Package className="w-4 h-4" />,
          bg: 'bg-teal-50 text-teal-700 border-teal-100',
          dot: 'bg-teal-500',
        };
      case 'INVENTORY':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          dot: 'bg-amber-500',
        };
      case 'PROCUREMENT':
        return {
          icon: <ShoppingCart className="w-4 h-4" />,
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          dot: 'bg-indigo-500',
        };
      case 'SECURITY':
        return {
          icon: <ShieldAlert className="w-4 h-4" />,
          bg: 'bg-rose-50 text-rose-700 border-rose-100',
          dot: 'bg-rose-500',
        };
      case 'APPOINTMENT':
        return {
          icon: <Calendar className="w-4 h-4" />,
          bg: 'bg-violet-50 text-violet-700 border-violet-100',
          dot: 'bg-violet-500',
        };
      case 'CONSENT':
        return {
          icon: <FileCheck className="w-4 h-4" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          dot: 'bg-emerald-500',
        };
      case 'LAB':
        return {
          icon: <FlaskConical className="w-4 h-4" />,
          bg: 'bg-purple-50 text-purple-700 border-purple-100',
          dot: 'bg-purple-500',
        };
      case 'SYSTEM':
      default:
        return {
          icon: <Info className="w-4 h-4" />,
          bg: 'bg-slate-50 text-slate-700 border-slate-100',
          dot: 'bg-slate-500',
        };
    }
  };

  const theme = getCategoryTheme(notification.category);
  const isUnread = !notification.isRead;

  const formattedDate = new Date(notification.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isUnread
          ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          : 'bg-slate-50/60 border-slate-100 opacity-90'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Category Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${theme.bg}`}
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
              {isUnread && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-teal-600">
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                  Unread
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">{formattedDate}</span>
          </div>

          <h4
            className={`text-xs sm:text-sm font-semibold truncate ${
              isUnread ? 'text-slate-900 font-bold' : 'text-slate-700'
            }`}
          >
            {notification.title}
          </h4>

          {/* Privacy-safe message */}
          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          {/* Bottom Actions & Entity Link */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <div>
              {notification.linkUrl ? (
                <Link
                  href={notification.linkUrl}
                  className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700 hover:underline"
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50/70 rounded-md transition-colors"
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
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50/70 rounded-md transition-colors"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
