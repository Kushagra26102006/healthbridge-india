'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Boxes,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowDownToLine,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PharmacyInventoryItemDto } from '@healthbridge/shared-types';

export interface BatchTableProps {
  batches: PharmacyInventoryItemDto[];
  total: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  search: string;
  status: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onPageChange: (newPage: number) => void;
  onSelectBatch?: (batch: PharmacyInventoryItemDto) => void;
  onAdjustBatch?: (batch: PharmacyInventoryItemDto) => void;
  onQuarantineBatch?: (batch: PharmacyInventoryItemDto) => void;
  onReleaseBatch?: (batch: PharmacyInventoryItemDto) => void;
}

export function BatchTable({
  batches,
  total,
  page,
  limit,
  isLoading = false,
  search,
  status,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onSelectBatch,
  onAdjustBatch,
  onQuarantineBatch,
  onReleaseBatch,
}: BatchTableProps) {
  const totalPages = Math.ceil(total / limit) || 1;

  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'IN_STOCK', label: 'In Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
    { value: 'NEAR_EXPIRY', label: 'Near Expiry' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'QUARANTINED', label: 'Quarantined' },
  ];

  const getStatusBadge = (batch: PharmacyInventoryItemDto) => {
    const now = new Date();
    const expiry = new Date(batch.expiryDate);
    const isExpired = expiry < now;

    if (batch.isQuarantined || batch.status === 'QUARANTINED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <ShieldAlert className="w-3 h-3" /> QUARANTINED
        </span>
      );
    }
    if (isExpired || batch.status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-3 h-3" /> EXPIRED
        </span>
      );
    }
    if (batch.availableQuantity === 0 || batch.status === 'OUT_OF_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          OUT OF STOCK
        </span>
      );
    }
    if (batch.availableQuantity <= batch.reorderLevel || batch.status === 'LOW_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          LOW STOCK
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        IN STOCK
      </span>
    );
  };

  const getExpiryCountdown = (expiryDateStr: string) => {
    const now = new Date();
    const expiry = new Date(expiryDateStr);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">Expired</span>;
    }
    if (diffDays <= 30) {
      return (
        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          {diffDays} days left
        </span>
      );
    }
    return (
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        {expiry.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 flex flex-wrap gap-2.5 items-center">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by batch #, medicine name, generic, or rack..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pharmacy/inventory/stock-adjustment">
            <Button variant="outline" className="text-xs h-9 gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Stock
            </Button>
          </Link>
          <Link href="/pharmacy/inventory/stock-in">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs h-9 gap-1.5">
              <ArrowDownToLine className="w-3.5 h-3.5" /> Stock-In
            </Button>
          </Link>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Batch # &amp; Location</th>
                <th className="py-3 px-4">Medicine &amp; Strength</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4">Expiry Horizon</th>
                <th className="py-3 px-4 text-right">Pricing (₹)</th>
                <th className="py-3 px-4 text-center">Batch Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading inventory batches...</p>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">No inventory batches found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Try adjusting your search query or filters' : 'Record your first stock intake'}
                    </p>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-teal-600 dark:text-teal-400">
                        {batch.batchNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {batch.rackLocation || 'Unassigned Rack'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {batch.medicationName}
                        <span className="text-[11px] font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {batch.strength}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {batch.dosageForm} • {batch.genericName || 'Generic'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-base text-slate-900 dark:text-white">
                        {batch.availableQuantity}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Reorder: {batch.reorderLevel}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>{getExpiryCountdown(batch.expiryDate)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(batch.expiryDate).toLocaleDateString('en-IN')}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="font-medium text-slate-900 dark:text-white">
                        ₹{Number(batch.sellingPrice).toFixed(2)}
                      </div>
                      {batch.purchasePrice !== undefined && (
                        <div className="text-[10px] text-slate-400">
                          Cost: ₹{Number(batch.purchasePrice).toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(batch)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onSelectBatch && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectBatch(batch)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-teal-600"
                            title="Batch Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {onAdjustBatch && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAdjustBatch(batch)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600"
                            title="Adjust Stock"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {batch.isQuarantined || batch.status === 'QUARANTINED' ? (
                          onReleaseBatch && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onReleaseBatch(batch)}
                              className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                              title="Release from Quarantine"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </Button>
                          )
                        ) : (
                          onQuarantineBatch && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onQuarantineBatch(batch)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-purple-600"
                              title="Quarantine Batch"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </Button>
                          )
                        )}
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
            Showing <span className="font-medium text-slate-800 dark:text-slate-200">{batches.length}</span> of{' '}
            <span className="font-medium text-slate-800 dark:text-slate-200">{total}</span> batches
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
export default BatchTable;
