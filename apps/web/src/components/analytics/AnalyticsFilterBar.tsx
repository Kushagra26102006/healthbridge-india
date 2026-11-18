'use client';

import React from 'react';
import { Calendar, Download, Printer, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AnalyticsTimeframe } from '@/lib/analytics/export';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface AnalyticsFilterBarProps {
  timeframe: AnalyticsTimeframe;
  onTimeframeChange: (tf: AnalyticsTimeframe) => void;
  showTimeframe?: boolean;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (date: string) => void;
  onToDateChange?: (date: string) => void;
  categoryLabel?: string;
  categoryValue?: string;
  categoryOptions?: FilterOption[];
  onCategoryChange?: (val: string) => void;
  secondaryLabel?: string;
  secondaryValue?: string;
  secondaryOptions?: FilterOption[];
  onSecondaryChange?: (val: string) => void;
  onExportCsv?: () => void;
  onPrintReport?: () => void;
  onReset?: () => void;
  exportDisabled?: boolean;
  className?: string;
}

const TIMEFRAMES: { value: AnalyticsTimeframe; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function AnalyticsFilterBar({
  timeframe,
  onTimeframeChange,
  showTimeframe = true,
  fromDate = '',
  toDate = '',
  onFromDateChange,
  onToDateChange,
  categoryLabel = 'Category',
  categoryValue = '',
  categoryOptions,
  onCategoryChange,
  secondaryLabel = 'Filter',
  secondaryValue = '',
  secondaryOptions,
  onSecondaryChange,
  onExportCsv,
  onPrintReport,
  onReset,
  exportDisabled = false,
  className,
}: AnalyticsFilterBarProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-3.5 shadow-xs space-y-3 print:hidden',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Timeframe Segmented Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {showTimeframe && (
            <div
              role="group"
              aria-label="Analytics timeframe view"
              className="inline-flex items-center gap-1 rounded-md bg-muted/80 p-1 border border-border/70"
            >
              {TIMEFRAMES.map((tf) => {
                const active = timeframe === tf.value;
                return (
                  <button
                    key={tf.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onTimeframeChange(tf.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-sm text-xs font-medium transition-all focus-ring',
                      active
                        ? 'bg-surface text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom Date Range */}
          {onFromDateChange && onToDateChange && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" aria-hidden="true" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                aria-label="Filter from date"
                className="h-8 rounded-md border border-input bg-surface px-2 text-xs text-foreground focus-ring"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                aria-label="Filter to date"
                className="h-8 rounded-md border border-input bg-surface px-2 text-xs text-foreground focus-ring"
              />
            </div>
          )}

          {/* Category & Secondary Filters */}
          {categoryOptions && onCategoryChange && (
            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" aria-hidden="true" />
              <select
                value={categoryValue}
                onChange={(e) => onCategoryChange(e.target.value)}
                aria-label={categoryLabel}
                className="h-8 rounded-md border border-input bg-surface px-2.5 text-xs text-foreground focus-ring"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {secondaryOptions && onSecondaryChange && (
            <select
              value={secondaryValue}
              onChange={(e) => onSecondaryChange(e.target.value)}
              aria-label={secondaryLabel}
              className="h-8 rounded-md border border-input bg-surface px-2.5 text-xs text-foreground focus-ring"
            >
              {secondaryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2 text-xs">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Right: Permission-Safe Export Actions */}
        {(onExportCsv || onPrintReport) && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onExportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                disabled={exportDisabled}
                className="h-8 text-xs"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Export CSV</span>
              </Button>
            )}
            {onPrintReport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onPrintReport}
                disabled={exportDisabled}
                className="h-8 text-xs"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Print / PDF</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsFilterBar;
