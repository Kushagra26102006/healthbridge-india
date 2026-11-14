'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  useNotificationUnreadCount,
  useRealTimeNotificationStream,
} from '@/features/notifications/hooks/use-notifications';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
  customCenterUrl?: string;
  customPreferencesUrl?: string;
}

export function NotificationBell({
  className = '',
  customCenterUrl,
  customPreferencesUrl,
}: NotificationBellProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize real-time SSE stream listener
  useRealTimeNotificationStream();

  const { data: countData } = useNotificationUnreadCount();
  const unreadCount = countData?.unreadCount || 0;

  // Determine role-aware notification center URL
  const role = user?.role || 'PATIENT';
  const centerUrl =
    customCenterUrl || (role === 'PHARMACY' ? '/pharmacy/notifications' : '/patient/notifications');
  const preferencesUrl =
    customPreferencesUrl ||
    (role === 'PHARMACY' ? '/pharmacy/notifications/preferences' : '/patient/notifications/preferences');

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full border-2 border-white">
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
        />
      )}
    </div>
  );
}
