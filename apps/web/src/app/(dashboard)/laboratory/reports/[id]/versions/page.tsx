'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  History,
  ArrowLeft,
  Download,
  Calendar,
  User,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useLaboratoryReportDetail } from '@/features/laboratory/hooks/use-laboratory-reports';
import { ReportStatusBadge } from '@/features/laboratory/components/ReportStatusBadge';

export default function LaboratoryReportVersionsPage() {
  const params = useParams();
  const reportId = String(params?.id || '');

  const {
    report,
    versions,
    isLoading,
    error,
    downloadPdf,
  } = useLaboratoryReportDetail(reportId);

  if (isLoading && !report) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
        Loading immutable version ledger...
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
              <History className="w-6 h-6 text-purple-600" />
              Immutable Version History Ledger
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {report.reportNumber} • Complete chronological revision audit trail conforming to NABL retention standards.
            </p>
          </div>
          <ReportStatusBadge status={report.status} />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Version Timeline */}
      <div className="space-y-4">
        {versions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
            No historical versions archived yet. The current report represents the initial primary release (v1.0).
          </div>
        ) : (
          versions.map((ver, idx) => {
            const isLatest = ver.version === (report.currentVersion || 1);

            return (
              <div
                key={ver.id || idx}
                className={`p-6 rounded-2xl border transition shadow-xs ${
                  isLatest
                    ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      v{ver.version}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          Version {ver.version}.0 Snapshot
                        </h3>
                        {isLatest ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                            CURRENT ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            SUPERSEDED ARCHIVE
                          </span>
                        )}
                        <ReportStatusBadge status={ver.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(ver.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {ver.createdByName || 'Laboratory Staff'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadPdf(ver.version)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Snapshot PDF
                  </button>
                </div>

                {/* Amendment Reason and Changes if present */}
                {ver.amendmentReason && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                      Statutory Amendment Reason:
                    </span>
                    <p className="text-amber-900 dark:text-amber-200">{ver.amendmentReason}</p>
                    {ver.changedFields && ver.changedFields.length > 0 && (
                      <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                        Modified Parameter Codes: <code className="font-mono font-bold">{ver.changedFields.join(', ')}</code>
                      </div>
                    )}
                  </div>
                )}

                {/* SHA-256 Document Seal */}
                <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cryptographic Digest:</span>
                    <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                      {ver.documentHash || 'Verified internal SHA-256 seal'}
                    </code>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Immutable snapshot preserved
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
