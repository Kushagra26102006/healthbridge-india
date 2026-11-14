'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { PharmacyOrderDto } from '@healthbridge/shared-types';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
  Search,
  Eye,
  CheckSquare,
  Package,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface PharmacyOrderTableProps {
  orders: PharmacyOrderDto[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (newPage: number) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSelectOrder?: (order: PharmacyOrderDto) => void;
}

const TABS: Array<{ label: string; value: string; countBadge?: number }> = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'New / Pending', value: 'PENDING' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Partially Fulfilled', value: 'PARTIALLY_FULFILLED' },
  { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Archive / Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export function PharmacyOrderTable({
  orders,
  isLoading = false,
  total = 0,
  page = 1,
  limit = 20,
  onPageChange,
  selectedStatus = 'ALL',
  onStatusChange,
  searchTerm = '',
  onSearchChange,
  onSelectOrder,
}: PharmacyOrderTableProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(localSearch);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Status Filter Tabs */}
      <div className="border-b border-slate-200 px-4 pt-3 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onStatusChange && onStatusChange(tab.value)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap cursor-pointer border-b-2 -mb-px ${
                isActive
                  ? 'border-teal-600 text-teal-600 font-semibold bg-teal-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order #, patient name, prescription #..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onBlur={() => onSearchChange && onSearchChange(localSearch)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Showing <strong className="text-slate-900">{orders.length}</strong> of{' '}
            <strong className="text-slate-900">{total}</strong> orders
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Order Ref</th>
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Prescription</th>
              <th className="py-3 px-4">Items / Total</th>
              <th className="py-3 px-4">Fulfillment Type</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date Placed</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4">
                    <div className="h-4 bg-slate-100 rounded-sm w-full" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 px-4 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Package className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No orders found</p>
                    <p className="text-xs text-slate-400">
                      No pharmacy orders matched the current filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isPendingOrReview =
                  order.status === 'PENDING' || order.status === 'UNDER_REVIEW';
                const isReady = order.status === 'READY_FOR_PICKUP';
                const isProcessing =
                  order.status === 'ACCEPTED' ||
                  order.status === 'PROCESSING' ||
                  order.status === 'PARTIALLY_FULFILLED';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectOrder && onSelectOrder(order)}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      <Link
                        href={`/pharmacy/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-teal-600 underline-offset-2 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{order.patientName}</div>
                      {order.patientPhone && (
                        <div className="text-[11px] text-slate-400">{order.patientPhone}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {order.prescriptionNumber ? (
                        <span className="font-mono text-slate-700 font-medium">
                          #{order.prescriptionNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Direct Order</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        ₹{order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.items?.length || 0} medication{(order.items?.length || 0) === 1 ? '' : 's'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                        {order.fulfillmentType === 'HOME_DELIVERY' ? 'Home Delivery' : 'In-Store Pickup'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {isPendingOrReview && (
                          <Link
                            href={`/pharmacy/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Review
                          </Link>
                        )}

                        {isProcessing && (
                          <Link
                            href={`/pharmacy/orders/${order.id}/fulfillment`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                          >
                            <Package className="w-3.5 h-3.5" />
                            Fulfill
                          </Link>
                        )}

                        {isReady && (
                          <Link
                            href={`/pharmacy/orders/${order.id}/pickup`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Pickup
                          </Link>
                        )}

                        <Link
                          href={`/pharmacy/orders/${order.id}`}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30">
        <div>
          Page <strong className="text-slate-900">{page}</strong> of{' '}
          <strong className="text-slate-900">{totalPages}</strong>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange && onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <button
            onClick={() => onPageChange && onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
