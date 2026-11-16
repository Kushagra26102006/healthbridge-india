'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  History,
  Download,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useLaboratoryReports } from '@/features/laboratory/hooks/use-laboratory-reports';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';
import type { LabReportStatus } from '@healthbridge/shared-types';

export default function LaboratoryReportsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const {
    reports,
    total,
    page,
    totalPages,
    setPage,
    setFilters,
    isLoading,
    error,
    refresh,
  } = useLaboratoryReports();

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setFilters({
      status: status === 'ALL' ? undefined : status,
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
    });
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      category: selectedCategory || undefined,
      search: searchQuery || undefined,
    });
    setPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setFilters({
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      category: cat || undefined,
      search: searchQuery || undefined,
    });
    setPage(1);
  };

  const statusTabs: { label: string; value: string }[] = [
    { label: 'All Reports', value: 'ALL' },
    { label: 'Drafts', value: 'DRAFT' },
    { label: 'Pending Review', value: 'PENDING_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Published', value: 'PUBLISHED' },
    { label: 'Amended', value: 'AMENDED' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Diagnostic Reports & Authorization
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              NABL ISO 15189
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pathologist review, digital signature attestation, immutable version ledger, and patient publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/laboratory/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <FileText className="w-4 h-4" />
            Compile from Order Queue
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Reports</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {reports.filter((r) => r.status === 'PENDING_REVIEW' || r.status === 'UNDER_REVIEW').length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Approved (Unreleased)</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {reports.filter((r) => r.status === 'APPROVED').length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Published & Sealed</span>
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {reports.filter((r) => r.status === 'PUBLISHED' || r.status === 'AMENDED' || r.status === 'COMPLETED').length}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedStatus === tab.value
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="HEMATOLOGY">Hematology</option>
              <option value="BIOCHEMISTRY">Biochemistry</option>
              <option value="CLINICAL_PATHOLOGY">Clinical Pathology</option>
              <option value="MICROBIOLOGY">Microbiology</option>
              <option value="SEROLOGY">Serology</option>
              <option value="BLOOD_TESTS">Blood Tests</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by report reference (LBR-...), test name, or order..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border-b border-red-200 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Report Reference</th>
                <th className="px-4 py-3">Diagnostic Investigation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Observations</th>
                <th className="px-4 py-3">Ordering Physician</th>
                <th className="px-4 py-3">Test Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading && reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading laboratory reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No laboratory reports found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed test result entries will appear here for pathologist review.
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/laboratory/reports/${report.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {report.reportNumber}
                        </Link>
                        {report.currentVersion && report.currentVersion > 1 ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                            v{report.currentVersion}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">v1.0</span>
                        )}
                      </div>
                      {report.orderId && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          Order: {report.orderId.slice(-6).toUpperCase()}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {report.testName}
                      </div>
                      <div className="text-[11px] text-slate-400">{report.category}</div>
                    </td>

                    <td className="px-4 py-3">
                      <ReportStatusBadge status={report.status as LabReportStatus} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {report.observationCount} parameters
                        </span>
                        {report.hasAbnormalResults && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                            ABNORMAL
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {report.doctorName || 'Attending Physician'}
                      </div>
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
                          href={`/laboratory/reports/${report.id}`}
                          title="View Report Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {(report.status === 'PENDING_REVIEW' || report.status === 'UNDER_REVIEW' || report.status === 'DRAFT') && (
                          <Link
                            href={`/laboratory/reports/${report.id}/review`}
                            title="Reviewer Workspace"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-md transition"
                          >
                            <Clock className="w-4 h-4" />
                          </Link>
                        )}

                        {report.status === 'APPROVED' && (
                          <Link
                            href={`/laboratory/reports/${report.id}/preview`}
                            title="Publish / PDF Preview"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-md transition"
                          >
                            <FileCheck className="w-4 h-4" />
                          </Link>
                        )}

                        <Link
                          href={`/laboratory/reports/${report.id}/versions`}
                          title="Version Ledger"
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-md transition"
                        >
                          <History className="w-4 h-4" />
                        </Link>

                        <Link
                          href={`/laboratory/reports/${report.id}/preview`}
                          title="Preview PDF"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                        >
                          <Download className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages} ({total} reports total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || isLoading}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || isLoading}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
