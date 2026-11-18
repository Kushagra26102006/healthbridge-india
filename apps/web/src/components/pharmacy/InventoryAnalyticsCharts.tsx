'use client';

import React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShieldAlert,
  Archive,
  TrendingUp,
  ArrowDownToLine,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalyticsBarChart, AnalyticsDonutChart } from '@/components/analytics';
import type { PharmacyInventoryAnalyticsDto } from '@healthbridge/shared-types';

export interface InventoryAnalyticsChartsProps {
  analytics?: PharmacyInventoryAnalyticsDto | null;
  isLoading?: boolean;
}

export function InventoryAnalyticsCharts({
  analytics,
  isLoading = false,
}: InventoryAnalyticsChartsProps) {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"
          />
        ))}
      </div>
    );
  }

  const {
    estimatedValuation,
    quarantinedValuation,
    expiredValuation,
    dosageFormDistribution = [],
    stockStatusDistribution = [],
  } = analytics;

  const dosageData = dosageFormDistribution.map((df) => ({
    key: df.dosageForm,
    label: df.dosageForm,
    value: df.units,
  }));

  const statusData = stockStatusDistribution.map((st) => ({
    key: st.status,
    label: st.status.replace(/_/g, ' '),
    value: st.count,
  }));

  return (
    <div className="space-y-6">
      {/* Valuation Matrix Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                Financial Stock Valuation &amp; Segregation Rule
              </CardTitle>
              <CardDescription className="text-xs">
                Active stock valued strictly at purchase cost. Quarantined &amp; expired stocks are isolated.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/pharmacy/inventory/stock-in">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-7 gap-1">
                  <ArrowDownToLine className="w-3 h-3" /> Stock-In
                </Button>
              </Link>
              <Link href="/pharmacy/inventory/stock-adjustment">
                <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                  <SlidersHorizontal className="w-3 h-3" /> Adjust
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Primary Eligible Valuation */}
            <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-800 dark:text-teal-200 uppercase tracking-wider">
                  Eligible Stock Valuation
                </span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-teal-950 dark:text-teal-50 mt-2 font-mono">
                ₹{Number(estimatedValuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-1">
                ∑ (availableUnits × costPrice) for active &amp; dispensable inventory
              </p>
            </div>

            {/* Quarantined Valuation (Segregated) */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-200 uppercase tracking-wider">
                  Quarantined Value (Hold)
                </span>
                <ShieldAlert className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-950 dark:text-purple-50 mt-2 font-mono">
                ₹{Number(quarantinedValuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-1">
                Segregated from active book value pending quality resolution
              </p>
            </div>

            {/* Expired Stock Write-Off */}
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-200 uppercase tracking-wider">
                  Expired Stock (Write-Off)
                </span>
                <Archive className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-950 dark:text-rose-50 mt-2 font-mono">
                ₹{Number(expiredValuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1">
                Zero realizable value; designated for disposal or manufacturer credit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Interactive Dosage Form Donut & Stock Status Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsDonutChart
          title="Stock Distribution by Dosage Form"
          description="Available inventory units grouped by dosage form"
          centerLabel="Units"
          unit="units"
          data={dosageData}
          emptyTitle="No dosage data available"
        />

        <AnalyticsBarChart
          title="Inventory Status Breakdown"
          description="Batch distribution across healthy, low-stock, expiring, and quarantined statuses"
          orientation="horizontal"
          unit="batches"
          data={statusData}
          emptyTitle="No status data available"
        />
      </div>
    </div>
  );
}
export default InventoryAnalyticsCharts;
