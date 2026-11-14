'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  RefreshCw,
  BookOpen,
  Boxes,
  ArrowDownToLine,
  SlidersHorizontal,
  History,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  usePharmacyInventory,
  usePharmacyInventoryAnalytics,
  useQuarantineBatch,
  useReleaseBatch,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  InventorySummaryCards,
  InventoryAnalyticsCharts,
  BatchTable,
  BatchDetailsModal,
  StockAdjustmentForm,
} from '@/components/pharmacy';
import { Button } from '@/components/ui/button';
import type { PharmacyInventoryItemDto } from '@healthbridge/shared-types';

export default function PharmacyInventoryPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<PharmacyInventoryItemDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustBatchId, setAdjustBatchId] = useState<string | undefined>();

  const { data: analytics, isLoading: isAnalyticsLoading, refetch: refetchAnalytics } =
    usePharmacyInventoryAnalytics();

  const { data: inventory, isLoading: isInventoryLoading, refetch: refetchInventory } =
    usePharmacyInventory({
      page,
      limit: 10,
      search: search || undefined,
      status: status !== 'ALL' ? (status as any) : undefined,
    });

  const quarantineMutation = useQuarantineBatch();
  const releaseMutation = useReleaseBatch();

  const handleRefresh = () => {
    refetchAnalytics();
    refetchInventory();
  };

  const handleSelectBatch = (batch: PharmacyInventoryItemDto) => {
    setSelectedBatch(batch);
    setIsDetailOpen(true);
  };

  const handleAdjustBatch = (batch: PharmacyInventoryItemDto) => {
    setAdjustBatchId(batch.id);
    setIsAdjustModalOpen(true);
  };

  const handleQuarantine = async (batch: PharmacyInventoryItemDto) => {
    const reason = prompt(`Enter quarantine reason for batch ${batch.batchNumber}:`, 'Quality investigation hold');
    if (reason && reason.trim().length >= 3) {
      await quarantineMutation.mutateAsync({
        inventoryId: batch.id,
        dto: { reason: reason.trim() },
      });
      handleRefresh();
    }
  };

  const handleRelease = async (batch: PharmacyInventoryItemDto) => {
    const reason = prompt(`Enter release authorization reason for batch ${batch.batchNumber}:`, 'Quality clearance verified');
    if (reason && reason.trim().length >= 3) {
      await releaseMutation.mutateAsync({
        inventoryId: batch.id,
        dto: { reason: reason.trim() },
      });
      handleRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>Medication Inventory &amp; Supply Chain</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Pharmacy Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            CDSCO compliant batch tracking, automated valuation, shelf-life monitoring, and immutable ledger control.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs h-9 gap-1.5"
            title="Refresh inventory metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Link href="/pharmacy/inventory/stock-adjustment">
            <Button variant="outline" size="sm" className="text-xs h-9 gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Stock
            </Button>
          </Link>
          <Link href="/pharmacy/inventory/stock-in">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 gap-1.5">
              <ArrowDownToLine className="w-3.5 h-3.5" /> Stock-In
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <Link href="/pharmacy/inventory/medicines">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 transition-colors shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-teal-500" /> Medicine Catalogue
          </div>
        </Link>
        <Link href="/pharmacy/inventory/batches">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 transition-colors shrink-0">
            <Boxes className="w-3.5 h-3.5 text-blue-500" /> All Batches
          </div>
        </Link>
        <Link href="/pharmacy/inventory/expiry">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 transition-colors shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> Expiry Horizons
          </div>
        </Link>
        <Link href="/pharmacy/inventory/alerts">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 transition-colors shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Stock Alerts
          </div>
        </Link>
        <Link href="/pharmacy/inventory/transactions">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 transition-colors shrink-0">
            <History className="w-3.5 h-3.5 text-purple-500" /> Audit Ledger
          </div>
        </Link>
      </div>

      {/* 8 Summary Metric Cards */}
      <InventorySummaryCards analytics={analytics} isLoading={isAnalyticsLoading} />

      {/* Financial Valuation & Distribution Charts */}
      <InventoryAnalyticsCharts analytics={analytics} isLoading={isAnalyticsLoading} />

      {/* Main Batches Table Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-4 h-4 text-teal-600" />
            Inventory Batch Explorer
          </h2>
          <Link href="/pharmacy/inventory/batches" className="text-xs text-teal-600 hover:underline font-medium">
            View All Batches →
          </Link>
        </div>

        <BatchTable
          batches={inventory?.items || []}
          total={inventory?.total || 0}
          page={page}
          limit={10}
          isLoading={isInventoryLoading}
          search={search}
          status={status}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          onStatusChange={(st) => {
            setStatus(st);
            setPage(1);
          }}
          onPageChange={(p) => setPage(p)}
          onSelectBatch={handleSelectBatch}
          onAdjustBatch={handleAdjustBatch}
          onQuarantineBatch={handleQuarantine}
          onReleaseBatch={handleRelease}
        />
      </div>

      {/* Batch Details Modal */}
      <BatchDetailsModal
        batch={selectedBatch}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAdjust={handleAdjustBatch}
        onQuarantine={handleQuarantine}
        onRelease={handleRelease}
      />

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <StockAdjustmentForm
              initialInventoryId={adjustBatchId}
              onSuccess={() => {
                setIsAdjustModalOpen(false);
                handleRefresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
