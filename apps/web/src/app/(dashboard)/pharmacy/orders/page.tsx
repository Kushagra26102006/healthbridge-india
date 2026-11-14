'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  usePharmacyOrders,
  usePharmacyOrderMetrics,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  OrderSummaryCards,
  PharmacyOrderTable,
} from '@/components/pharmacy';
import {
  ShoppingCart,
  RefreshCw,
  Archive,
  Ban,
} from 'lucide-react';

export default function PharmacyOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const { data: metrics, isLoading: isMetricsLoading, refetch: refetchMetrics } =
    usePharmacyOrderMetrics();

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = usePharmacyOrders({
    page,
    limit: 20,
    status: selectedStatus,
    search: searchTerm,
  });

  const orders = ordersData?.items || [];
  const total = ordersData?.total || 0;

  const handleRefresh = () => {
    refetchMetrics();
    refetchOrders();
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Prescription Fulfillment Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Pharmacy Order Management & Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Accept doctor prescriptions, track clinical preparation, coordinate inventory dispensing, and verify patient counter pick-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pharmacy/orders/history"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            <Archive className="w-3.5 h-3.5 text-slate-500" />
            <span>Completed Archive</span>
          </Link>

          <Link
            href="/pharmacy/orders/cancelled"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            <Ban className="w-3.5 h-3.5 text-rose-500" />
            <span>Cancelled / Rejected</span>
          </Link>

          <button
            onClick={handleRefresh}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <OrderSummaryCards metrics={metrics} isLoading={isMetricsLoading} />

      {/* Order Queue Table */}
      <PharmacyOrderTable
        orders={orders}
        isLoading={isOrdersLoading}
        total={total}
        page={page}
        limit={20}
        onPageChange={(newPage) => setPage(newPage)}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
    </div>
  );
}
