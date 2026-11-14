'use client';

import React, { useState, useMemo } from 'react';
import type { PharmacyOrderDto, PharmacyOrderStatus } from '@healthbridge/shared-types';
import {
  Search,
  ShoppingCart,
  User,
  Clock,
  Eye,
  CheckCircle2,
  Truck,
  Store,
} from 'lucide-react';

interface OrdersTableProps {
  orders: PharmacyOrderDto[];
  isLoading?: boolean;
  onSelectOrder: (order: PharmacyOrderDto) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  isLoading = false,
  onSelectOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesOrder = order.orderNumber.toLowerCase().includes(query);
        const matchesPatient = order.patientName.toLowerCase().includes(query);
        const matchesRx = order.prescriptionNumber?.toLowerCase().includes(query) ?? false;
        if (!matchesOrder && !matchesPatient && !matchesRx) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: PharmacyOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            Accepted
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Processing
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
            Ready for Pickup
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3" />
            Dispatched
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with Search and Status Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order #, patient or prescription..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
          {(
            [
              { label: 'All Orders', value: 'ALL' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Processing', value: 'PROCESSING' },
              { label: 'Ready', value: 'READY_FOR_PICKUP' },
              { label: 'Completed', value: 'COMPLETED' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Order Ref
              </th>
              <th scope="col" className="px-4 py-3.5">
                Patient Info
              </th>
              <th scope="col" className="px-4 py-3.5">
                Prescription
              </th>
              <th scope="col" className="px-4 py-3.5">
                Fulfillment
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Total Amount
              </th>
              <th scope="col" className="px-4 py-3.5 text-center">
                Status
              </th>
              <th scope="col" className="px-4 py-3.5">
                Date
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-5 py-4">
                    <div className="h-4 bg-slate-200 rounded w-28 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-16"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-20"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="h-8 bg-slate-200 rounded w-24 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : filteredOrders.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-800 mb-1">
                      No Orders Found
                    </h4>
                    <p className="text-xs text-slate-500">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'No orders match your filter criteria.'
                        : 'Your pharmacy has not processed any orders yet.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* Order Number */}
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-medium text-slate-900">
                      {order.orderNumber}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {order.items?.length || 0} items
                    </div>
                  </td>

                  {/* Patient Info */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.patientName}</span>
                    </div>
                    {order.patientPhone && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {order.patientPhone}
                      </div>
                    )}
                  </td>

                  {/* Linked Prescription */}
                  <td className="px-4 py-3.5 text-xs">
                    {order.prescriptionNumber ? (
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {order.prescriptionNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400">Direct OTC</span>
                    )}
                  </td>

                  {/* Fulfillment Type */}
                  <td className="px-4 py-3.5 text-xs text-slate-700">
                    {order.fulfillmentType === 'HOME_DELIVERY' ? (
                      <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium">
                        <Truck className="w-3.5 h-3.5" />
                        Delivery
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                        <Store className="w-3.5 h-3.5" />
                        In-Store Pickup
                      </span>
                    )}
                  </td>

                  {/* Total Amount */}
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                    ₹{order.totalAmount.toFixed(2)}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 text-center">
                    {getStatusBadge(order.status)}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {formatDate(order.createdAt)}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Order
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {!isLoading && filteredOrders.length > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-slate-700">{filteredOrders.length}</strong> of{' '}
            <strong className="text-slate-700">{orders.length}</strong> orders
          </span>
          <span className="text-[11px] text-slate-400">
            GST Invoice Compliant Billing Foundation
          </span>
        </div>
      )}
    </div>
  );
};
