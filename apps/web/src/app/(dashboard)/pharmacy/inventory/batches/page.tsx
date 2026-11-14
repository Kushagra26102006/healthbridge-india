'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Boxes, ArrowDownToLine, SlidersHorizontal, RefreshCw } from 'lucide-react';
import {
  usePharmacyInventory,
  useQuarantineBatch,
  useReleaseBatch,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { BatchTable, BatchDetailsModal, StockAdjustmentForm } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';
import type { PharmacyInventoryItemDto } from '@healthbridge/shared-types';

export default function PharmacyBatchesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<PharmacyInventoryItemDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustBatchId, setAdjustBatchId] = useState<string | undefined>();

  const { data, isLoading, refetch } = usePharmacyInventory({
    page,
    limit: 20,
    search: search || undefined,
    status: status !== 'ALL' ? (status as any) : undefined,
  });

  const quarantineMutation = useQuarantineBatch();
  const releaseMutation = useReleaseBatch();

  const handleSelectBatch = (b: PharmacyInventoryItemDto) => {
    setSelectedBatch(b);
    setIsDetailOpen(true);
  };

  const handleAdjustBatch = (b: PharmacyInventoryItemDto) => {
    setAdjustBatchId(b.id);
    setIsAdjustOpen(true);
  };

  const handleQuarantine = async (b: PharmacyInventoryItemDto) => {
    const reason = prompt(`Enter quarantine reason for batch ${b.batchNumber}:`, 'Quality investigation hold');
    if (reason && reason.trim().length >= 3) {
      await quarantineMutation.mutateAsync({
        inventoryId: b.id,
        dto: { reason: reason.trim() },
      });
      refetch();
    }
  };

  const handleRelease = async (b: PharmacyInventoryItemDto) => {
    const reason = prompt(`Enter release authorization reason for batch ${b.batchNumber}:`, 'Quality clearance verified');
    if (reason && reason.trim().length >= 3) {
      await releaseMutation.mutateAsync({
        inventoryId: b.id,
        dto: { reason: reason.trim() },
      });
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Boxes className="w-3.5 h-3.5" />
            <span>Traceable Lot &amp; Batch Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Pharmacy Batch Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor real-time status across in-stock, low-stock, near-expiry, expired, and quarantined lots.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-9 gap-1.5">
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

      <BatchTable
        batches={data?.items || []}
        total={data?.total || 0}
        page={page}
        limit={20}
        isLoading={isLoading}
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

      <BatchDetailsModal
        batch={selectedBatch}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAdjust={handleAdjustBatch}
        onQuarantine={handleQuarantine}
        onRelease={handleRelease}
      />

      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <StockAdjustmentForm
              initialInventoryId={adjustBatchId}
              onSuccess={() => {
                setIsAdjustOpen(false);
                refetch();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
