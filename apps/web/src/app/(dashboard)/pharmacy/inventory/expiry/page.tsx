'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { usePharmacyExpiryReport } from '@/features/pharmacy/hooks/use-pharmacy';
import { ExpiryAlertTable } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';

export default function PharmacyExpiryPage() {
  const [horizon, setHorizon] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data: report, isLoading, refetch } = usePharmacyExpiryReport({
    horizon: horizon !== 'ALL' ? horizon : undefined,
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Shelf-Life Surveillance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Expiry Monitoring &amp; Reporting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time evaluation against current wall-clock date. Categorize lots by 7, 30, 90 day horizons or write-off expired stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-9 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Link href="/pharmacy/inventory">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Inventory Home
            </Button>
          </Link>
        </div>
      </div>

      <ExpiryAlertTable
        report={report || null}
        selectedHorizon={horizon}
        search={search}
        isLoading={isLoading}
        onHorizonChange={(h) => setHorizon(h)}
        onSearchChange={(s) => setSearch(s)}
      />
    </div>
  );
}
