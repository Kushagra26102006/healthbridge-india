'use client';

import React, { useState } from 'react';
import { X, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CreateReagentLotDto, ReagentDto } from '@healthbridge/shared-types';

interface ReagentLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  reagents: ReagentDto[];
  defaultReagentId?: string;
  onSubmit: (dto: CreateReagentLotDto) => Promise<void>;
}

export function ReagentLotModal({
  isOpen,
  onClose,
  reagents,
  defaultReagentId,
  onSubmit,
}: ReagentLotModalProps) {
  const [reagentId, setReagentId] = useState(defaultReagentId || (reagents[0]?.id || ''));
  const [lotNumber, setLotNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]!);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0]!;
  });
  const [initialQuantity, setInitialQuantity] = useState<number>(50);
  const [storageLocation, setStorageLocation] = useState('Cold Room A / Shelf 2');
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultReagentId) {
      setReagentId(defaultReagentId);
      const matched = reagents.find((r) => r.id === defaultReagentId);
      if (matched) {
        setManufacturer((prev) => prev || matched.manufacturer);
      }
    }
  }, [defaultReagentId, reagents]);

  const handleReagentChange = (id: string) => {
    setReagentId(id);
    const matched = reagents.find((r) => r.id === id);
    if (matched) {
      setManufacturer(matched.manufacturer);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reagentId) {
      setError('Please select a reagent item.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await onSubmit({
        reagentId,
        lotNumber: lotNumber.trim().toUpperCase(),
        manufacturer,
        receivedDate,
        expiryDate,
        initialQuantity: Number(initialQuantity),
        storageLocation,
        supplierName: supplierName || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to register reagent lot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Receive New Reagent Lot</h3>
              <p className="text-xs text-slate-500">Record batch number, manufacturer, and expiry date</p>
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
              Reagent / Consumable Item *
            </label>
            <select
              value={reagentId}
              onChange={(e) => handleReagentChange(e.target.value)}
              disabled={!!defaultReagentId}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              required
            >
              <option value="">Select a reagent</option>
              {reagents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.reagentCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch / Lot Number *
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="e.g. LOT-2026-X88"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Roche Diagnostics"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Received Date *
              </label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Received Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage Location *
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Refrigerator 02 / Shelf B"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Authorized Supplier / Distributor
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. MedTech Supplies India Pvt Ltd"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Add Lot to Inventory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
