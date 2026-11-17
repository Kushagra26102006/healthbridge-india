'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { laboratoryQualityApi } from '@/features/laboratory/api/laboratory-quality-api';
import type { QCRunDto } from '@healthbridge/shared-types';

export default function QCRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<QCRunDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Investigation form state
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [rootCause, setRootCause] = useState('REAGENT_LOT_VARIATION');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<
    'RESOLVED' | 'UNDER_INVESTIGATION' | 'INVALIDATED'
  >('RESOLVED');
  const [submitting, setSubmitting] = useState(false);
  const [investigationSuccess, setInvestigationSuccess] = useState(false);

  const fetchRun = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryQualityApi.getRunById(runId);
      setRun(res);
      if (res.comments) setInvestigationNotes(res.comments);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load QC run detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runId) {
      fetchRun();
    }
  }, [runId]);

  const handleInvestigationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await laboratoryQualityApi.investigateRun(runId, {
        investigationNotes,
        rootCauseCategory: rootCause,
        correctiveAction,
        resolutionStatus,
      });
      setInvestigationSuccess(true);
      await fetchRun();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit investigation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center max-w-4xl mx-auto">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-teal-600 mb-2"></div>
        <p className="text-sm text-slate-500">Loading QC run details...</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <p className="text-sm text-slate-600">QC run not found or was removed.</p>
        <Link
          href="/laboratory/quality/control"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to QC Runs
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                QC Run Execution: {run.testCode}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  run.qcStatus === 'PASSED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : run.qcStatus === 'FAILED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {run.qcStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Run ID: <span className="font-mono">{run.runIdentifier || run.id}</span> • Executed on{' '}
              {new Date(run.runDate).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {investigationSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Investigation updated and recorded successfully!</span>
        </div>
      )}

      {/* Grid: Metric Card & Instrument / Lot Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Analytical Result
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {run.measuredNumericValue !== undefined
                ? run.measuredNumericValue
                : run.measuredQualitativeValue}
            </span>
            <span className="text-xs font-semibold text-slate-500">{run.unit || ''}</span>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Target Value:</span>
              <span className="font-semibold text-slate-900">
                {run.targetValue ?? 'N/A'} {run.unit || ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Acceptable Range:</span>
              <span className="font-semibold text-slate-900 font-mono">
                {run.acceptableMin ?? '—'} - {run.acceptableMax ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Deviation:</span>
              <span className="font-mono font-bold text-slate-900">
                {run.ruleEvaluation?.deviation !== undefined
                  ? `${run.ruleEvaluation.deviation > 0 ? '+' : ''}${run.ruleEvaluation.deviation.toFixed(2)}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile & Control Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Control Material
          </span>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{run.qcProfileName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Material: {run.controlMaterial} (Lot #{run.controlLotNumber})
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Operator:</span>
              <span className="font-semibold text-slate-900">{run.operatorName}</span>
            </div>
            <div className="flex justify-between">
              <span>Profile Version:</span>
              <span className="font-semibold text-slate-900 font-mono">
                v{run.profileVersion}
              </span>
            </div>
          </div>
        </div>

        {/* Instrument & Reagent Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Hardware & Lot Traceability
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-600 shrink-0" />
              <div>
                <span className="text-slate-500 block">Instrument:</span>
                <span className="font-semibold text-slate-900">
                  {run.instrumentName || 'Direct Analyzer'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-slate-500 block">Reagent Lot:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {run.reagentLotNumber || 'LOT-ROUTINE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Westgard Rule Evaluation Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-teal-600" />
          Automated Multi-Rule Quality Evaluation
        </h3>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-800">
              Rule Evaluated: {run.ruleEvaluation?.ruleName || 'Westgard Multi-Rule Engine'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] ${
                run.ruleEvaluation?.passed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {run.ruleEvaluation?.passed ? 'PASSED' : 'VIOLATION'}
            </span>
          </div>
          <p className="text-slate-600">
            {run.ruleEvaluation?.explanation ||
              (run.ruleEvaluation?.passed
                ? 'Analytical control reading is strictly compliant with quality specifications.'
                : 'QC parameter exceeded acceptable limits. Result release has been blocked.')}
          </p>
          {run.ruleEvaluation?.deviationPercentage !== undefined && (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>Deviation Percentage:</span>
              <span className="font-mono font-bold text-slate-800">
                {run.ruleEvaluation.deviationPercentage.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Linked Incident Card (If Applicable) */}
      {run.incidentId && (
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                Quality Incident Logged: #{run.incidentId}
              </span>
              <p className="text-xs text-amber-700">
                A non-conformity incident was initiated automatically to enforce laboratory safety gates.
              </p>
            </div>
          </div>
          <Link
            href="/laboratory/quality/incidents"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1"
          >
            Open Incidents <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Failure Investigation Workspace */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Failure Investigation & Remediation Workspace
          </h3>
          <p className="text-xs text-slate-500">
            Document root cause analysis, corrective actions, and update quality run status
          </p>
        </div>

        <form onSubmit={handleInvestigationSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identified Root Cause Category *
              </label>
              <select
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="REAGENT_LOT_VARIATION">Reagent Lot Variation / Expiry</option>
                <option value="CALIBRATION_DRIFT">Instrument Calibration Drift</option>
                <option value="OPERATOR_ERROR">Pipetting / Operator Technique Error</option>
                <option value="ENVIRONMENTAL_FLUCTUATION">Ambient Temperature / Humidity Drift</option>
                <option value="SAMPLE_CONTAMINATION">Control Material Contamination</option>
                <option value="OTHER">Other Technical Finding</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Status *
              </label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white font-medium"
              >
                <option value="RESOLVED">Resolved (Remediation Validated)</option>
                <option value="UNDER_INVESTIGATION">Under Investigation (Awaiting Further Tests)</option>
                <option value="INVALIDATED">Invalidated (Run Discarded)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Investigation Notes *
            </label>
            <textarea
              rows={3}
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              placeholder="Detail observations, control vial condition, optical baseline checks..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corrective Action Taken *
            </label>
            <textarea
              rows={2}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="e.g. Cleaned flow cell, replaced calibration standard, reran Level 1 & Level 2 controls"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-1.5"
            >
              {submitting ? 'Saving...' : 'Save Investigation Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
