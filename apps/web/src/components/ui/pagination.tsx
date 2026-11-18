'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && totalItems === undefined) return null;

  const safeTotal = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), safeTotal);
  const pages = getPageNumbers(current, safeTotal);

  const rangeStart = totalItems && pageSize ? (current - 1) * pageSize + 1 : undefined;
  const rangeEnd = totalItems && pageSize ? Math.min(current * pageSize, totalItems) : undefined;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 pt-2',
        className
      )}
    >
      {totalItems !== undefined && rangeStart !== undefined && rangeEnd !== undefined ? (
        <p className="text-xs text-muted-foreground tabular-nums">
          Showing <span className="font-semibold text-foreground">{rangeStart}</span>–
          <span className="font-semibold text-foreground">{rangeEnd}</span> of{' '}
          <span className="font-semibold text-foreground">{totalItems}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground tabular-nums">
          Page <span className="font-semibold text-foreground">{current}</span> of{' '}
          <span className="font-semibold text-foreground">{safeTotal}</span>
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Previous page"
          className="inline-flex h-8 items-center gap-1 rounded-sm border border-border bg-surface px-2.5 text-xs font-medium text-foreground shadow-xs hover:bg-muted disabled:pointer-events-none disabled:opacity-45 transition-colors focus-ring"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((entry, idx) =>
            entry === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                aria-current={entry === current ? 'page' : undefined}
                aria-label={`Page ${entry}`}
                className={cn(
                  'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-sm px-2 text-xs font-medium tabular-nums transition-colors focus-ring',
                  entry === current
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {entry}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          disabled={current >= safeTotal}
          onClick={() => onPageChange(current + 1)}
          aria-label="Next page"
          className="inline-flex h-8 items-center gap-1 rounded-sm border border-border bg-surface px-2.5 text-xs font-medium text-foreground shadow-xs hover:bg-muted disabled:pointer-events-none disabled:opacity-45 transition-colors focus-ring"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
