'use client';

import React, { useState } from 'react';
import { BarChart3, Table2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChartAccessibleRow {
  label: string;
  value: string | number;
  share?: string;
}

export interface ChartShellProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  accessibleRows?: ChartAccessibleRow[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Unified accessible chart wrapper providing loading skeleton, error state,
 * empty state, and a keyboard-accessible Table View alternative.
 */
export function ChartShell({
  title,
  description,
  badge,
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle = 'No data available for selected filters',
  emptyDescription = 'Adjust the timeframe or category filter to inspect available records.',
  accessibleRows,
  actions,
  children,
  className,
}: ChartShellProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{title}</CardTitle>
              {badge}
            </div>
            {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 print:hidden">
            {accessibleRows && accessibleRows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTable((prev) => !prev)}
                aria-pressed={showTable}
                aria-label={showTable ? `Switch ${title} to chart view` : `Switch ${title} to accessible table view`}
                className="h-7 px-2.5 text-xs"
              >
                {showTable ? (
                  <>
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Chart</span>
                  </>
                ) : (
                  <>
                    <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Table</span>
                  </>
                )}
              </Button>
            )}
            {actions}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3 py-4" aria-busy="true" aria-label={`Loading ${title}`}>
            <div className="h-44 w-full rounded-lg bg-muted/60 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : isEmpty ? (
          <div className="py-10 px-4 text-center rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {emptyDescription}
            </p>
          </div>
        ) : showTable && accessibleRows ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Category / Period</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Value</th>
                  {accessibleRows.some((r) => r.share) && (
                    <th className="py-2.5 px-3 font-semibold text-right">Share</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {accessibleRows.map((row) => (
                  <tr key={row.label} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium text-foreground">{row.label}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-foreground">
                      {row.value}
                    </td>
                    {accessibleRows.some((r) => r.share) && (
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-muted-foreground">
                        {row.share ?? '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default ChartShell;
