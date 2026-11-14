'use client';

import React from 'react';
import type { PharmacyOrderMetricsDto } from '@healthbridge/shared-types';
import {
  ShoppingCart,
  Clock,
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface OrderSummaryCardsProps {
  metrics?: PharmacyOrderMetricsDto;
  isLoading?: boolean;
}

export function OrderSummaryCards({ metrics, isLoading = false }: OrderSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Orders',
      value: metrics?.totalOrders ?? 0,
      subtext: `${metrics?.todayOrdersCount ?? 0} received today`,
      icon: ShoppingCart,
      color: 'text-slate-900',
      bg: 'bg-white',
      border: 'border-slate-200',
    },
    {
      title: 'Pending Review',
      value: (metrics?.pendingCount ?? 0) + (metrics?.underReviewCount ?? 0),
      subtext: `${metrics?.pendingCount ?? 0} new, ${metrics?.underReviewCount ?? 0} in review`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50/40',
      border: 'border-amber-200',
    },
    {
      title: 'In Preparation',
      value: (metrics?.acceptedCount ?? 0) + (metrics?.processingCount ?? 0),
      subtext: `${metrics?.processingCount ?? 0} packing`,
      icon: Package,
      color: 'text-sky-600',
      bg: 'bg-sky-50/40',
      border: 'border-sky-200',
    },
    {
      title: 'Ready for Pickup',
      value: metrics?.readyForPickupCount ?? 0,
      subtext: 'Awaiting customer collection',
      icon: MapPin,
      color: 'text-teal-600',
      bg: 'bg-teal-50/40',
      border: 'border-teal-200',
    },
    {
      title: 'Completed Handover',
      value: metrics?.completedCount ?? 0,
      subtext: `Avg: ${metrics?.averageProcessingTimeHours ?? 2.5}h turnaround`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/40',
      border: 'border-emerald-200',
    },
    {
      title: 'Rejected / Cancelled',
      value: (metrics?.rejectedCount ?? 0) + (metrics?.cancelledCount ?? 0),
      subtext: `${metrics?.rejectedCount ?? 0} rejected, ${metrics?.cancelledCount ?? 0} cancelled`,
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50/40',
      border: 'border-rose-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-3.5 sm:p-4 rounded-xl border shadow-xs transition-all ${c.bg} ${c.border}`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>{c.title}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className={`text-xl sm:text-2xl font-bold mt-2 ${c.color}`}>
              {c.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {c.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}

