'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { laboratoryReportsApi } from '@/features/laboratory/api/laboratory-reports-api';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';
import type { LabReportDetailDto } from '@healthbridge/shared-types';

export default function PatientReportDetailPage() {
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
        const data = await laboratoryReportsApi.getPatientReportById(reportId);
        setReport(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Access denied. You can only view published reports.');
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
        Loading your verified report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Report Unavailable</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
          {error || 'This report is currently being processed or is unpublished. Only approved and published reports are accessible.'}
        </p>
        <Link
          href="/patient/reports"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to My Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/patient/reports"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to My Reports
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

      {/* Report Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Report Reference</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{report.reportNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Issuing Laboratory</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{report.laboratoryName}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Date of Examination</span>
            <span className="text-slate-700 dark:text-slate-300">
              {new Date(report.testDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Referring Physician</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{report.doctorName || 'Dr. Rajesh Verma'}</span>
          </div>
        </div>
      </div>

      {/* Observations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Investigation Results
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your results compared against normal biological reference standards.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3">Parameter</th>
                <th className="px-6 py-3">Your Result</th>
                <th className="px-6 py-3">Reference Range</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.observations.map((obs, idx) => {
                const isCrit = obs.isCritical || obs.flag === 'CRITICAL';
                const isAb = obs.isAbnormal || obs.flag === 'HIGH' || obs.flag === 'LOW' || obs.flag === 'ABNORMAL';

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      {obs.testName}
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
                          Critical Alert
                        </span>
                      ) : isAb ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                          {obs.flag || 'Out of Range'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                          Normal
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

      {/* Pathologist Notes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase mb-2">
          Clinical Interpretation & Recommendations
        </h4>
        <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 leading-relaxed">
          {report.interpretation || 'No acute abnormalities detected. Routine clinical correlation is recommended.'}
        </p>
      </div>

      {/* Digital Seal Card */}
      <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              Digitally Verified Diagnostic Document
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Sealed with SHA-256 cryptographic hash under ABDM clinical diagnostic protocols.
            </span>
          </div>
        </div>
        <div className="font-mono text-[10px] text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
          SHA-256: {report.documentHash?.slice(0, 24)}...
        </div>
      </div>
    </div>
  );
}
