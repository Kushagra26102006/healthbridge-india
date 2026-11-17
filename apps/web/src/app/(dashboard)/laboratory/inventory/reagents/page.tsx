'use client';

import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowRightLeft,
  Layers,
} from 'lucide-react';
import {
  useReagents,
  useReagentLots,
} from '@/features/laboratory/hooks/use-laboratory-quality';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { ReagentInventoryTable } from '@/features/laboratory/components/ReagentInventoryTable';
import { ReagentModal } from '@/features/laboratory/components/ReagentModal';
import { ReagentLotModal } from '@/features/laboratory/components/ReagentLotModal';
import { ReagentStockModal } from '@/features/laboratory/components/ReagentStockModal';
import type { ReagentDto } from '@healthbridge/shared-types';

export default function ReagentInventoryPage() {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isReagentModalOpen, setIsReagentModalOpen] = useState(false);
  const [editingReagent, setEditingReagent] = useState<ReagentDto | null>(null);
  const [receivingLotReagent, setReceivingLotReagent] = useState<ReagentDto | null>(null);
  const [stockMovementReagent, setStockMovementReagent] = useState<ReagentDto | null>(null);

  const { reagents, loading, refetch } = useReagents({
    category: categoryFilter || undefined,
  });
  const { lots, refetch: refetchLots } = useReagentLots();

  const handleCreateReagent = async (dto: any) => {
    await laboratoryQualityApi.createReagent(dto);
    await refetch();
  };

  const handleReceiveLot = async (dto: any) => {
    await laboratoryQualityApi.createLot(dto);
    await Promise.all([refetch(), refetchLots()]);
  };

  const handleRecordStockTransaction = async (dto: any) => {
    await laboratoryQualityApi.recordTransaction(dto);
    await Promise.all([refetch(), refetchLots()]);
  };

  const filteredReagents = reagents.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.reagentCode.toLowerCase().includes(term) ||
      r.manufacturer.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-200/50">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Reagent & Consumable Inventory
            </h1>
            <p className="text-xs text-slate-500">
              Lot tracking, expiry alerts, cold-chain conditions & immutable transaction ledgers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetch();
              refetchLots();
            }}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStockMovementReagent(reagents[0] || null)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
            Stock Movement
          </button>
          <button
            onClick={() => setReceivingLotReagent(reagents[0] || null)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Receive Lot
          </button>
          <button
            onClick={() => {
              setEditingReagent(null);
              setIsReagentModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Reagent Item
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, code or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              <option value="">All Categories</option>
              <option value="REAGENT">Reagents</option>
              <option value="CALIBRATOR">Calibrators</option>
              <option value="CONTROL">Controls</option>
              <option value="BUFFER">Buffers</option>
              <option value="STAIN">Stains</option>
              <option value="CONSUMABLE">Consumables</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredReagents.length} reagent catalog item(s)
        </div>
      </div>

      {/* Inventory Table */}
      <ReagentInventoryTable
        reagents={filteredReagents}
        loading={loading}
        onReceiveLot={(r) => setReceivingLotReagent(r)}
        onRecordStock={(r) => setStockMovementReagent(r)}
        onEditReagent={(r) => {
          setEditingReagent(r);
          setIsReagentModalOpen(true);
        }}
      />

      {/* Modals */}
      <ReagentModal
        isOpen={isReagentModalOpen}
        onClose={() => {
          setIsReagentModalOpen(false);
          setEditingReagent(null);
        }}
        initialData={editingReagent}
        onSubmit={handleCreateReagent}
      />

      {receivingLotReagent && (
        <ReagentLotModal
          isOpen={!!receivingLotReagent}
          onClose={() => setReceivingLotReagent(null)}
          reagents={reagents}
          defaultReagentId={receivingLotReagent.id}
          onSubmit={handleReceiveLot}
        />
      )}

      {stockMovementReagent && (
        <ReagentStockModal
          isOpen={!!stockMovementReagent}
          onClose={() => setStockMovementReagent(null)}
          reagents={reagents}
          lots={lots}
          defaultReagentId={stockMovementReagent.id}
          onSubmit={handleRecordStockTransaction}
        />
      )}
    </div>
  );
}
