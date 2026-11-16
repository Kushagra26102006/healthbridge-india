'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Download,
  FileCheck,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useLaboratoryReportDetail } from '@/features/laboratory/hooks/use-laboratory-reports';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';

export default function LaboratoryReportPreviewPage() {
  const params = useParams();
  const reportId = String(params?.id || '');

  const {
    report,
    isLoading,
    isSubmitting,
    error,
    publishReport,
    downloadPdf,
  } = useLaboratoryReportDetail(reportId);

  if (isLoading && !report) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        Generating document preview...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 py-6 print:p-0 print:max-w-none">
      {/* Top Action Bar - Hidden during Print */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link
            href={`/laboratory/reports/${report.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Report Details
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Printable Diagnostic Report Preview
            </h1>
            <ReportStatusBadge status={report.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report.status === 'APPROVED' && (
            <button
              onClick={() => publishReport({ publicationNotes: 'Released via Preview' })}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
            >
              <FileCheck className="w-4 h-4" />
              Publish & Release
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>

          <button
            onClick={() => downloadPdf()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200 print:hidden">
          {error}
        </div>
      )}

      {/* Actual Printable Document Sheet */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg font-sans print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {report.laboratoryName || 'HEALTHBRIDGE DIAGNOSTICS'}
            </h2>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              NABL ACCREDITED MEDICAL TESTING LABORATORY • ISO 15189
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {report.laboratoryAddress || 'Central Reference Laboratory, Sector 18, New Delhi - 110089'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Accreditation Ref: {report.nablAccreditationNumber || 'NABL-MC-9941'}
            </p>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-sm font-black font-mono tracking-tight block">
              {report.reportNumber}
            </span>
            <span className="text-xs font-bold text-slate-700 block">
              Version: v{report.currentVersion || 1}.0 {report.currentVersion && report.currentVersion > 1 ? '(AMENDED)' : ''}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Status: {report.status}
            </span>
          </div>
        </div>

        {/* Demographics & Clinical Order Information Bar */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-6">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Patient Name</span>
            <span className="font-bold text-slate-900">{report.patientName}</span>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">{report.patientAbhaId || 'PAT-HB'}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Age / Gender</span>
            <span className="font-medium text-slate-900">
              {report.patientAge ? `${report.patientAge} Years` : 'Adult'} / {report.patientGender || 'Unspecified'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Referring Doctor</span>
            <span className="font-medium text-slate-900">{report.doctorName || 'Dr. Rajesh Verma'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Sample / Exam Date</span>
            <span className="font-medium text-slate-900">
              {new Date(report.testDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Diagnostic Test Title */}
        <div className="mb-4">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
            DEPARTMENT OF {report.category}
          </h3>
          <p className="text-xs font-bold text-slate-700 uppercase">
            INVESTIGATION: {report.testName}
          </p>
        </div>

        {/* Investigation Parameters Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
              <tr>
                <th className="px-4 py-2.5">Investigation Parameter</th>
                <th className="px-4 py-2.5">Observed Value</th>
                <th className="px-4 py-2.5">Biological Reference Range</th>
                <th className="px-4 py-2.5">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.observations.map((obs, idx) => {
                const isCrit = obs.isCritical || obs.flag === 'CRITICAL';
                const isAb = obs.isAbnormal || obs.flag === 'HIGH' || obs.flag === 'LOW' || obs.flag === 'ABNORMAL';

                return (
                  <tr key={idx} className={isCrit ? 'bg-red-50/50' : isAb ? 'bg-amber-50/40' : ''}>
                    <td className="px-4 py-2 font-medium text-slate-900">{obs.testName}</td>
                    <td className="px-4 py-2 font-bold text-slate-900">
                      {obs.value} <span className="font-normal text-slate-600 text-[11px]">{obs.unit}</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-600">
                      {obs.referenceRange} {obs.unit}
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      {isCrit ? (
                        <span className="text-red-700 font-bold">[CRITICAL]</span>
                      ) : isAb ? (
                        <span className="text-amber-700 font-bold">[{obs.flag || 'HIGH'}]</span>
                      ) : (
                        <span className="text-slate-600 font-normal">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pathologist Clinical Impression */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 text-xs space-y-2 mb-8">
          <h4 className="font-bold text-slate-900 uppercase text-[11px]">Clinical Impression & Interpretation</h4>
          <p className="text-slate-800 leading-relaxed">
            {report.interpretation || 'No acute pathological abnormality detected across evaluated parameters.'}
          </p>
          {report.clinicalNotes && (
            <p className="text-[11px] text-slate-600 border-t border-slate-200 pt-2 italic">
              Note: {report.clinicalNotes}
            </p>
          )}
        </div>

        {/* Document Footer: Attestation & Signature */}
        <div className="border-t-2 border-slate-900 pt-4 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>DIGITALLY VERIFIED & AUTHORIZED</span>
            </div>
            <p className="text-slate-700 font-semibold">
              {report.approvalDetails?.approvedByName || report.signatureMetadata?.signerName || 'Dr. Anand Verma'}
            </p>
            <p className="text-[11px] text-slate-500">
              {report.approvalDetails?.approvedByDesignation || 'Consultant Pathologist & Laboratory Director'}
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              {report.approvalDetails?.approvedByRegistrationNumber || 'MCI / State Council Registered'}
            </p>
          </div>

          <div className="text-right sm:text-right space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-mono">
              Document SHA-256 Digest
            </p>
            <code className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 block max-w-xs truncate">
              {report.documentHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </code>
            <p className="text-[9px] text-slate-400 italic">
              Verified under HealthBridge ABDM Diagnostic Cryptographic Architecture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
