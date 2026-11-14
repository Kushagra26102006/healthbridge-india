'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  Inbox,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DoctorAppointmentSummaryCountsDto } from '@healthbridge/shared-types';

export interface AppointmentSummaryProps {
  summary?: DoctorAppointmentSummaryCountsDto;
  isLoading?: boolean;
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export function AppointmentSummary({
  summary,
  isLoading = false,
  activeFilter,
  onSelectFilter,
}: AppointmentSummaryProps) {
  const cards = [
    {
      key: 'today',
      title: "Today's Consults",
      count: summary?.today ?? 0,
      icon: Calendar,
      color: 'blue',
      borderColor: 'border-blue-500/30 hover:border-blue-500/60',
      activeBorder: 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20',
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    },
    {
      key: 'upcoming',
      title: 'Upcoming',
      count: summary?.upcoming ?? 0,
      icon: Clock,
      color: 'teal',
      borderColor: 'border-teal-500/30 hover:border-teal-500/60',
      activeBorder: 'border-teal-600 bg-teal-50/30 dark:bg-teal-950/20',
      iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    },
    {
      key: 'pending',
      title: 'Pending Requests',
      count: summary?.pending ?? 0,
      icon: Inbox,
      color: 'purple',
      borderColor: 'border-purple-500/30 hover:border-purple-500/60',
      activeBorder: 'border-purple-600 bg-purple-50/30 dark:bg-purple-950/20',
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    },
    {
      key: 'completed',
      title: 'Completed',
      count: summary?.completed ?? 0,
      icon: CheckCircle2,
      color: 'emerald',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      activeBorder: 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'cancelled',
      title: 'Cancelled',
      count: summary?.cancelled ?? 0,
      icon: XCircle,
      color: 'rose',
      borderColor: 'border-rose-500/30 hover:border-rose-500/60',
      activeBorder: 'border-rose-600 bg-rose-50/30 dark:bg-rose-950/20',
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.key;

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectFilter?.(card.key)}
            className="text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl group transition-all"
          >
            <Card
              className={cn(
                'border transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5',
                isActive ? card.activeBorder : card.borderColor
              )}
            >
              <CardContent className="p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className={cn('p-2 rounded-xl transition-colors', card.iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowRight
                    className={cn(
                      'h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5',
                      isActive && 'text-foreground font-bold'
                    )}
                  />
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">
                    {card.title}
                  </span>
                  {isLoading ? (
                    <div className="h-7 w-12 bg-muted animate-pulse rounded my-1" />
                  ) : (
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight block">
                      {card.count}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
