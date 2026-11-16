'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useLaboratoryReportDetail } from '@/features/laboratory/hooks/use-laboratory-reports';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';
import type { ReportReviewDecision } from '@healthbridge/shared-types';

export default function LaboratoryReportReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = String(params?.id || '');

  const [decision, setDecision] = useState<ReportReviewDecision>('APPROVED');
  const [comments, setComments] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    report,
    isLoading,
    isSubmitting,
    error,
    reviewReport,
    clearMessages,
  } = useLaboratoryReportDetail(reportId);

  if (isLoading && !report) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        Loading review workspace...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h2 className="font-bold text-slate-800 dark:text-slate-200">Report Not Found</h2>
        <Link
          href="/laboratory/reports"
          className="mt-4 inline-block px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Return to Reports
        </Link>
      </div>
    );
  }

  const hasCritical = report.observations.some((o) => o.isCritical || o.flag === 'CRITICAL');

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision !== 'APPROVED' && (!comments.trim() || comments.length < 5)) {
      setValidationError('Detailed justification comments are mandatory when rejecting or requesting corrections');
      return;
    }

    setValidationError(null);
    try {
      await reviewReport({
        decision,
        comments: comments || 'Parameters verified and approved by medical reviewer.',
      });
      router.push(`/laboratory/reports/${report.id}`);
    } catch {
      // Error is stored in hook state
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Back button & Header */}
      <div>
        <Link
          href={`/laboratory/reports/${report.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Report Details
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Pathologist Review Workspace
              </h1>
              <ReportStatusBadge status={report.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {report.reportNumber} • {report.testName} (Version {report.currentVersion || 1}.0)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Separation of Duties Active
            </span>
          </div>
        </div>
      </div>

      {/* Separation of duties notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">NABL ISO 15189 Quality Control & Authorization Standard:</span>
          <span>
            Technicians who registered or entered numerical test results cannot self-approve without senior pathologist
            supervisor sign-off. Critical parameters require explicit clinical review before release.
          </span>
        </div>
      </div>

      {/* Critical/Abnormal Banner if present */}
      {hasCritical && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold block">CRITICAL RESULT ALERT:</span>
            <span>
              One or more parameters exceed statutory critical thresholds. Immediate clinical correlation and doctor
              notification protocol must be verified.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearMessages} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Patient & Order Context Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Patient Identifier</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{report.patientName}</span>
            <p className="text-[11px] text-slate-400 font-mono">{report.patientAbhaId || 'PAT-HB'}</p>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Ordering Physician</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{report.doctorName || 'Dr. Rajesh Verma'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Examination Date</span>
            <span className="text-slate-700 dark:text-slate-300">
              {new Date(report.testDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">QC Verification</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pre-Analytical QC Passed
            </span>
          </div>
        </div>
      </div>

      {/* Observations Review Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Investigation Parameter Review
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {report.observations.length} Evaluated Results
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3">Parameter Name</th>
                <th className="px-6 py-3">Result Value</th>
                <th className="px-6 py-3">Reference Range</th>
                <th className="px-6 py-3">QC Status / Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.observations.map((obs, idx) => {
                const isCrit = obs.isCritical || obs.flag === 'CRITICAL';
                const isAb = obs.isAbnormal || obs.flag === 'HIGH' || obs.flag === 'LOW' || obs.flag === 'ABNORMAL';

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition ${
                      isCrit ? 'bg-red-50/40 dark:bg-red-950/20' : isAb ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {obs.testName}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`font-bold ${isCrit ? 'text-red-600' : isAb ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'}`}>
                        {obs.value}
                      </span>
                      <span className="text-slate-400 ml-1">{obs.unit}</span>
                    </td>
                    <td className="px-6 py-3 font-mono text-slate-500">
                      {obs.referenceRange} {obs.unit}
                    </td>
                    <td className="px-6 py-3">
                      {isCrit ? (
                        <span className="text-[11px] font-bold text-red-700 bg-red-100 dark:bg-red-900/60 dark:text-red-300 px-2 py-0.5 rounded-full">
                          CRITICAL
                        </span>
                      ) : isAb ? (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          {obs.flag || 'ABNORMAL'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          IN RANGE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pathologist Review Form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          Review Decision & Statutory Attribution
        </h3>

        {validationError && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200">
            {validationError}
          </div>
        )}

        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Review Action Decision
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                  decision === 'APPROVED'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 shrink-0 ${decision === 'APPROVED' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs">Approve Report</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Authorize diagnostic accuracy for formal publication.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecision('CORRECTION_REQUESTED')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                  decision === 'CORRECTION_REQUESTED'
                    ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCcw className={`w-5 h-5 shrink-0 ${decision === 'CORRECTION_REQUESTED' ? 'text-amber-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs">Request Correction</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Return to draft for parameter re-testing or recalibration.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
                  decision === 'REJECTED'
                    ? 'border-red-600 bg-red-50/60 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-2 ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <XCircle className={`w-5 h-5 shrink-0 ${decision === 'REJECTED' ? 'text-red-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-bold text-xs">Reject Report</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Specimen invalid or analytical failure identified.
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pathologist Comments / Justification {decision !== 'APPROVED' && '*'}
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                decision === 'APPROVED'
                  ? 'Optional medical commentary or correlation recommendations...'
                  : 'Mandatory clinical justification for correction or rejection...'
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Link
              href={`/laboratory/reports/${report.id}`}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Recording Decision...
                </>
              ) : (
                'Submit Review Decision'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
