'use client';

import React from 'react';
import {
  FileText,
  Search,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { PurchaseInvoiceDto, InvoiceFilterDto } from '@healthbridge/shared-types';

export interface PurchaseInvoiceTableProps {
  invoices: PurchaseInvoiceDto[];
  isLoading?: boolean;
  filters: InvoiceFilterDto;
  onFilterChange: (filters: InvoiceFilterDto) => void;
  onReconcileInvoice?: (invoice: PurchaseInvoiceDto) => void;
  onDisputeInvoice?: (invoice: PurchaseInvoiceDto) => void;
  onAddNew?: () => void;
  totalPages?: number;
  totalCount?: number;
}

export function PurchaseInvoiceTable({
  invoices,
  isLoading = false,
  filters,
  onFilterChange,
  onReconcileInvoice,
  onDisputeInvoice,
  onAddNew,
}: PurchaseInvoiceTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pending Reconciliation
          </Badge>
        );
      case 'PARTIALLY_RECONCILED':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Partially Reconciled
          </Badge>
        );
      case 'RECONCILED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Reconciled
          </Badge>
        );
      case 'DISPUTED':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Disputed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Cancelled
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
            placeholder="Search invoice #, PO #, or supplier..."
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
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Reconciliation</option>
            <option value="RECONCILED">Reconciled</option>
            <option value="DISPUTED">Disputed</option>
          </select>

          {onAddNew && (
            <Button
              onClick={onAddNew}
              className="bg-teal-600 hover:bg-teal-700 text-white shrink-0 gap-1.5 h-9"
            >
              <PlusCircle className="w-4 h-4" />
              Record Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice # & Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">PO & GRN References</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Invoice Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-300 text-xs">
                      No invoices recorded
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Record supplier invoices against purchase orders and goods receipt notes to reconcile balances.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                        {inv.supplierName}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-xs font-mono">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {inv.poNumber}
                      </span>
                      {inv.grnNumbers && inv.grnNumbers.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          GRN: {inv.grnNumbers.join(', ')}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {inv.dueDate ? (
                        new Date(inv.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      ) : (
                        <span className="text-slate-400 italic">Net 30</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(inv.status)}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status === 'PENDING' && onReconcileInvoice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReconcileInvoice(inv)}
                            className="h-8 px-2 text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            Reconcile
                          </Button>
                        )}
                        {inv.status === 'PENDING' && onDisputeInvoice && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDisputeInvoice(inv)}
                            className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            Dispute
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
