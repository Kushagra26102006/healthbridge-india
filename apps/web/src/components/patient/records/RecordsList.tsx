'use client';

import React from 'react';
import Link from 'next/link';
import { Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecordCard, getCategoryIcon, getCategoryBadge, getVerificationBadge } from './RecordCard';
import { RecordsEmptyState } from './RecordsEmptyState';
import type { IMedicalRecord, PaginationMeta } from '@healthbridge/shared-types';

export interface RecordsListProps {
  records: IMedicalRecord[];
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onDownload?: (recordId: string, fileName?: string) => void;
  isDownloading?: boolean;
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onUploadClick?: () => void;
}

export function RecordsList({
  records,
  pagination,
  onPageChange,
  onLimitChange,
  onDownload,
  isDownloading = false,
  isFiltered = false,
  onResetFilters,
  onUploadClick,
}: RecordsListProps) {
  if (records.length === 0) {
    return (
      <RecordsEmptyState
        isFiltered={isFiltered}
        onResetFilters={onResetFilters}
        onUploadClick={onUploadClick}
      />
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total || records.length;
  const limit = pagination?.limit || 20;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalCount);

  return (
    <div className="space-y-4">
      {/* 1. Mobile Cards Layout (Hidden on Desktop) */}
      <div className="md:hidden space-y-3">
        {records.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            onDownload={onDownload}
            isDownloading={isDownloading}
          />
        ))}
      </div>

      {/* 2. Desktop Table Layout (Visible on md+) */}
      <Card className="hidden md:block border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Record Title & Info</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Record Date</th>
                <th className="py-3 px-4">Healthcare Provider / Facility</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {records.map((record) => {
                const { icon: Icon, color, bg } = getCategoryIcon(record.recordType);
                const recordDateFormatted = new Date(
                  record.recordDate || record.createdAt
                ).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={record.id} className="hover:bg-muted/20 transition-colors group">
                    {/* Title & Ref */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5 max-w-xs">
                          <Link
                            href={`/patient/records/${record.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors block truncate"
                            title={record.title}
                          >
                            {record.title}
                          </Link>
                          {record.resourceReference && (
                            <span className="text-[10px] text-muted-foreground font-mono block truncate">
                              {record.resourceReference}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getCategoryBadge(record.recordType)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                      {recordDateFormatted}
                    </td>

                    {/* Provider & Facility */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        <span className="font-medium text-foreground block truncate">
                          {record.doctorName || 'Licensed Practitioner'}
                        </span>
                        <span className="text-[11px] text-muted-foreground block truncate">
                          {record.facilityName ||
                            (record.source === 'ABDM_INGESTION'
                              ? 'ABDM Network'
                              : 'Personal Upload')}
                        </span>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getVerificationBadge(record.verificationStatus)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {onDownload && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(record.id, record.fileName)}
                            disabled={isDownloading}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Download Record"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Link href={`/patient/records/${record.id}`}>
                          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                            <Eye className="h-3 w-3" />
                            <span>Details</span>
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Server Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{startRecord}</span> to{' '}
            <span className="font-semibold text-foreground">{endRecord}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> records
          </div>

          <div className="flex items-center gap-2">
            {onLimitChange && (
              <div className="flex items-center gap-1.5 mr-2">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="bg-card border border-border/80 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            <span className="px-2 font-medium text-foreground">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordsList;
