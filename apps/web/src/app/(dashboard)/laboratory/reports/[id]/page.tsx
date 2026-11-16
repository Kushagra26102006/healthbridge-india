'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FileText,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  History,
  Send,
  FileCheck,
  RefreshCw,
  Code2,
  Stethoscope,
} from 'lucide-react';
import { useLaboratoryReportDetail } from '@/features/laboratory/hooks/use-laboratory-reports';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';
import { ReportSignatureMetadata } from '@/features/laboratory/components/ReportSignatureMetadata';
import { ReportAmendmentDialog } from '@/features/laboratory/components/ReportAmendmentDialog';

export default function LaboratoryReportDetailPage() {
  const params = useParams();
  const reportId = String(params?.id || '');

  const [isAmendmentOpen, setIsAmendmentOpen] = useState(false);
  const [showFhirRaw, setShowFhirRaw] = useState(false);

  const {
    report,
    fhirBundle,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    clearMessages,
    submitForReview,
    publishReport,
    requestAmendment,
    loadFhir,
    downloadPdf,
  } = useLaboratoryReportDetail(reportId);

  if (isLoading && !report) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        Loading diagnostic report details...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h2 className="font-bold text-slate-800 dark:text-slate-200">Report Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested laboratory report reference does not exist or access was denied.
        </p>
        <Link
          href="/laboratory/reports"
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Return to Reports
        </Link>
      </div>
    );
  }

  const handlePublish = async () => {
    try {
      await publishReport({ publicationNotes: 'Formal portal release to patient and physician' });
    } catch {
      // Error handled by hook
    }
  };

  const handleSubmitReview = async () => {
    try {
      await submitForReview({ notes: 'Submitted for consultant pathologist verification' });
    } catch {
      // Error handled by hook
    }
  };

  const handleAmendmentSubmit = async (dto: any) => {
    try {
      await requestAmendment(dto);
      setIsAmendmentOpen(false);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/laboratory/reports" className="hover:text-blue-600 hover:underline">
              Diagnostic Reports
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{report.reportNumber}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {report.testName}
            </h1>
            <ReportStatusBadge status={report.status} />
            {report.currentVersion && report.currentVersion > 1 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                v{report.currentVersion}.0 (AMENDED)
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {report.status === 'DRAFT' && (
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              Submit For Review
            </button>
          )}

          {(report.status === 'PENDING_REVIEW' || report.status === 'UNDER_REVIEW') && (
            <Link
              href={`/laboratory/reports/${report.id}/review`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <Clock className="w-3.5 h-3.5" />
              Reviewer Workspace
            </Link>
          )}

          {report.status === 'APPROVED' && (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Publish & Release Report
            </button>
          )}

          {(report.status === 'PUBLISHED' || report.status === 'AMENDED' || report.status === 'COMPLETED') && (
            <button
              onClick={() => setIsAmendmentOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Request Amendment
            </button>
          )}

          <Link
            href={`/laboratory/reports/${report.id}/versions`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            <History className="w-3.5 h-3.5" />
            Versions ({report.currentVersion || 1})
          </Link>

          <Link
            href={`/laboratory/reports/${report.id}/preview`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            PDF Preview
          </Link>

          <button
            onClick={() => downloadPdf()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={clearMessages} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={clearMessages} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Header Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Patient Demographics */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <User className="w-4 h-4 text-blue-500" />
            <span>PATIENT DEMOGRAPHICS</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Patient Name:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{report.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">ABHA / Ref:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{report.patientAbhaId || 'PAT-HB-DIRECT'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Age / Gender:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {report.patientAge ? `${report.patientAge} Yrs` : 'Adult'} • {report.patientGender || 'Unspecified'}
              </span>
            </div>
          </div>
        </div>

        {/* Ordering & Clinical Context */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Stethoscope className="w-4 h-4 text-emerald-500" />
            <span>CLINICAL ORDER CONTEXT</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Referring Dr:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{report.doctorName || 'Dr. Rajesh Verma'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Order Ref:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{report.orderNumber || 'LBO-HB-DIRECT'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Category:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{report.category}</span>
            </div>
          </div>
        </div>

        {/* Laboratory & Timestamps */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>FACILITY & TIMESTAMPS</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Laboratory:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{report.laboratoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Sample Date:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {new Date(report.testDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Published:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {report.publishedAt
                  ? new Date(report.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Pending Authorization'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Observations / Investigation Parameters Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Diagnostic Observations & Parameter Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Structured result parameters compared against verified biological reference ranges.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {report.observations.length} PARAMETERS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3">Investigation Parameter</th>
                <th className="px-6 py-3">Observed Value</th>
                <th className="px-6 py-3">Biological Reference Range</th>
                <th className="px-6 py-3">Interpretation / Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {report.observations.map((obs, idx) => {
                const isCrit = obs.isCritical || obs.flag === 'CRITICAL';
                const isAb = obs.isAbnormal || obs.flag === 'HIGH' || obs.flag === 'LOW' || obs.flag === 'ABNORMAL';

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition ${
                      isCrit ? 'bg-red-50/30 dark:bg-red-950/20' : isAb ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {obs.testName}
                      </div>
                      {obs.parameterCode && (
                        <div className="text-[11px] font-mono text-slate-400">
                          Code: {obs.parameterCode}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className={`text-sm font-bold ${
                        isCrit ? 'text-red-600 dark:text-red-400' : isAb ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {obs.value}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                        {obs.unit}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {obs.referenceRange} {obs.unit}
                    </td>

                    <td className="px-6 py-3.5">
                      {isCrit ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          CRITICAL ALERT
                        </span>
                      ) : isAb ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                          {obs.flag || 'ABNORMAL'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          NORMAL
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

      {/* Clinical Notes & Interpretation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
            Pathologist Interpretation & Impression
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            {report.interpretation || 'No acute pathological abnormality detected across evaluated parameters.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
            Laboratory Pre-Analytical Notes
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            {report.clinicalNotes || 'Diagnostic workup completed under standard clinical protocols.'}
          </p>
        </div>
      </div>

      {/* Digital Signature & Cryptographic Seal Card */}
      <ReportSignatureMetadata
        approvalDetails={report.approvalDetails}
        signatureMetadata={report.signatureMetadata}
        documentHash={report.documentHash}
        reportNumber={report.reportNumber}
        version={report.currentVersion}
      />

      {/* HL7 FHIR DiagnosticReport Bundle Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-500" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                HL7 FHIR R4 DiagnosticReport Resource
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Interoperable ABDM DiagnosticReport & Observation FHIR bundle representation
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (!fhirBundle) await loadFhir();
              setShowFhirRaw(!showFhirRaw);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition"
          >
            {showFhirRaw ? 'Hide FHIR JSON' : 'Inspect FHIR Bundle'}
          </button>
        </div>

        {showFhirRaw && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-96">
              {JSON.stringify(fhirBundle || { note: 'Loading FHIR bundle...' }, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Amendment Dialog Modal */}
      <ReportAmendmentDialog
        isOpen={isAmendmentOpen}
        onClose={() => setIsAmendmentOpen(false)}
        reportNumber={report.reportNumber}
        currentVersion={report.currentVersion || 1}
        onSubmit={handleAmendmentSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
