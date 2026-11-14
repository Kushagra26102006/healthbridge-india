'use client';

import React from 'react';
import {
  History,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  PharmacyInventoryTransactionDto,
  InventoryTransactionType,
} from '@healthbridge/shared-types';

export interface InventoryTransactionTableProps {
  transactions: PharmacyInventoryTransactionDto[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  search: string;
  transactionType: string;
  onSearchChange: (search: string) => void;
  onTypeChange: (type: string) => void;
  onPageChange: (newPage: number) => void;
}

export function InventoryTransactionTable({
  transactions,
  total,
  page,
  limit,
  isLoading = false,
  search,
  transactionType,
  onSearchChange,
  onTypeChange,
  onPageChange,
}: InventoryTransactionTableProps) {
  const totalPages = Math.ceil(total / limit) || 1;

  const txnTypes = [
    { value: 'ALL', label: 'All Transactions' },
    { value: 'STOCK_RECEIVED', label: 'Stock Received' },
    { value: 'STOCK_DISPENSED', label: 'Stock Dispensed' },
    { value: 'STOCK_ADJUSTED', label: 'Stock Adjusted' },
    { value: 'STOCK_DAMAGED', label: 'Stock Damaged' },
    { value: 'STOCK_EXPIRED', label: 'Expired Written-Off' },
    { value: 'STOCK_QUARANTINED', label: 'Quarantined' },
    { value: 'STOCK_RELEASED', label: 'Released Quarantine' },
  ];

  const getTypeBadge = (type: InventoryTransactionType) => {
    switch (type) {
      case 'STOCK_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> RECEIVED
          </span>
        );
      case 'STOCK_DISPENSED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <ArrowUpRight className="w-3 h-3 text-blue-600" /> DISPENSED
          </span>
        );
      case 'STOCK_ADJUSTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <SlidersHorizontal className="w-3 h-3 text-amber-600" /> ADJUSTED
          </span>
        );
      case 'STOCK_DAMAGED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="w-3 h-3 text-orange-600" /> DAMAGED
          </span>
        );
      case 'STOCK_EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-3 h-3 text-red-600" /> EXPIRED REMOVAL
          </span>
        );
      case 'STOCK_QUARANTINED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="w-3 h-3 text-purple-600" /> QUARANTINED
          </span>
        );
      case 'STOCK_RELEASED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <ShieldCheck className="w-3 h-3 text-teal-600" /> RELEASED
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 flex flex-wrap gap-2.5 items-center">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by transaction #, batch, medication, or reason..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={transactionType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {txnTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> Append-Only Immutable Ledger
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Txn Reference &amp; Date</th>
                <th className="py-3 px-4">Medication &amp; Batch #</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-center">Delta (Qty)</th>
                <th className="py-3 px-4 text-center">Stock Balance</th>
                <th className="py-3 px-4">Reason &amp; Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading audit ledger...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">No inventory transactions found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Transactions are automatically recorded whenever stock is received, adjusted, or dispensed.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {txn.transactionReference}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(txn.createdAt).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {txn.medicationName}
                      </div>
                      <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                        Batch: {txn.batchNumber}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getTypeBadge(txn.transactionType)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-mono font-bold text-sm ${
                          txn.quantityChange > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : txn.quantityChange < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-purple-600 dark:text-purple-400'
                        }`}
                      >
                        {txn.quantityChange > 0
                          ? `+${txn.quantityChange}`
                          : txn.quantityChange < 0
                          ? `${txn.quantityChange}`
                          : '0'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-xs">
                      <span className="text-slate-400">{txn.previousQuantity}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{txn.newQuantity}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-800 dark:text-slate-200">
                        {txn.reason}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        {txn.performedByName || 'Authorized Pharmacist'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            Showing <span className="font-medium text-slate-800 dark:text-slate-200">{transactions.length}</span> of{' '}
            <span className="font-medium text-slate-800 dark:text-slate-200">{total}</span> entries
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-7 text-xs px-2.5"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-7 text-xs px-2.5"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default InventoryTransactionTable;
