'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LabReportDetails } from '@/components/patient/lab-reports/LabReportDetails';
import {
  useLabReportDetails,
  useDownloadLabReport,
} from '@/features/lab-reports/hooks/use-lab-reports';

export default function PatientLabReportDetailPage() {
  const params = useParams();
  const reportId = params?.reportId as string;

  const { report, isLoading, isError, refetch } = useLabReportDetails(reportId);
  const downloadMutation = useDownloadLabReport();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!report) return;
    try {
      setDownloadError(null);
      const safeName = report.testName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await downloadMutation.mutateAsync({
        reportId: report.id,
        fileName: `${safeName}_report.pdf`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download report document';
      setDownloadError(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
          <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
          <div className="h-40 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </Card>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Diagnostic Report Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The requested laboratory report could not be found or you do not have permission to view it.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/patient/lab-reports">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Reports
            </Button>
          </Link>
          <Button variant="default" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between">
        <Link href="/patient/lab-reports">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Lab Reports</span>
          </Button>
        </Link>
      </div>

      {/* Download Error Alert */}
      {downloadError && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{downloadError}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDownloadError(null)}
            className="h-7 text-xs px-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Report Detailed View */}
      <LabReportDetails
        report={report}
        onDownload={handleDownload}
        isDownloading={downloadMutation.isPending}
      />
    </div>
  );
}
