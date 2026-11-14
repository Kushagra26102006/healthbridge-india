'use client';

import React from 'react';
import { Truck, ShoppingBag, Clock, AlertCircle, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProcurementMetricsDto } from '@healthbridge/shared-types';

export interface ProcurementSummaryCardsProps {
  metrics?: ProcurementMetricsDto;
  isLoading?: boolean;
}

export function ProcurementSummaryCards({
  metrics,
  isLoading = false,
}: ProcurementSummaryCardsProps) {
  const cards = [
    {
      title: 'Active Suppliers',
      value: isLoading ? '...' : (metrics?.activeSuppliers ?? 0).toString(),
      subtext: `${metrics?.totalSuppliers ?? 0} registered`,
      icon: Truck,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Open Purchase Orders',
      value: isLoading ? '...' : (metrics?.openPurchaseOrders ?? 0).toString(),
      subtext: `${metrics?.partiallyReceivedOrders ?? 0} partially received`,
      icon: ShoppingBag,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      title: 'Pending Approval',
      value: isLoading ? '...' : (metrics?.pendingApprovalOrders ?? 0).toString(),
      subtext: 'Requires supervisor sign-off',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: 'Reorder Suggestions',
      value: isLoading ? '...' : (metrics?.replenishmentSuggestionsCount ?? 0).toString(),
      subtext: 'Stock below threshold',
      icon: AlertCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/50',
    },
    {
      title: 'Procurement Spend',
      value: isLoading
        ? '...'
        : `₹${((metrics?.monthlySpendTotal ?? 0) / 100).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      subtext: `${metrics?.pendingInvoicesCount ?? 0} unpaid invoices`,
      icon: IndianRupee,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card key={i} className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bgColor} ${card.color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {card.title}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {card.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

