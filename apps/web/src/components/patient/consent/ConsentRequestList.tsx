'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsentRequestCard } from './ConsentRequestCard';
import { ConsentEmptyState } from './ConsentEmptyState';
import type { ConsentListItemDto, PaginationMeta } from '@healthbridge/shared-types';

export interface ConsentRequestListProps {
  consents: ConsentListItemDto[];
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onApproveClick?: (consent: ConsentListItemDto) => void;
  onRejectClick?: (consent: ConsentListItemDto) => void;
  onRevokeClick?: (consent: ConsentListItemDto) => void;
  onResetFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const ConsentRequestList: React.FC<ConsentRequestListProps> = ({
  consents,
  pagination,
  onPageChange,
  onApproveClick,
  onRejectClick,
  onRevokeClick,
  onResetFilters,
  emptyTitle = 'No consent records found',
  emptyDescription = 'There are currently no access permissions or requests matching your filters.',
}) => {
  if (consents.length === 0) {
    return (
      <ConsentEmptyState
        title={emptyTitle}
        description={emptyDescription}
        onResetFilters={onResetFilters}
      />
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.total || consents.length;
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {consents.map((consent) => (
          <ConsentRequestCard
            key={consent.id}
            consent={consent}
            onApprove={() => onApproveClick?.(consent)}
            onReject={() => onRejectClick?.(consent)}
            onRevoke={() => onRevokeClick?.(consent)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{consents.length}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{total}</span> permissions
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
