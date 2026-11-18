'use client';

import * as React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  mobileHidden?: boolean;
  mobileLabel?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T, index: number) => string;
  loading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  caption?: string;
  stickyHeader?: boolean;
  compact?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  loading = false,
  skeletonRows = 5,
  emptyState,
  onRowClick,
  caption,
  stickyHeader = false,
  compact = false,
  className,
}: DataTableProps<T>) {
  const [sortState, setSortState] = React.useState<{ key: string; direction: SortDirection } | null>(
    null
  );

  const toggleSort = (key: string) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sortState) return data;
    const col = columns.find((c) => c.key === sortState.key);
    if (!col?.sortAccessor) return data;
    const accessor = col.sortAccessor;
    return [...data].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortState.direction === 'asc' ? av - bv : bv - av;
      }
      return sortState.direction === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [data, columns, sortState]);

  const alignClass = (align?: 'left' | 'center' | 'right') =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-card shadow-sm overflow-hidden',
          className
        )}
        aria-busy="true"
        aria-label="Loading table data"
      >
        <div className="border-b border-border bg-muted/40 px-4 py-3 flex gap-4">
          {columns.slice(0, 4).map((col) => (
            <div key={col.key} className="h-3.5 flex-1 rounded-sm bg-muted animate-pulse" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: skeletonRows }).map((_, idx) => (
            <div key={idx} className="px-4 py-3.5 flex gap-4 items-center">
              {columns.slice(0, 4).map((col) => (
                <div key={col.key} className="h-4 flex-1 rounded-sm bg-muted/80 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-card shadow-sm p-8 text-center',
          className
        )}
      >
        {emptyState ?? <p className="text-sm text-muted-foreground">No records available.</p>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Desktop / Tablet Structured Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead
            className={cn(
              'bg-muted/50 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground',
              stickyHeader && 'sticky top-0 z-10 backdrop-blur-sm bg-muted/85'
            )}
          >
            <tr>
              {columns.map((col) => {
                const isSorted = sortState?.key === col.key;
                const ariaSort = isSorted
                  ? sortState.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined;

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      compact ? 'px-3.5 py-2.5' : 'px-4 py-3',
                      'whitespace-nowrap',
                      alignClass(col.align),
                      col.headerClassName
                    )}
                  >
                    {col.sortable && col.sortAccessor ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-sm',
                          col.align === 'right' && 'flex-row-reverse'
                        )}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortState.direction === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {sortedData.map((row, idx) => (
              <tr
                key={getRowId(row, idx)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  'bg-card transition-colors',
                  onRowClick &&
                    'cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-primary/[0.06]'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      compact ? 'px-3.5 py-2.5' : 'px-4 py-3.5',
                      'text-foreground align-middle',
                      alignClass(col.align),
                      col.className
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Card List (prevents horizontal overflow on 375px screens) */}
      <div className="md:hidden divide-y divide-border">
        {sortedData.map((row, idx) => (
          <div
            key={getRowId(row, idx)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }
                : undefined
            }
            className={cn(
              'p-4 flex flex-col gap-2.5 bg-card transition-colors',
              onRowClick && 'cursor-pointer active:bg-muted/60 focus-ring'
            )}
          >
            {columns
              .filter((col) => !col.mobileHidden)
              .map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {col.mobileLabel ?? col.header}
                  </span>
                  <div className="text-right text-foreground min-w-0 break-words">
                    {col.cell(row)}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
