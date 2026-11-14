'use client';

import React from 'react';
import {
  Search,
  PlusCircle,
  Eye,
  CheckCircle,
  ArrowDownToLine,
  Send,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { PurchaseOrderDto, PurchaseOrderFilterDto } from '@healthbridge/shared-types';

export interface PurchaseOrderTableProps {
  orders: PurchaseOrderDto[];
  isLoading?: boolean;
  filters: PurchaseOrderFilterDto;
  onFilterChange: (filters: PurchaseOrderFilterDto) => void;
  onViewOrder: (order: PurchaseOrderDto) => void;
  onReceiveGoods?: (order: PurchaseOrderDto) => void;
  onApproveOrder?: (order: PurchaseOrderDto) => void;
  onRejectOrder?: (order: PurchaseOrderDto) => void;
  onSendOrder?: (order: PurchaseOrderDto) => void;
  onCancelOrder?: (order: PurchaseOrderDto) => void;
  onAddNew?: () => void;
  totalPages?: number;
  totalCount?: number;
}

export function PurchaseOrderTable({
  orders,
  isLoading = false,
  filters,
  onFilterChange,
  onViewOrder,
  onReceiveGoods,
  onApproveOrder,
  onSendOrder,
  onAddNew,
  totalPages = 1,
  totalCount = 0,
}: PurchaseOrderTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Draft
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pending Approval
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Approved
          </Badge>
        );
      case 'SENT_TO_SUPPLIER':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Dispatched to Supplier
          </Badge>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Partially Received
          </Badge>
        );
      case 'FULLY_RECEIVED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Fully Received
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Cancelled
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search PO #, supplier, or items..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filters.status || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as any,
                page: 1,
              })
            }
            className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="SENT_TO_SUPPLIER">Sent to Supplier</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="FULLY_RECEIVED">Fully Received</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {onAddNew && (
            <Button
              onClick={onAddNew}
              className="bg-teal-600 hover:bg-teal-700 text-white shrink-0 gap-1.5 h-9"
            >
              <PlusCircle className="w-4 h-4" />
              New Purchase Order
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">PO Number & Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items / SKU</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Order Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading purchase orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">
                        No purchase orders found
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {filters.search || filters.status !== 'ALL'
                          ? 'Try adjusting your search criteria or status filter.'
                          : 'Create your first purchase order to replenish medications and manage stock intake.'}
                      </p>
                      {onAddNew && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onAddNew}
                          className="mt-2 text-teal-600 hover:text-teal-700"
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1" />
                          Create Purchase Order
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((po) => {
                  const canReceive = ['APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED'].includes(
                    po.status
                  );
                  const canApprove = po.status === 'PENDING_APPROVAL';
                  const canSend = po.status === 'APPROVED';

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-mono font-bold text-slate-900 dark:text-white">
                            {po.poNumber}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(po.orderDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                            {po.supplierName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {po.supplierCode}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {po.items.length} {po.items.length === 1 ? 'Medication' : 'Medications'}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {po.items.reduce((s, it) => s + it.orderedQuantity, 0)} total units
                        </p>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {po.expectedDeliveryDate ? (
                          new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        ) : (
                          <span className="text-slate-400 italic">Net {po.paymentTermsDays}d</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{po.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {po.discountTotal > 0 && (
                          <p className="text-[11px] text-emerald-600">
                            -₹{po.discountTotal.toFixed(2)} discount
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(po.status)}</td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewOrder(po)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="View PO Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {canReceive && onReceiveGoods && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReceiveGoods(po)}
                              className="h-8 px-2 text-xs text-teal-600 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 gap-1"
                              title="Receive Goods"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                              Receive
                            </Button>
                          )}

                          {canSend && onSendOrder && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSendOrder(po)}
                              className="h-8 px-2 text-xs text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1"
                              title="Send to Supplier"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Send
                            </Button>
                          )}

                          {canApprove && onApproveOrder && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onApproveOrder(po)}
                              className="h-8 px-2 text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                              title="Approve Order"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </Button>
                          )}
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
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Showing {orders.length} of {totalCount} orders
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={Number(filters.page || 1) <= 1}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    page: Math.max(1, Number(filters.page || 1) - 1),
                  })
                }
                className="h-7 px-2 text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-medium">
                Page {filters.page || 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={Number(filters.page || 1) >= totalPages}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    page: Number(filters.page || 1) + 1,
                  })
                }
                className="h-7 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
