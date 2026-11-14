'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@healthbridge/shared-types';

export interface QueueStatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function QueueStatusBadge({ status, className }: QueueStatusBadgeProps) {
  switch (status) {
    case 'IN_PROGRESS':
      return (
        <Badge
          className={cn(
            'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/40 text-xs font-semibold px-2.5 py-0.5 animate-pulse',
            className
          )}
        >
          In Consultation
        </Badge>
      );
    case 'CHECKED_IN':
      return (
        <Badge
          className={cn(
            'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-semibold px-2.5 py-0.5',
            className
          )}
        >
          Waiting in Clinic
        </Badge>
      );
    case 'CONFIRMED':
      return (
        <Badge
          className={cn(
            'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/40 text-xs font-semibold px-2.5 py-0.5',
            className
          )}
        >
          Confirmed
        </Badge>
      );
    case 'REQUESTED':
      return (
        <Badge
          className={cn(
            'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/40 text-xs font-semibold px-2.5 py-0.5',
            className
          )}
        >
          Pending Request
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge
          className={cn(
            'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-2.5 py-0.5',
            className
          )}
        >
          Completed
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="destructive" className={cn('text-xs px-2.5 py-0.5', className)}>
          Cancelled
        </Badge>
      );
    case 'NO_SHOW':
      return (
        <Badge variant="outline" className={cn('text-xs px-2.5 py-0.5 text-rose-500 border-rose-300', className)}>
          No Show
        </Badge>
      );
    case 'SCHEDULED':
    default:
      return (
        <Badge variant="secondary" className={cn('text-xs px-2.5 py-0.5', className)}>
          Scheduled
        </Badge>
      );
  }
}
