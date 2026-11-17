'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  ArrowRightLeft,
  AlertTriangle,
  Thermometer,
  Plus,
} from 'lucide-react';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import { ReagentLotModal } from '@/features/laboratory/components/ReagentLotModal';
import { ReagentStockModal } from '@/features/laboratory/components/ReagentStockModal';
import type {
  ReagentDto,
  ReagentLotDto,
  ReagentInventoryTransactionDto,
} from '@healthbridge/shared-types';

export default function ReagentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reagentId = params.id as string;

  const [reagent, setReagent] = useState<ReagentDto | null>(null);
  const [lots, setLots] = useState<ReagentLotDto[]>([]);
  const [transactions, setTransactions] = useState<ReagentInventoryTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'lots' | 'ledger'>('lots');

  // Modals
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedLotForStock, setSelectedLotForStock] = useState<ReagentLotDto | null>(null);

  const fetchReagentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [r, l, t] = await Promise.all([
        laboratoryQualityApi.getReagentById(reagentId),
        laboratoryQualityApi.listLots({ reagentId }),
        laboratoryQualityApi.listTransactions({ reagentId }),
      ]);
      setReagent(r);
      setLots(l.items);
      setTransactions(t.items);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load reagent details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reagentId) {
      fetchReagentData();
    }
  }, [reagentId]);

  const handleReceiveLot = async (dto: any) => {
    await laboratoryQualityApi.createLot(dto);
    await fetchReagentData();
  };

  const handleRecordStockTransaction = async (dto: any) => {
    await laboratoryQualityApi.recordTransaction(dto);
    setSelectedLotForStock(null);
    await fetchReagentData();
  };

  const handleQuarantineLot = async (lotId: string) => {
    const reason = prompt('Enter lot quarantine reason (e.g. Suspected contamination / precipitate):');
    if (!reason) return;
    try {
      await laboratoryQualityApi.quarantineLot(reagentId, lotId, { quarantineReason: reason });
      await fetchReagentData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to quarantine lot');
    }
  };

  const handleRecallLot = async (lotId: string) => {
    const reason = prompt('Enter manufacturer recall notice reference / reason:');
    if (!reason) return;
    try {
      await laboratoryQualityApi.recallLot(reagentId, lotId, { recalledReason: reason });
      await fetchReagentData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to recall lot');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center max-w-6xl mx-auto">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-teal-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading reagent dossier & ledger...</p>
      </div>
    );
  }

  if (!reagent) {
    return (
      <div className="p-8 max-w-6xl mx-auto text-center">
        <p className="text-sm text-slate-600">Reagent item not found.</p>
        <Link
          href="/laboratory/inventory/reagents"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reagents
        </Link>
      </div>
    );
  }

  const isLowStock = reagent.currentStock <= reagent.minimumStockLevel;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/laboratory/inventory/reagents')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {reagent.name}
              </h1>
              <span className="font-mono text-xs bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded border border-teal-200">
                {reagent.reagentCode}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {reagent.category}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {reagent.manufacturer} • Catalog #{reagent.catalogNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedLotForStock(null);
              setIsStockModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
            Stock Movement
          </button>
          <button
            onClick={() => setIsLotModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Receive New Lot
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Info Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Available Stock
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-extrabold ${
                isLowStock ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {reagent.currentStock}
            </span>
            <span className="text-xs text-slate-500 font-semibold">{reagent.unit}</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Min threshold: {reagent.minimumStockLevel} {reagent.unit}
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Storage Conditions
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-slate-900 font-bold text-sm">
            <Thermometer className="w-4 h-4 text-blue-500" />
            {reagent.storageConditions}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Temperature-controlled
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Lots on Hand
          </span>
          <div className="mt-1">
            <span className="text-2xl font-extrabold text-teal-700">{lots.length}</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            First-Expired-First-Out (FEFO)
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Associated Tests
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {reagent.associatedTestCodes && reagent.associatedTestCodes.length > 0 ? (
              reagent.associatedTestCodes.map((code) => (
                <span
                  key={code}
                  className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold"
                >
                  {code}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">None</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('lots')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'lots'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Tracked Lots ({lots.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Immutable Transaction Ledger ({transactions.length})
        </button>
      </div>

      {/* Lots Tab */}
      {activeTab === 'lots' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {lots.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No lots recorded for this reagent. Click &ldquo;Receive New Lot&rdquo; to begin tracking batches.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Lot Number</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Expiry Date & Countdown</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {lots.map((lot) => {
                  const isExpiringSoon = (lot.daysToExpiry ?? 100) <= 30;
                  return (
                    <tr key={lot.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          #{lot.lotNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Recv: {lot.receivedDate.split('T')[0]} • {lot.manufacturer}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span>
                            {lot.availableQuantity} / {lot.initialQuantity} {lot.unit}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700">{lot.expiryDate.split('T')[0]}</span>
                          {lot.status === 'EXPIRED' ? (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                              EXPIRED
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                              {lot.daysToExpiry}d left
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">({lot.daysToExpiry}d)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{lot.storageLocation}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lot.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : lot.status === 'QUARANTINED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {lot.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedLotForStock(lot);
                              setIsStockModalOpen(true);
                            }}
                            className="px-2 py-1 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded text-[11px] font-semibold"
                          >
                            Move Stock
                          </button>
                          {lot.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleQuarantineLot(lot.id)}
                              className="px-2 py-1 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded text-[11px] font-semibold"
                            >
                              Quarantine
                            </button>
                          )}
                          {lot.status !== 'RECALLED' && (
                            <button
                              onClick={() => handleRecallLot(lot.id)}
                              className="px-2 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded text-[11px] font-semibold"
                            >
                              Recall
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No inventory movements recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Lot #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Delta Qty</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Authorized By</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((t) => {
                  const isAddition = t.transactionType === 'RECEIPT';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {t.transactionReference}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        #{t.lotNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={isAddition ? 'text-emerald-700' : 'text-rose-600'}>
                          {isAddition ? `+${t.quantity}` : `-${t.quantity}`} {t.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {t.balanceAfter} {t.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.performedByName}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{t.reason}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <ReagentLotModal
        isOpen={isLotModalOpen}
        onClose={() => setIsLotModalOpen(false)}
        reagents={[reagent]}
        defaultReagentId={reagent.id}
        onSubmit={handleReceiveLot}
      />

      <ReagentStockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedLotForStock(null);
        }}
        reagents={[reagent]}
        lots={lots}
        defaultReagentId={reagent.id}
        defaultLotId={selectedLotForStock?.id}
        onSubmit={handleRecordStockTransaction}
      />
    </div>
  );
}
