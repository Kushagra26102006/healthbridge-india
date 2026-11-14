'use client';

import React, { useState } from 'react';
import { usePharmacyInventory } from '@/features/pharmacy/hooks/use-pharmacy';
import { InventoryTable, CreateInventoryModal } from '@/components/pharmacy';
import {
  Package,
  Plus,
  RefreshCw,
} from 'lucide-react';

export default function PharmacyInventoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: inventory, isLoading, refetch } = usePharmacyInventory();

  const items = inventory?.items || [];
  const inStockCount = items.filter((i) => i.status === 'IN_STOCK').length;
  const lowStockCount = items.filter((i) => i.status === 'LOW_STOCK').length;
  const expiredCount = items.filter((i) => i.isExpired || i.status === 'EXPIRED').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
            <Package className="w-3.5 h-3.5" />
            <span>Medication Supply Chain</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Pharmacy Inventory & Batch Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Maintain accurate batch records, monitor expiry horizons, and prevent stockouts under CDSCO standards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Stock Batch
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Batches</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {items.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tracked units</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">In Stock</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {inStockCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Adequate supply</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Low Stock</div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {lowStockCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs reorder</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Expired Batches</div>
          <div className="text-xl font-bold text-rose-600 mt-1">
            {expiredCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Non-dispensable</div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <InventoryTable
        items={items}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onOpenCreate={() => setIsModalOpen(true)}
      />

      {/* Create Modal */}
      <CreateInventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
