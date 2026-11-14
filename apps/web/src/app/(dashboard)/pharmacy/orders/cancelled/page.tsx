'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePharmacyOrders } from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacyOrderTable } from '@/components/pharmacy';
import {
  Ban,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

export default function PharmacyOrdersCancelledPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<'CANCELLED' | 'REJECTED'>('CANCELLED');

  const { data: ordersData, isLoading, refetch } = usePharmacyOrders({
    page,
    limit: 20,
    status: filterType,
    search: searchTerm,
  });

  const orders = ordersData?.items || [];
  const total = ordersData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/pharmacy/orders"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Active Queue</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Ban className="w-6 h-6 text-rose-600" />
              <span>Cancelled & Rejected Orders Archive</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit history of orders rejected during clinical review or cancelled prior to handover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 p-0.5 bg-white text-xs">
            <button
              onClick={() => {
                setFilterType('CANCELLED');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterType === 'CANCELLED'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled
            </button>
            <button
              onClick={() => {
                setFilterType('REJECTED');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterType === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <PharmacyOrderTable
        orders={orders}
        isLoading={isLoading}
        total={total}
        page={page}
        limit={20}
        onPageChange={(newPage) => setPage(newPage)}
        selectedStatus={filterType}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setPage(1);
        }}
      />
    </div>
  );
}

