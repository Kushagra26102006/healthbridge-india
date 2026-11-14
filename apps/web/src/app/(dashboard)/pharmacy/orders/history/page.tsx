'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePharmacyOrders } from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacyOrderTable } from '@/components/pharmacy';
import {
  Archive,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

export default function PharmacyOrdersHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data: ordersData, isLoading, refetch } = usePharmacyOrders({
    page,
    limit: 20,
    status: 'COMPLETED',
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
              <Archive className="w-6 h-6 text-teal-600" />
              <span>Completed Orders Archive</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Historical log of all successfully fulfilled and handed-over prescription orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Completed Orders Table */}
      <PharmacyOrderTable
        orders={orders}
        isLoading={isLoading}
        total={total}
        page={page}
        limit={20}
        onPageChange={(newPage) => setPage(newPage)}
        selectedStatus="COMPLETED"
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setPage(1);
        }}
      />
    </div>
  );
}
