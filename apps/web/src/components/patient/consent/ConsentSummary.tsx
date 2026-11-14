'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ConsentSummaryMetricsDto } from '@healthbridge/shared-types';

export interface ConsentSummaryProps {
  summary?: ConsentSummaryMetricsDto;
  isLoading?: boolean;
}

export const ConsentSummary: React.FC<ConsentSummaryProps> = ({
  summary,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Pending Requests',
      count: summary?.pendingRequests ?? 0,
      description: 'Incoming access authorizations awaiting your decision',
      icon: Clock,
      href: '/patient/consent/requests',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      actionText: 'Review requests',
    },
    {
      title: 'Active Permissions',
      count: summary?.activePermissions ?? 0,
      description: 'Healthcare providers currently authorized to access data',
      icon: CheckCircle2,
      href: '/patient/consent',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      actionText: 'View active',
    },
    {
      title: 'Expiring Soon',
      count: summary?.expiringSoon ?? 0,
      description: 'Permissions scheduled to expire in the next 7 days',
      icon: AlertTriangle,
      href: '/patient/consent',
      textColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      actionText: 'Check expiry',
    },
    {
      title: 'Revoked Permissions',
      count: summary?.revokedPermissions ?? 0,
      description: 'Authorizations you explicitly terminated',
      icon: XCircle,
      href: '/patient/consent/history',
      textColor: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
      actionText: 'View history',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl ${card.bgColor} ${card.textColor} flex items-center justify-center`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {card.count}
                </span>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                href={card.href}
                className={`text-xs font-medium flex items-center gap-1 ${card.textColor} hover:underline`}
              >
                <span>{card.actionText}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
