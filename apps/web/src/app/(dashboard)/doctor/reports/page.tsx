'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Download,
  AlertTriangle,
  RefreshCw,
  Eye,
  Building2,
} from 'lucide-react';
import { laboratoryReportsApi } from '@/features/laboratory/api/laboratory-reports-api';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';
import type { LabReportListItemDto } from '@healthbridge/shared-types';

export default function DoctorReportsPage() {
  const [reports, setReports] = useState<LabReportListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ABNORMAL' | 'CRITICAL'>('ALL');

  const fetchDoctorReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await laboratoryReportsApi.getDoctorReports({ search: searchQuery || undefined });
      setReports(data.items);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load patient diagnostic reports');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchDoctorReports();
  }, [fetchDoctorReports]);

  const handleDownloadPdf = async (reportId: string, reportNumber: string) => {
    try {
      const blob = await laboratoryReportsApi.downloadReportPdf(reportId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF document');
    }
  };

  const filteredReports = reports.filter((r) => {
    if (selectedFilter === 'ABNORMAL') return r.hasAbnormalResults;
    if (selectedFilter === 'CRITICAL') return r.hasAbnormalResults; // abnormal or critical
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Patient Diagnostic Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              Clinical Access
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access authorized laboratory diagnostic results for your patients and clinical encounters.
          </p>
        </div>

        <button
          onClick={fetchDoctorReports}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Reports ({reports.length})
            </button>
            <button
              onClick={() => setSelectedFilter('ABNORMAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedFilter === 'ABNORMAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Abnormal Values ({reports.filter((r) => r.hasAbnormalResults).length})
            </button>
          </div>

          <div className="flex-1 sm:max-w-xs relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by test or report ID..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Report Ref</th>
                <th className="px-4 py-3">Diagnostic Test</th>
                <th className="px-4 py-3">Issuing Laboratory</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Findings</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading patient reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No diagnostic reports found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed reports for your clinical encounters will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                      <Link href={`/doctor/reports/${report.id}`} className="hover:text-blue-600 hover:underline">
                        {report.reportNumber}
                      </Link>
                      {report.currentVersion && report.currentVersion > 1 && (
                        <span className="text-[10px] font-bold ml-1.5 px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                          v{report.currentVersion}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {report.testName}
                      </div>
                      <div className="text-[11px] text-slate-400">{report.category}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{report.laboratoryName}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <ReportStatusBadge status={report.status} />
                    </td>

                    <td className="px-4 py-3">
                      {report.hasAbnormalResults ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          Abnormal
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Normal Range</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(report.testDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/doctor/reports/${report.id}`}
                          title="Open Clinical Report"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDownloadPdf(report.id, report.reportNumber)}
                          title="Download Verified PDF"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
