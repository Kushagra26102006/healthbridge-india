'use client';

import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import type { QCProfileDto, CreateQCRunDto } from '@healthbridge/shared-types';

interface QCRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateQCRunDto) => Promise<void>;
  profiles: QCProfileDto[];
}

export function QCRunModal({ isOpen, onClose, onSubmit, profiles }: QCRunModalProps) {
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id || '');
  const [controlLotNumber, setControlLotNumber] = useState('');
  const [measuredNumericValue, setMeasuredNumericValue] = useState('');
  const [measuredQualitativeValue, setMeasuredQualitativeValue] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const profileId = selectedProfileId || activeProfile?.id;
      if (!profileId) {
        throw new Error('Please select an active QC Profile');
      }

      const dto: CreateQCRunDto = {
        qcProfileId: profileId,
        controlLotNumber,
        measuredNumericValue: measuredNumericValue ? Number(measuredNumericValue) : undefined,
        measuredQualitativeValue: measuredQualitativeValue || undefined,
        comments,
      };

      await onSubmit(dto);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to record QC run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Quality Control Run</h3>
              <p className="text-xs text-slate-500">Executes automated rule evaluation</p>
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
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select QC Profile *</label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.profileName} ({p.testCode}) - Limits: [{p.acceptableMin} - {p.acceptableMax}] {p.unit}
                </option>
              ))}
            </select>
          </div>

          {activeProfile && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Material:</span>
                <span className="font-semibold text-slate-800">{activeProfile.controlMaterial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Value:</span>
                <span className="font-semibold text-slate-800">
                  {activeProfile.targetValue ?? 'N/A'} {activeProfile.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Configured Acceptable Limits:</span>
                <span className="font-bold text-indigo-700">
                  [{activeProfile.acceptableMin ?? '-∞'} - {activeProfile.acceptableMax ?? '+∞'}]{' '}
                  {activeProfile.unit}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Control Material Lot Number *
            </label>
            <input
              type="text"
              required
              value={controlLotNumber}
              onChange={(e) => setControlLotNumber(e.target.value)}
              placeholder="e.g. LOT-2026-99"
              className="w-full text-sm font-mono px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeProfile?.dataType === 'NUMERIC' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Measured Numeric Value ({activeProfile.unit || 'Units'}) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={measuredNumericValue}
                onChange={(e) => setMeasuredNumericValue(e.target.value)}
                placeholder="Enter analyzer reading"
                className="w-full text-base font-bold font-mono px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Measured Qualitative Result *
              </label>
              <input
                type="text"
                required
                value={measuredQualitativeValue}
                onChange={(e) => setMeasuredQualitativeValue(e.target.value)}
                placeholder="e.g. Reactive / Non-Reactive"
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Run Comments</label>
            <input
              type="text"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Standard morning shift run"
              className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Evaluating...' : 'Record & Evaluate Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
