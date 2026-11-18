'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface NotificationSkeletonProps {
  count?: number;
  compact?: boolean;
  className?: string;
}

export function NotificationSkeleton({
  count = 4,
  compact = false,
  className,
}: NotificationSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading notifications"
      className={cn('space-y-2.5', className)}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            'rounded-lg border border-border bg-card animate-pulse flex items-start gap-3',
            compact ? 'p-3' : 'p-4'
          )}
        >
          <div className={cn('rounded-lg bg-muted shrink-0', compact ? 'h-8 w-8' : 'h-9 w-9')} />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3.5 w-24 rounded bg-muted" />
              <div className="h-3 w-14 rounded bg-muted" />
            </div>
            <div className="h-3.5 w-3/4 rounded bg-muted" />
            {!compact && <div className="h-3 w-1/2 rounded bg-muted" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default NotificationSkeleton;
