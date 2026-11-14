'use client';

import React from 'react';
import { Calendar, FileEdit, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { EncounterSummaryCountsDto } from '@healthbridge/shared-types';

export interface EncounterSummaryProps {
  summary?: EncounterSummaryCountsDto;
  activeFilter?: 'all' | 'today' | 'draft' | 'completed' | 'pending';
  onFilterSelect?: (filter: 'all' | 'today' | 'draft' | 'completed' | 'pending') => void;
}

export function EncounterSummary({
  summary,
  activeFilter = 'all',
  onFilterSelect,
}: EncounterSummaryProps) {
  const cards = [
    {
      id: 'today' as const,
      label: "Today's Encounters",
      count: summary?.today ?? 0,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50/60 dark:bg-blue-950/20',
      activeBorder: 'border-blue-500/80 ring-1 ring-blue-500/20',
    },
    {
      id: 'draft' as const,
      label: 'Draft Encounters',
      count: summary?.draft ?? 0,
      icon: FileEdit,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50/60 dark:bg-amber-950/20',
      activeBorder: 'border-amber-500/80 ring-1 ring-amber-500/20',
    },
    {
      id: 'completed' as const,
      label: 'Completed Encounters',
      count: summary?.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50/60 dark:bg-emerald-950/20',
      activeBorder: 'border-emerald-500/80 ring-1 ring-emerald-500/20',
    },
    {
      id: 'pending' as const,
      label: 'Pending Documentation',
      count: summary?.pendingDocumentation ?? 0,
      icon: AlertCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50/60 dark:bg-rose-950/20',
      activeBorder: 'border-rose-500/80 ring-1 ring-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <Card
            key={card.id}
            onClick={() => onFilterSelect?.(isActive ? 'all' : card.id)}
            className={cn(
              'border cursor-pointer transition-all hover:shadow-sm p-4 relative overflow-hidden',
              isActive
                ? cn('bg-card', card.activeBorder)
                : 'border-border/70 bg-card hover:border-border'
            )}
          >
            <CardContent className="p-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  {card.label}
                </span>
                <div className={cn('p-1.5 rounded-lg', card.bgColor)}>
                  <Icon className={cn('h-3.5 w-3.5', card.color)} />
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
                  {card.count}
                </span>
                {isActive && (
                  <span className="text-[10px] font-bold text-blue-600 uppercase">
                    Active Filter
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
