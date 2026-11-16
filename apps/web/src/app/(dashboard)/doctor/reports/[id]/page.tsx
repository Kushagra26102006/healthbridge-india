'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Calendar,
  Building2,
  AlertTriangle,
  RefreshCw,
  User,
} from 'lucide-react';
import { laboratoryReportsApi } from '@/features/laboratory/api/laboratory-reports-api';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';
import { ReportSignatureMetadata } from '@/features/laboratory/components/ReportSignatureMetadata';
import type { LabReportDetailDto } from '@healthbridge/shared-types';

export default function DoctorReportDetailPage() {
  const params = useParams();
  const reportId = String(params?.id || '');

  const [report, setReport] = useState<LabReportDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await laboratoryReportsApi.getDoctorReportById(reportId);
        setReport(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Access denied. You can only view authorized patient reports.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleDownloadPdf = async () => {
    if (!report) return;
    try {
      const blob = await laboratoryReportsApi.downloadReportPdf(report.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.reportNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF document');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        Loading clinical report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
          {error || 'You do not have an active clinical relationship or order consent for this patient report.'}
        </p>
        <Link
          href="/doctor/reports"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Reports
        </Link>
      </div>
    );
  }

  const hasCritical = report.observations.some((o) => o.isCritical || o.flag === 'CRITICAL');

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/doctor/reports"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Patient Reports
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {report.testName}
            </h1>
            <ReportStatusBadge status={report.status} />
            {report.currentVersion && report.currentVersion > 1 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                v{report.currentVersion}.0 (Amended)
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          Download Verified PDF
        </button>
      </div>

      {/* Critical Alert Banner */}
      {hasCritical && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold block">CRITICAL LABORATORY ALERT:</span>
            <span>
              One or more parameters exceed statutory critical thresholds. Immediate clinical evaluation advised.
            </span>
          </div>
        </div>
      )}

      {/* Patient & Facility Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold mb-2">
            <User className="w-4 h-4 text-blue-500" />
            <span>PATIENT</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{report.patientName}</p>
          <p className="text-slate-500 font-mono text-[11px] mt-0.5">{report.patientAbhaId || 'PAT-HB'}</p>
          <p className="text-slate-500 text-[11px] mt-1">
            {report.patientAge ? `${report.patientAge} Yrs` : 'Adult'} • {report.patientGender || 'Unspecified'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold mb-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            <span>LABORATORY</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-slate-100">{report.laboratoryName}</p>
          <p className="text-slate-500 text-[11px] mt-0.5">NABL Accredited Facility</p>
          <p className="text-slate-400 font-mono text-[10px] mt-1">Ref: {report.reportNumber}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold mb-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>TIMELINE</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Exam Date:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {new Date(report.testDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Published:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {report.publishedAt
                  ? new Date(report.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Observations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Clinical Investigation Parameters
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {report.observations.length} Observations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3">Parameter Name</th>
                <th className="px-6 py-3">Observed Value</th>
                <th className="px-6 py-3">Reference Range</th>
                <th className="px-6 py-3">Interpretation</th>
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
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {obs.testName}
                      {obs.parameterCode && (
                        <span className="text-[10px] font-mono text-slate-400 block">
                          LOINC / Code: {obs.parameterCode}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className={`text-sm font-bold ${
                        isCrit ? 'text-red-600' : isAb ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {obs.value}
                      </span>
                      <span className="text-slate-400 ml-1">{obs.unit}</span>
                    </td>

                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {obs.referenceRange} {obs.unit}
                    </td>

                    <td className="px-6 py-3.5">
                      {isCrit ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                          CRITICAL ALERT
                        </span>
                      ) : isAb ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                          {obs.flag || 'OUT OF RANGE'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
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

      {/* Pathologist Clinical Impression & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase mb-2">
            Pathologist Clinical Impression
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 leading-relaxed">
            {report.interpretation || 'No acute pathological abnormalities identified.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase mb-2">
            Pre-Analytical Laboratory Notes
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 leading-relaxed">
            {report.clinicalNotes || 'Specimen processed under standard clinical laboratory procedures.'}
          </p>
        </div>
      </div>

      {/* Pathologist Digital Signature Metadata */}
      <ReportSignatureMetadata
        approvalDetails={report.approvalDetails}
        signatureMetadata={report.signatureMetadata}
        documentHash={report.documentHash}
        reportNumber={report.reportNumber}
        version={report.currentVersion}
      />
    </div>
  );
}
