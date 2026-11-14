'use client';

import React from 'react';
import Link from 'next/link';
import {
  DollarSign,
  PieChart,
  ShieldAlert,
  Archive,
  Boxes,
  TrendingUp,
  ArrowDownToLine,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  const totalDosageUnits = dosageFormDistribution.reduce((acc, curr) => acc + curr.units, 0);

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

      {/* Grid: Dosage Form & Status Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dosage Form Distribution */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-600" />
              Stock Distribution by Dosage Form
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {dosageFormDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No dosage data available</p>
            ) : (
              dosageFormDistribution.map((df) => {
                const pct = totalDosageUnits > 0 ? ((df.units / totalDosageUnits) * 100).toFixed(0) : '0';
                return (
                  <div key={df.dosageForm} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {df.dosageForm} ({df.count} batches)
                      </span>
                      <span className="text-slate-500 font-mono">
                        {df.units} units ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-600" />
              Inventory Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {stockStatusDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No status data available</p>
            ) : (
              stockStatusDistribution.map((st) => (
                <div
                  key={st.status}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {st.status.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {st.count} batches
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default InventoryAnalyticsCharts;
