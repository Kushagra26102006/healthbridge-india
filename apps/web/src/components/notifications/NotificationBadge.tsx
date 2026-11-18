'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface NotificationBadgeProps {
  count: number;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Reusable accessible unread notification counter badge (caps display at `99+`).
 * Automatically disables ping animation under `prefers-reduced-motion`.
 */
export function NotificationBadge({
  count,
  pulse = true,
  size = 'sm',
  className,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const display = count > 99 ? '99+' : String(count);

  return (
    <span
      aria-label={`${count} unread notifications`}
      className={cn('relative inline-flex items-center justify-center', className)}
    >
      {pulse && (
        <span
          aria-hidden="true"
          className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-pill bg-rose-400 opacity-70"
        />
      )}
      <span
        className={cn(
          'relative inline-flex items-center justify-center rounded-pill bg-rose-600 font-bold text-white tabular-nums border-2 border-card',
          size === 'sm' ? 'min-w-[18px] h-[18px] px-1 text-[10px]' : 'min-w-[22px] h-[22px] px-1.5 text-xs'
        )}
      >
        {display}
      </span>
    </span>
  );
}

export default NotificationBadge;
