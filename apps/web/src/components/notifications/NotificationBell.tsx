'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  useUnreadNotificationCount,
  useNotificationStream,
} from '@/features/notifications/hooks/use-notifications';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { NotificationDropdown } from './NotificationDropdown';
import type { UserRole } from '@healthbridge/shared-types';

interface NotificationBellProps {
  className?: string;
  customCenterUrl?: string;
  customPreferencesUrl?: string;
}

const ROLE_NOTIFICATION_ROUTES: Record<UserRole, { center: string; preferences: string }> = {
  PATIENT: {
    center: '/patient/notifications',
    preferences: '/patient/notifications/preferences',
  },
  DOCTOR: {
    center: '/doctor/notifications',
    preferences: '/doctor/notifications/preferences',
  },
  PHARMACY: {
    center: '/pharmacy/notifications',
    preferences: '/pharmacy/notifications/preferences',
  },
  LABORATORY: {
    center: '/laboratory/notifications',
    preferences: '/laboratory/notifications/preferences',
  },
  ADMIN: {
    center: '/admin/notifications',
    preferences: '/admin/notifications/preferences',
  },
};

export function NotificationBell({
  className = '',
  customCenterUrl,
  customPreferencesUrl,
}: NotificationBellProps) {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Initialize singleton SSE stream + cross-tab sync + narrowly scoped dashboard refresh
  const { connectionState } = useNotificationStream();
  const { data: countData } = useUnreadNotificationCount(connectionState);

  const unreadCount = countData?.unreadCount || 0;

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return () => {};

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Never display private notification content on public / unauthenticated views
  if (!isAuthenticated || !user) {
    return null;
  }

  const role = (user.role as UserRole) || 'PATIENT';
  const roleRoutes = ROLE_NOTIFICATION_ROUTES[role] || ROLE_NOTIFICATION_ROUTES.PATIENT;
  const centerUrl = customCenterUrl || roleRoutes.center;
  const preferencesUrl = customPreferencesUrl || roleRoutes.preferences;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
      </span>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full border-2 border-white dark:border-slate-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          centerUrl={centerUrl}
          preferencesUrl={preferencesUrl}
          connectionState={connectionState}
        />
      )}
    </div>
  );
}
