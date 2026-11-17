'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { CreateQualityIncidentDto } from '@healthbridge/shared-types';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateQualityIncidentDto) => Promise<void>;
}

export function IncidentModal({ isOpen, onClose, onSubmit }: IncidentModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<any>('GENERAL');
  const [severity, setSeverity] = useState<any>('MEDIUM');
  const [description, setDescription] = useState('');
  const [relatedTestCode, setRelatedTestCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await onSubmit({
        title,
        category,
        severity,
        description,
        relatedTestCode: relatedTestCode ? relatedTestCode.toUpperCase() : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Report Quality Incident</h3>
              <p className="text-xs text-slate-500">Log an operational or diagnostic variance</p>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken centrifuge during serum separation"
              className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="QC_FAILURE">QC Failure</option>
                <option value="INSTRUMENT_FAILURE">Instrument Failure</option>
                <option value="CALIBRATION_FAILURE">Calibration Failure</option>
                <option value="REAGENT_ISSUE">Reagent Issue</option>
                <option value="SPECIMEN_ISSUE">Specimen Issue</option>
                <option value="PRE_ANALYTICAL">Pre-Analytical</option>
                <option value="POST_ANALYTICAL">Post-Analytical</option>
                <option value="GENERAL">General Operational</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Related Test Code</label>
            <input
              type="text"
              value={relatedTestCode}
              onChange={(e) => setRelatedTestCode(e.target.value.toUpperCase())}
              placeholder="e.g. GLUC or CBC (optional)"
              className="w-full text-sm font-mono uppercase px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident occurrence, impacted specimens or tests, immediate containment actions taken..."
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
              {loading ? 'Submitting...' : 'Log Quality Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
