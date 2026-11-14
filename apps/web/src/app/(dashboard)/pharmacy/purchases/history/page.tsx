'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  Eye,
  RefreshCw,
  ArrowDownToLine,
} from 'lucide-react';
import { useGoodsReceipts } from '@/features/pharmacy/hooks/use-pharmacy';
import { GoodsReceiptDetailsModal } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GoodsReceiptDto, GoodsReceiptFilterDto } from '@healthbridge/shared-types';

export default function GoodsReceiptHistoryPage() {
  const [filters, setFilters] = useState<GoodsReceiptFilterDto>({
    page: 1,
    limit: 10,
    search: '',
  });

  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceiptDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: response, isLoading, refetch } = useGoodsReceipts(filters);

  const handleViewReceipt = (receipt: GoodsReceiptDto) => {
    setSelectedReceipt(receipt);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Goods Receipt Notes (GRN) & Intake Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete CDSCO-compliant receiving audit trail for all verified batches, invoices, and physical stock intakes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 h-9"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Link href="/pharmacy/purchases">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9">
              <ArrowDownToLine className="w-4 h-4" />
              Receive New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search GRN #, PO #, invoice #, supplier..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">GRN # & Date</th>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier & Invoice</th>
                <th className="py-3 px-4">Received / Accepted</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4">Invoice Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading goods receipts...
                  </td>
                </tr>
              ) : !response?.data || response.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <FileCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-300 text-xs">
                      No goods receipt notes recorded
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      When purchase orders arrive and are verified, the generated GRN intake audit notes appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                response.data.map((grn) => (
                  <tr
                    key={grn.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">
                          {grn.grnNumber}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(grn.receivedDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <Link href={`/pharmacy/purchases/${grn.purchaseOrderId}`} className="hover:underline">
                        {grn.poNumber}
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                        {grn.supplierName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Inv: {grn.supplierInvoiceNumber}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <span className="font-medium text-emerald-600">
                        {grn.totalAcceptedQuantity} units accepted
                      </span>
                      {grn.totalRejectedQuantity > 0 && (
                        <p className="text-[11px] text-rose-500">
                          ({grn.totalRejectedQuantity} rejected)
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {grn.receiverName}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      ₹{grn.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewReceipt(grn)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title="View GRN Note"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GoodsReceiptDetailsModal
        receipt={selectedReceipt}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
