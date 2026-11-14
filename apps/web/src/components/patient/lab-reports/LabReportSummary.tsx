'use client';

import React from 'react';
import { FlaskConical, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { LabReportSummaryMetricsDto } from '@healthbridge/shared-types';

export interface LabReportSummaryProps {
  summary?: LabReportSummaryMetricsDto;
  isLoading?: boolean;
}

export const LabReportSummary: React.FC<LabReportSummaryProps> = ({
  summary,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800"
          />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: 'Total Reports',
      value: summary?.total ?? 0,
      icon: FlaskConical,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10',
      description: 'All diagnostic panels',
    },
    {
      label: 'Completed Reports',
      value: summary?.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      description: 'Verified & available',
    },
    {
      label: 'Pending / Processing',
      value: summary?.pending ?? 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      description: 'Under laboratory review',
    },
    {
      label: 'Recent (Last 30 Days)',
      value: summary?.recentCount ?? 0,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      description: 'Latest test updates',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card
            key={item.label}
            className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
              <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                <IconComponent className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-2 space-y-0.5">
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {item.value}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
