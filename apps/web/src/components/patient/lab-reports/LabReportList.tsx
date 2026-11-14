'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LabReportCard } from './LabReportCard';
import { LabReportsEmptyState } from './LabReportsEmptyState';
import type { LabReportListItemDto, PaginationMeta } from '@healthbridge/shared-types';

export interface LabReportListProps {
  reports: LabReportListItemDto[];
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onDownload?: (reportId: string, testName: string) => void;
  downloadingId?: string | null;
  onResetFilters?: () => void;
}

export const LabReportList: React.FC<LabReportListProps> = ({
  reports,
  pagination,
  onPageChange,
  onDownload,
  downloadingId,
  onResetFilters,
}) => {
  if (reports.length === 0) {
    return (
      <LabReportsEmptyState
        title="No laboratory reports found"
        description="We couldn't find any diagnostic reports matching your search or filter criteria."
        onResetFilters={onResetFilters}
      />
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.total || reports.length;
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-4">
      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <LabReportCard
            key={report.id}
            report={report}
            onDownload={onDownload}
            isDownloading={downloadingId === report.id}
          />
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{reports.length}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{total}</span> diagnostic reports
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevious}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="h-8 gap-1 rounded-lg border-slate-200 dark:border-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="h-8 gap-1 rounded-lg border-slate-200 dark:border-slate-800"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
