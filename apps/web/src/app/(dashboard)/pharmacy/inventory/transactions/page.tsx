'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { History, ArrowLeft, RefreshCw } from 'lucide-react';
import { usePharmacyTransactions } from '@/features/pharmacy/hooks/use-pharmacy';
import { InventoryTransactionTable } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';

export default function PharmacyTransactionsPage() {
  const [search, setSearch] = useState('');
  const [transactionType, setTransactionType] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = usePharmacyTransactions({
    page,
    limit: 20,
    search: search || undefined,
    transactionType: transactionType !== 'ALL' ? (transactionType as any) : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <History className="w-3.5 h-3.5" />
            <span>Immutable Audit Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Inventory Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Append-only financial and clinical ledger recording every stock movement, cycle count, and dispensation.
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

      <InventoryTransactionTable
        transactions={data?.items || []}
        total={data?.total || 0}
        page={page}
        limit={20}
        isLoading={isLoading}
        search={search}
        transactionType={transactionType}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        onTypeChange={(t) => {
          setTransactionType(t);
          setPage(1);
        }}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
