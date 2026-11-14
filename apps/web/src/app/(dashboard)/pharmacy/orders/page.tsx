'use client';

import React, { useState } from 'react';
import { usePharmacyOrders } from '@/features/pharmacy/hooks/use-pharmacy';
import { OrdersTable, OrderDetailModal } from '@/components/pharmacy';
import type { PharmacyOrderDto } from '@healthbridge/shared-types';
import {
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';

export default function PharmacyOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<PharmacyOrderDto | null>(null);
  const { data: ordersData, isLoading, refetch } = usePharmacyOrders();

  const orders = ordersData?.items || [];
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const processingCount = orders.filter(
    (o) => o.status === 'PROCESSING' || o.status === 'ACCEPTED'
  ).length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Order Fulfillment</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Pharmacy Orders & Billing Foundation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor incoming prescription orders, track fulfillment states, and review billing invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Orders</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {orders.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged orders</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Pending Acceptance</div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">New orders</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">In Fulfillment</div>
          <div className="text-xl font-bold text-sky-600 mt-1">
            {processingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Processing / Packing</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Completed Volume</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            ₹{totalRevenue.toFixed(0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{completedCount} fulfilled</div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        onSelectOrder={(order) => setSelectedOrder(order)}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
