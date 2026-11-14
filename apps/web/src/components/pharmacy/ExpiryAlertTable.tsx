'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  AlertTriangle,
  Calendar,
  Search,
  SlidersHorizontal,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  PharmacyExpiryReportSummaryDto,
  PharmacyExpiryReportItemDto,
} from '@healthbridge/shared-types';

export interface ExpiryAlertTableProps {
  report: PharmacyExpiryReportSummaryDto | null;
  selectedHorizon: string;
  search: string;
  isLoading?: boolean;
  onHorizonChange: (horizon: string) => void;
  onSearchChange: (search: string) => void;
}

export function ExpiryAlertTable({
  report,
  selectedHorizon,
  search,
  isLoading = false,
  onHorizonChange,
  onSearchChange,
}: ExpiryAlertTableProps) {
  const horizons: { id: string; label: string; count?: number; color: string }[] = [
    { id: 'ALL', label: 'All Batches', count: report?.items?.length, color: 'text-slate-700' },
    { id: 'EXPIRED', label: 'Expired', count: report?.expiredCount, color: 'text-red-600' },
    { id: 'EXPIRING_7_DAYS', label: 'Next 7 Days', count: report?.expiring7DaysCount, color: 'text-orange-600' },
    { id: 'EXPIRING_30_DAYS', label: 'Within 30 Days', count: report?.expiring30DaysCount, color: 'text-amber-600' },
    { id: 'EXPIRING_90_DAYS', label: 'Within 90 Days', count: report?.expiring90DaysCount, color: 'text-yellow-600' },
    { id: 'SAFE', label: 'Safe (>90 Days)', count: report?.safeCount, color: 'text-emerald-600' },
  ];

  const getHorizonBadge = (item: PharmacyExpiryReportItemDto) => {
    switch (item.horizon) {
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
            <AlertTriangle className="w-3 h-3" /> EXPIRED ({Math.abs(item.daysUntilExpiry)}d ago)
          </span>
        );
      case 'EXPIRING_7_DAYS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
            <Clock className="w-3 h-3" /> {item.daysUntilExpiry} DAYS REMAINING
          </span>
        );
      case 'EXPIRING_30_DAYS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Calendar className="w-3 h-3" /> {item.daysUntilExpiry} DAYS REMAINING
          </span>
        );
      case 'EXPIRING_90_DAYS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800">
            {item.daysUntilExpiry} DAYS REMAINING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            SAFE ({item.daysUntilExpiry}d)
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
              Expired Batches (Write-Off)
            </span>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
              {report?.expiredCount || 0} batches
            </div>
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5 font-medium">
              {report?.expiredUnits || 0} non-dispensable units
            </p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500/80 shrink-0" />
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Expiring Within 30 Days
            </span>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
              {(report?.expiring7DaysCount || 0) + (report?.expiring30DaysCount || 0)} batches
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              {report?.expiring30DaysUnits || 0} units nearing shelf life
            </p>
          </div>
          <Clock className="w-8 h-8 text-amber-500/80 shrink-0" />
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Safe Batches (&gt;90 Days)
            </span>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
              {report?.safeCount || 0} batches
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Regular active inventory
            </p>
          </div>
          <Boxes className="w-8 h-8 text-emerald-500/80 shrink-0" />
        </div>
      </div>

      {/* Horizon Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Horizon Pills */}
          <div className="flex flex-wrap gap-1.5">
            {horizons.map((h) => (
              <button
                key={h.id}
                onClick={() => onHorizonChange(h.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  selectedHorizon === h.id
                    ? 'bg-teal-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {h.label} {h.count !== undefined && `(${h.count})`}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search expiring batch..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 text-xs h-8 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Medication &amp; Form</th>
                <th className="py-3 px-4 text-center">Available Units</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Horizon Classification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Evaluating real-time expiry dates...</p>
                  </td>
                </tr>
              ) : !report?.items || report.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">No batches in this expiry horizon</p>
                    <p className="text-xs text-slate-400 mt-1">
                      All inventory items are currently outside this warning horizon.
                    </p>
                  </td>
                </tr>
              ) : (
                report.items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {item.batchNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.medicationName} ({item.strength})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.dosageForm} • {item.rackLocation ? `Rack: ${item.rackLocation}` : 'No Rack'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-base text-slate-900 dark:text-white">
                      {item.availableQuantity}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {new Date(item.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getHorizonBadge(item)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/pharmacy/inventory/stock-adjustment?inventoryId=${item.inventoryId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 gap-1"
                          >
                            <SlidersHorizontal className="w-3 h-3" /> Adjust / Write-Off
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default ExpiryAlertTable;
