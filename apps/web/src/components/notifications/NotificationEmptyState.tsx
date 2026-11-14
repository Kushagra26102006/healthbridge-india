'use client';

import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

interface NotificationEmptyStateProps {
  title?: string;
  description?: string;
  isUnreadOnly?: boolean;
}

export function NotificationEmptyState({
  title = 'No Notifications',
  description = 'You are all caught up! New clinical and operational updates will appear here.',
  isUnreadOnly = false,
}: NotificationEmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto my-6 space-y-3 shadow-xs">
      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
        {isUnreadOnly ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : (
          <Bell className="w-6 h-6 text-slate-400" />
        )}
      </div>
      <h3 className="text-sm font-bold text-slate-800">
        {isUnreadOnly ? 'No Unread Notifications' : title}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        {isUnreadOnly
          ? 'Great job! You have reviewed all notifications in this category.'
          : description}
      </p>
    </div>
  );
}
