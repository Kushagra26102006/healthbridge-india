'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  usePatientOrders,
  useCancelPatientOrder,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PatientOrderCard } from '@/components/patient/PatientOrderCard';
import type { PharmacyOrderDto } from '@healthbridge/shared-types';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Package,
  AlertTriangle,
  Pill,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PATIENT_TABS = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'In Progress', value: 'PROCESSING' },
  { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function PatientOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Cancellation Modal State
  const [orderToCancel, setOrderToCancel] = useState<PharmacyOrderDto | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = usePatientOrders({
    page,
    limit: 12,
    status: selectedStatus,
    search: searchTerm,
  });

  const cancelMutation = useCancelPatientOrder();

  const orders = ordersData?.items || [];
  const total = ordersData?.total || 0;
  const totalPages = Math.ceil(total / 12) || 1;

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setCancelError('');

    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancelling this order.');
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        orderId: orderToCancel.id,
        dto: { reason: cancelReason.trim() },
      });
      setOrderToCancel(null);
      setCancelReason('');
      refetch();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel order.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Prescription Orders</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            My Pharmacy Orders & Fulfillment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track ordered medications, retrieve secure pickup codes, and monitor dispensing progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/patient/prescriptions"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Pill className="w-3.5 h-3.5" />
            <span>View Prescriptions</span>
          </Link>

          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {PATIENT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatus === tab.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order or pharmacy..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Pharmacy Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don&apos;t have any orders matching the current filter. Select an active prescription to order medications.
          </p>
          <div className="pt-2">
            <Link
              href="/patient/prescriptions"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Browse My Prescriptions</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <PatientOrderCard
              key={order.id}
              order={order}
              onCancelClick={(ord) => setOrderToCancel(ord)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Page <strong className="text-slate-900">{page}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Order Cancellation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cancel Order #{orderToCancel.orderNumber}?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  You can cancel this order prior to fulfillment. Once preparation starts, cancellation requires calling the pharmacy directly.
                </p>
              </div>
            </div>

            {cancelError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed mind, ordering from another pharmacy, no longer needed..."
                rows={3}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setOrderToCancel(null);
                  setCancelReason('');
                  setCancelError('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending || !cancelReason.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

