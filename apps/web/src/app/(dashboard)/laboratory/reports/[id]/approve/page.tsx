'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileCheck,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { useLaboratoryReportDetail } from '@/features/laboratory/hooks/use-laboratory-reports';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';

export default function LaboratoryReportApprovePage() {
  const params = useParams();
  const router = useRouter();
  const reportId = String(params?.id || '');

  const [designation, setDesignation] = useState('Consultant Pathologist & Laboratory Director');
  const [registrationNumber, setRegistrationNumber] = useState('MCI/DMC-PATH-9022');
  const [comments, setComments] = useState('Report verified and authorized for patient and clinical release.');
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    report,
    isLoading,
    isSubmitting,
    error,
    approveReport,
    clearMessages,
  } = useLaboratoryReportDetail(reportId);

  if (isLoading && !report) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        Loading approval workspace...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
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

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attestationChecked) {
      setFormError('Statutory medical attestation checkbox must be confirmed prior to approval');
      return;
    }

    setFormError(null);
    try {
      await approveReport({
        designation,
        registrationNumber,
        comments,
      });
      router.push(`/laboratory/reports/${report.id}`);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div>
        <Link
          href={`/laboratory/reports/${report.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Report Details
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Formal Pathologist Report Approval
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {report.reportNumber} • {report.testName} (v{report.currentVersion || 1}.0)
            </p>
          </div>
          <ReportStatusBadge status={report.status} />
        </div>
      </div>

      {(error || formError) && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{error || formError}</span>
          <button onClick={() => { setFormError(null); clearMessages(); }} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Review Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
          Summary of Investigation Parameters
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Patient</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{report.patientName}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Total Parameters</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{report.observations.length}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Abnormalities</span>
            <span className="font-semibold text-amber-600">
              {report.observations.filter((o) => o.isAbnormal || o.flag !== 'NORMAL').length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Critical Flags</span>
            <span className="font-semibold text-red-600">
              {report.observations.filter((o) => o.isCritical || o.flag === 'CRITICAL').length}
            </span>
          </div>
        </div>
      </div>

      {/* Statutory Attestation Form */}
      <form onSubmit={handleApprove} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Digital Signature & Professional Attribution
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Identity will be bound with SHA-256 cryptographic digest to the generated report document.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pathologist Designation *
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Medical Council / State Registration Number *
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Approval Comments / Release Notes
          </label>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={attestationChecked}
              onChange={(e) => setAttestationChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              I hereby certify that I have reviewed the pre-analytical specimen integrity, calibration
              verifications, and investigation results herein. I authorize this diagnostic report to be
              digitally sealed and published to the patient portal and referring physician.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Link
            href={`/laboratory/reports/${report.id}`}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !attestationChecked}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Signing & Approving...
              </>
            ) : (
              'Confirm Approval & Digital Signature'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
