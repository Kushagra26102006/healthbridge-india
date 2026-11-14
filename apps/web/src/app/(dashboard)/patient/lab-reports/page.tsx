'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  LabReportsHeader,
  LabReportSummary,
  LabReportFilters,
  LabReportList,
  LabReportsSkeleton,
} from '@/components/patient/lab-reports';
import {
  useLabReports,
  useLabReportSummary,
  useDownloadLabReport,
} from '@/features/lab-reports/hooks/use-lab-reports';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  LabTestCategory,
  LabReportStatus,
  LabReportFilterQueryDto,
} from '@healthbridge/shared-types';

function PatientLabReportsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const initialCategory = (searchParams.get('category') as LabTestCategory) || undefined;
  const initialStatus = (searchParams.get('status') as LabReportStatus | 'ALL') || 'ALL';
  const initialSearch = searchParams.get('search') || '';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<LabTestCategory | undefined>(initialCategory);
  const [status, setStatus] = useState<LabReportStatus | 'ALL'>(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [page, setPage] = useState(initialPage);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Sync state with URL params
  const updateQueryParams = useCallback(
    (params: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '' && val !== 'ALL') {
          current.set(key, String(val));
        } else {
          current.delete(key);
        }
      });
      const query = current.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const queryFilters: LabReportFilterQueryDto = {
    page,
    limit: 10,
    search: search || undefined,
    category: category || undefined,
    status: status === 'ALL' ? undefined : status,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortOrder,
  };

  const { reports, pagination, isLoading, isError, refetch } = useLabReports(queryFilters);
  const { summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useLabReportSummary();
  const downloadMutation = useDownloadLabReport();

  const handleFilterChange = (newFilters: {
    search?: string;
    category?: LabTestCategory;
    status?: LabReportStatus | 'ALL';
    startDate?: string;
    endDate?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    setSearch(newFilters.search || '');
    setCategory(newFilters.category);
    setStatus(newFilters.status || 'ALL');
    setStartDate(newFilters.startDate || '');
    setEndDate(newFilters.endDate || '');
    setSortOrder(newFilters.sortOrder || 'desc');
    setPage(1);

    updateQueryParams({
      search: newFilters.search,
      category: newFilters.category,
      status: newFilters.status,
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
      sortOrder: newFilters.sortOrder,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory(undefined);
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setPage(1);
    router.replace(pathname, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async (reportId: string, testName: string) => {
    try {
      setDownloadingId(reportId);
      setDownloadError(null);
      const safeName = testName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await downloadMutation.mutateAsync({
        reportId,
        fileName: `${safeName}_report.pdf`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download report document';
      setDownloadError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <LabReportsHeader />

      {/* Summary Metrics */}
      <LabReportSummary summary={summary} isLoading={isSummaryLoading} />

      {/* Clinical Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed shadow-sm">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Clinical Information Notice
          </p>
          <p className="text-amber-700/90 dark:text-amber-300/80">
            Laboratory results should always be reviewed with a qualified healthcare professional.
            Biological reference ranges and interpretation vary according to laboratory instrumentation,
            age, gender, and clinical context. This platform does not provide automated diagnostic decisions.
          </p>
        </div>
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

      {/* Filters and Search */}
      <LabReportFilters
        filters={{
          search,
          category,
          status,
          startDate,
          endDate,
          sortOrder,
        }}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Report List / Loading / Error */}
      {isLoading ? (
        <LabReportsSkeleton count={4} />
      ) : isError ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Unable to load laboratory reports
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            An error occurred while communicating with the diagnostic laboratory service.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              refetchSummary();
            }}
            className="gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      ) : (
        <LabReportList
          reports={reports}
          pagination={pagination}
          onPageChange={handlePageChange}
          onDownload={handleDownload}
          downloadingId={downloadingId}
          onResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
}

export default function PatientLabReportsPage() {
  return (
    <Suspense fallback={<LabReportsSkeleton count={4} />}>
      <PatientLabReportsContent />
    </Suspense>
  );
}
