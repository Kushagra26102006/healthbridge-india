'use client';

import React from 'react';
import {
  Pill,
  Boxes,
  PackageCheck,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Archive,
} from 'lucide-react';
import type { PharmacyInventoryAnalyticsDto } from '@healthbridge/shared-types';

export interface InventorySummaryCardsProps {
  analytics?: PharmacyInventoryAnalyticsDto | null;
  isLoading?: boolean;
}

export function InventorySummaryCards({ analytics, isLoading = false }: InventorySummaryCardsProps) {
  const cards = [
    {
      title: 'Catalogue Medicines',
      value: analytics?.totalUniqueMedicines ?? 0,
      icon: Pill,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900',
      subtitle: 'Registered formulations',
    },
    {
      title: 'Active Batches',
      value: analytics?.totalActiveBatches ?? 0,
      icon: Boxes,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
      subtitle: 'Tracked lots in facility',
    },
    {
      title: 'Total Stock Units',
      value: analytics?.totalAvailableUnits ?? 0,
      icon: PackageCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      subtitle: 'Available for dispensing',
    },
    {
      title: 'Low Stock Batches',
      value: analytics?.lowStockBatchesCount ?? 0,
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      subtitle: 'At or below reorder level',
    },
    {
      title: 'Out of Stock',
      value: analytics?.outOfStockMedicinesCount ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
      subtitle: '0 available units',
    },
    {
      title: 'Near Expiry (<30d)',
      value: analytics?.nearExpiryBatchesCount ?? 0,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900',
      subtitle: 'Prioritize dispensing',
    },
    {
      title: 'Expired Batches',
      value: analytics?.expiredBatchesCount ?? 0,
      icon: Archive,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
      subtitle: 'Non-dispensable',
    },
    {
      title: 'Quarantined Batches',
      value: analytics?.quarantinedBatchesCount ?? 0,
      icon: ShieldAlert,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
      subtitle: 'Quality audit hold',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-xl border ${c.bg} transition-transform hover:-translate-y-0.5 duration-150`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {c.title}
              </span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
              ) : (
                c.value
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {c.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
export default InventorySummaryCards;
