'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { CreateCAPADto, ReviewCAPADto, CAPADto } from '@healthbridge/shared-types';

interface CAPAModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'review';
  incidentId?: string;
  incidentReference?: string;
  existingCAPA?: CAPADto | null;
  onCreate?: (dto: CreateCAPADto) => Promise<void>;
  onReview?: (capaId: string, dto: ReviewCAPADto) => Promise<void>;
}

export function CAPAModal({
  isOpen,
  onClose,
  mode,
  incidentId,
  incidentReference,
  existingCAPA,
  onCreate,
  onReview,
}: CAPAModalProps) {
  // Create mode state
  const [problemStatement, setProblemStatement] = useState(
    existingCAPA?.problemStatement || ''
  );
  const [rootCauseCategory, setRootCauseCategory] = useState(
    existingCAPA?.rootCauseCategory || 'REAGENT_LOT_VARIATION'
  );
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState(
    existingCAPA?.rootCauseAnalysis || ''
  );
  const [correctiveAction, setCorrectiveAction] = useState(
    existingCAPA?.correctiveAction || ''
  );
  const [preventiveAction, setPreventiveAction] = useState(
    existingCAPA?.preventiveAction || ''
  );
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>(
    existingCAPA?.priority || 'HIGH'
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0]!;
  });
  const [verificationMethod, setVerificationMethod] = useState(
    existingCAPA?.verificationMethod || ''
  );

  // Review mode state
  const [effectivenessResult, setEffectivenessResult] = useState<'EFFECTIVE' | 'INEFFECTIVE'>('EFFECTIVE');
  const [effectivenessReviewNotes, setEffectivenessReviewNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (mode === 'create') {
        if (!onCreate || !incidentId) {
          setError('Missing incident link for CAPA creation');
          return;
        }

        await onCreate({
          incidentId,
          problemStatement,
          rootCauseCategory,
          rootCauseAnalysis,
          correctiveAction,
          preventiveAction,
          assignedOwnerId: 'CURRENT_USER', // backend will set user or map
          dueDate,
          priority,
          verificationMethod: verificationMethod || undefined,
        });
      } else {
        if (!onReview || !existingCAPA) {
          setError('Missing CAPA record for review');
          return;
        }

        await onReview(existingCAPA.id, {
          effectivenessResult,
          effectivenessReviewNotes,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit CAPA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'create' ? 'Create Corrective & Preventive Action (CAPA)' : 'Evaluate CAPA Effectiveness'}
              </h3>
              <p className="text-xs text-slate-500">
                {incidentReference ? `Linked to Incident: ${incidentReference}` : 'Quality Action Plan'}
              </p>
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
          {mode === 'create' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Problem Statement *
                </label>
                <textarea
                  rows={2}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Accurately describe the defect, non-conformity or failure pattern..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Root Cause Category *
                  </label>
                  <select
                    value={rootCauseCategory}
                    onChange={(e) => setRootCauseCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                  >
                    <option value="REAGENT_LOT_VARIATION">Reagent Lot Variation / Deterioration</option>
                    <option value="INSTRUMENT_CALIBRATION_DRIFT">Instrument Calibration Drift</option>
                    <option value="OPERATOR_TECHNIQUE_ERROR">Operator / Pipetting Error</option>
                    <option value="SAMPLE_INTEGRITY_ISSUE">Sample Integrity / Hemolysis</option>
                    <option value="ENVIRONMENTAL_CONDITION">Environmental / Temperature Drift</option>
                    <option value="SOP_PROCEDURAL_DEFECT">SOP / Procedural Defect</option>
                    <option value="OTHER">Other Root Cause</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Root Cause Analysis (5-Whys / Fishbone details) *
                </label>
                <textarea
                  rows={3}
                  value={rootCauseAnalysis}
                  onChange={(e) => setRootCauseAnalysis(e.target.value)}
                  placeholder="Detail the investigative steps, findings, and definitive root cause..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Immediate Corrective Action *
                  </label>
                  <textarea
                    rows={2}
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    placeholder="e.g. Quarantined reagent lot #LOT-384, re-calibrated instrument, repeated test run"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Systemic Preventive Action *
                  </label>
                  <textarea
                    rows={2}
                    value={preventiveAction}
                    onChange={(e) => setPreventiveAction(e.target.value)}
                    placeholder="e.g. Revised storage SOP, mandated dual-technician sign-off on lot reception"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Resolution Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Effectiveness Verification Method
                  </label>
                  <input
                    type="text"
                    value={verificationMethod}
                    onChange={(e) => setVerificationMethod(e.target.value)}
                    placeholder="e.g. 3 consecutive days of compliant Level 1/2 QC runs"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Problem Statement:</span>
                  <p className="text-slate-600 mt-0.5">{existingCAPA?.problemStatement}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Preventive Action Committed:</span>
                  <p className="text-slate-600 mt-0.5">{existingCAPA?.preventiveAction}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Planned Verification Method:</span>
                  <p className="text-slate-600 mt-0.5">{existingCAPA?.verificationMethod || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effectiveness Assessment *
                </label>
                <select
                  value={effectivenessResult}
                  onChange={(e) => setEffectivenessResult(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white font-medium"
                >
                  <option value="EFFECTIVE">Effective (Recurrence Eliminated / Mitigated)</option>
                  <option value="INEFFECTIVE">Ineffective (Recurrence Observed - Action Requires Re-opening)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effectiveness Review Notes & Audit Evidence *
                </label>
                <textarea
                  rows={4}
                  value={effectivenessReviewNotes}
                  onChange={(e) => setEffectivenessReviewNotes(e.target.value)}
                  placeholder="Document data verified, QC run IDs reviewed, audit observations, and conclusion on preventive efficacy"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  required
                />
              </div>
            </>
          )}

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
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                'Submitting...'
              ) : mode === 'create' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Initiate CAPA Plan
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Effectiveness Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
