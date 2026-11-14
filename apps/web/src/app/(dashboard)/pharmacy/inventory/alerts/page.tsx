'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw, ArrowDownToLine } from 'lucide-react';
import { usePharmacyAlertsSummary } from '@/features/pharmacy/hooks/use-pharmacy';
import { LowStockAlert } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';

export default function PharmacyAlertsPage() {
  const { data: alerts, isLoading, refetch } = usePharmacyAlertsSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Operational Risk Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Critical Inventory Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Aggregated dashboard of low stock, out of stock, near expiry, and quarantined medicine lots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-9 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Link href="/pharmacy/inventory/stock-in">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 gap-1.5">
              <ArrowDownToLine className="w-3.5 h-3.5" /> Quick Stock-In
            </Button>
          </Link>
          <Link href="/pharmacy/inventory">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Inventory Home
            </Button>
          </Link>
        </div>
      </div>

      <LowStockAlert alerts={alerts || null} isLoading={isLoading} />
    </div>
  );
}
