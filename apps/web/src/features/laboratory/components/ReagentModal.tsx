'use client';

import React, { useState } from 'react';
import { X, FlaskConical, AlertTriangle } from 'lucide-react';
import type { CreateReagentDto, ReagentDto, ReagentStorageCondition } from '@healthbridge/shared-types';

interface ReagentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateReagentDto) => Promise<void>;
  initialData?: ReagentDto | null;
}

export function ReagentModal({ isOpen, onClose, onSubmit, initialData }: ReagentModalProps) {
  const [reagentCode, setReagentCode] = useState(initialData?.reagentCode || '');
  const [name, setName] = useState(initialData?.name || '');
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer || '');
  const [catalogNumber, setCatalogNumber] = useState(initialData?.catalogNumber || '');
  const [category, setCategory] = useState<
    'REAGENT' | 'CALIBRATOR' | 'CONTROL' | 'BUFFER' | 'STAIN' | 'CONSUMABLE'
  >(initialData?.category || 'REAGENT');
  const [storageConditions, setStorageConditions] = useState<ReagentStorageCondition>(
    initialData?.storageConditions || 'REFRIGERATED_2_8C'
  );
  const [unit, setUnit] = useState(initialData?.unit || 'Vials');
  const [minimumStockLevel, setMinimumStockLevel] = useState<number>(initialData?.minimumStockLevel ?? 10);
  const [associatedTestCodes, setAssociatedTestCodes] = useState(
    initialData?.associatedTestCodes?.join(', ') || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const testCodesArray = associatedTestCodes
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      await onSubmit({
        reagentCode: reagentCode.toUpperCase(),
        name,
        manufacturer,
        catalogNumber,
        category,
        storageConditions,
        unit,
        minimumStockLevel: Number(minimumStockLevel),
        associatedTestCodes: testCodesArray,
      });

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save reagent catalogue item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Reagent / Consumable' : 'Add Reagent / Consumable Item'}
              </h3>
              <p className="text-xs text-slate-500">Configure storage, safety thresholds, and test mappings</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reagent / Item Code *
              </label>
              <input
                type="text"
                value={reagentCode}
                onChange={(e) => setReagentCode(e.target.value)}
                placeholder="e.g. RG-GLU-01"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                required
                disabled={!!initialData}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="REAGENT">Reagent / Reaction Kit</option>
                <option value="CALIBRATOR">Calibration Standard</option>
                <option value="CONTROL">Quality Control Material</option>
                <option value="BUFFER">Buffer / Wash Solution</option>
                <option value="STAIN">Staining Solution</option>
                <option value="CONSUMABLE">Consumable / Cuvette / Tip</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reagent / Chemical Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Glucose Hexokinase Enzymatic Assay"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturer / Brand *
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Roche Diagnostics"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catalog / Part Number *
              </label>
              <input
                type="text"
                value={catalogNumber}
                onChange={(e) => setCatalogNumber(e.target.value)}
                placeholder="e.g. 04404483190"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage Conditions *
              </label>
              <select
                value={storageConditions}
                onChange={(e) => setStorageConditions(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="REFRIGERATED_2_8C">Refrigerated (2°C to 8°C)</option>
                <option value="ROOM_TEMPERATURE">Room Temperature (15°C to 25°C)</option>
                <option value="FROZEN_MINUS_20C">Frozen (-20°C)</option>
                <option value="DEEP_FREEZE_MINUS_80C">Deep Freeze (-80°C)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure *
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Vials, Kits, Tests, mL"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Stock Level (Alert Threshold) *
              </label>
              <input
                type="number"
                min="0"
                value={minimumStockLevel}
                onChange={(e) => setMinimumStockLevel(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associated Test Codes (Comma-separated)
              </label>
              <input
                type="text"
                value={associatedTestCodes}
                onChange={(e) => setAssociatedTestCodes(e.target.value)}
                placeholder="e.g. GLUC, FBS, PPBS"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 uppercase font-mono"
              />
            </div>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : initialData ? 'Update Reagent' : 'Save Reagent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
