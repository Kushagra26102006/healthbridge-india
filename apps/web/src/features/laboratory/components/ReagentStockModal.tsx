'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type {
  RecordReagentStockTransactionDto,
  ReagentDto,
  ReagentLotDto,
  ReagentTransactionType,
} from '@healthbridge/shared-types';

interface ReagentStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  reagents: ReagentDto[];
  lots: ReagentLotDto[];
  defaultReagentId?: string;
  defaultLotId?: string;
  defaultTransactionType?: ReagentTransactionType;
  onSubmit: (dto: RecordReagentStockTransactionDto) => Promise<void>;
}

export function ReagentStockModal({
  isOpen,
  onClose,
  reagents,
  lots,
  defaultReagentId,
  defaultLotId,
  defaultTransactionType = 'CONSUMPTION',
  onSubmit,
}: ReagentStockModalProps) {
  const [reagentId, setReagentId] = useState(defaultReagentId || (reagents[0]?.id || ''));
  const [lotId, setLotId] = useState(defaultLotId || '');
  const [transactionType, setTransactionType] = useState<ReagentTransactionType>(defaultTransactionType);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('Routine test batch processing');
  const [batchTestRunId, setBatchTestRunId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available lots for selected reagent
  const filteredLots = lots.filter((lot) => !reagentId || lot.reagentId === reagentId);
  const selectedLot = lots.find((lot) => lot.id === lotId);

  React.useEffect(() => {
    if (defaultReagentId) {
      setReagentId(defaultReagentId);
    }
    if (defaultLotId) {
      setLotId(defaultLotId);
    } else if (filteredLots.length > 0 && !lotId && filteredLots[0]) {
      setLotId(filteredLots[0].id);
    }
  }, [defaultReagentId, defaultLotId, filteredLots, lotId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reagentId || !lotId) {
      setError('Please select both a reagent item and a specific lot.');
      return;
    }

    if (
      (transactionType === 'CONSUMPTION' || transactionType === 'DISPOSAL') &&
      selectedLot &&
      quantity > selectedLot.availableQuantity
    ) {
      setError(
        `Cannot deduct ${quantity} units: selected lot only has ${selectedLot.availableQuantity} units available.`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await onSubmit({
        reagentId,
        lotId,
        transactionType,
        quantity: Number(quantity),
        reason,
        batchTestRunId: batchTestRunId || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to record stock transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Stock Inventory Movement</h3>
              <p className="text-xs text-slate-500">Atomic inventory update with ledger audit trail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reagent / Consumable *
            </label>
            <select
              value={reagentId}
              onChange={(e) => {
                setReagentId(e.target.value);
                setLotId('');
              }}
              disabled={!!defaultReagentId}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              required
            >
              <option value="">Select reagent item</option>
              {reagents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.reagentCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Specific Batch / Lot *
            </label>
            <select
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              disabled={!!defaultLotId}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono"
              required
            >
              <option value="">Select a lot</option>
              {filteredLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  Lot #{lot.lotNumber} (Avail: {lot.availableQuantity} {lot.unit} | Exp: {lot.expiryDate.split('T')[0]})
                </option>
              ))}
            </select>
          </div>

          {selectedLot && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Available Stock:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedLot.availableQuantity} {selectedLot.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Lot Status:</span>
                <span
                  className={`font-semibold ${
                    selectedLot.status === 'ACTIVE'
                      ? 'text-emerald-700'
                      : selectedLot.status === 'EXPIRED'
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}
                >
                  {selectedLot.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Days to Expiry:</span>
                <span
                  className={`font-semibold ${
                    (selectedLot.daysToExpiry ?? 100) < 30 ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {selectedLot.daysToExpiry ?? 'N/A'} days
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Type *
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="CONSUMPTION">Consumption (Deduct Stock)</option>
                <option value="RECEIPT">Stock-In / Extra Receipt (Add Stock)</option>
                <option value="ADJUSTMENT">Reconciliation Adjustment</option>
                <option value="DISPOSAL">Disposal / Waste (Deduct Stock)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Justification *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Daily analyzer batch test run, inventory cycle count verification"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Batch / Run ID (Optional)
            </label>
            <input
              type="text"
              value={batchTestRunId}
              onChange={(e) => setBatchTestRunId(e.target.value)}
              placeholder="e.g. RUN-2026-0922"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                'Recording...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Post Inventory Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
