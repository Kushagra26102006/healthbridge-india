'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AppointmentHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function AppointmentHeader({ onRefresh, isRefreshing = false }: AppointmentHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            My Appointments
          </h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Clinical Roster
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your consultation schedule and patient appointments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}

        <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shadow-sm">
          <Link href="/doctor/queue">
            <Users className="h-3.5 w-3.5" />
            Daily Patient Queue
          </Link>
        </Button>

        <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
          <Link href="/doctor/schedule">
            <Clock className="h-3.5 w-3.5" />
            Manage Availability
          </Link>
        </Button>
      </div>
    </div>
  );
}
