'use client';

import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import type { QCRunDto, QCInvestigationDto } from '@healthbridge/shared-types';

interface QCFailureInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: QCInvestigationDto) => Promise<void>;
  run: QCRunDto | null;
}

export function QCFailureInvestigationModal({
  isOpen,
  onClose,
  onSubmit,
  run,
}: QCFailureInvestigationModalProps) {
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [rootCauseCategory, setRootCauseCategory] = useState('EQUIPMENT_CALIBRATION');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<any>('RESOLVED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !run) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await onSubmit({
        investigationNotes,
        rootCauseCategory,
        correctiveAction,
        resolutionStatus,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit investigation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">QC Failure Investigation Workspace</h3>
              <p className="text-xs text-slate-500">Run: {run.runIdentifier}</p>
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

        <div className="mt-4 p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-xs space-y-1.5 text-rose-950">
          <div className="font-semibold">Failure Details:</div>
          <div>{run.ruleEvaluation.explanation}</div>
          <div className="flex gap-4 pt-1 font-mono">
            <span>Observed: {run.measuredNumericValue ?? run.measuredQualitativeValue}</span>
            <span>Target: {run.targetValue ?? run.qualitativeExpected ?? 'N/A'}</span>
            <span>Limits: [{run.acceptableMin} - {run.acceptableMax}]</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Root-Cause Category *
            </label>
            <select
              value={rootCauseCategory}
              onChange={(e) => setRootCauseCategory(e.target.value)}
              className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="EQUIPMENT_CALIBRATION">Equipment / Calibration Drift</option>
              <option value="REAGENT_DETERIORATION">Reagent Deterioration / Contamination</option>
              <option value="CONTROL_MATERIAL_EXPIRY">Control Material Expiry / Degradation</option>
              <option value="OPERATOR_ERROR">Operator / Pipetting Error</option>
              <option value="ENVIRONMENTAL">Environmental (Temperature / Humidity)</option>
              <option value="RANDOM_ERROR">Random Analytical Error</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Investigation Findings & Root Cause Analysis *
            </label>
            <textarea
              required
              rows={3}
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              placeholder="Detail root cause discovery, equipment checks, and reagent lot inspections performed..."
              className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corrective Action Implemented *
            </label>
            <textarea
              required
              rows={3}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="Describe corrective actions taken (e.g., recalibration, new vial reconstitution, repeated control test)..."
              className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Investigation Outcome Status *
            </label>
            <select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value as any)}
              className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="RESOLVED">Resolved (Corrective action verified, repeat control passed)</option>
              <option value="UNDER_INVESTIGATION">Under Investigation (Awaiting service engineer / parts)</option>
              <option value="INVALIDATED">Invalidated Run (Confirmed pre-analytical or control vial defect)</option>
            </select>
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
              {loading ? 'Submitting...' : 'Record Investigation & Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
