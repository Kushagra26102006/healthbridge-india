'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrescriptionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  startDate?: string;
  onStartDateChange?: (date: string) => void;
  endDate?: string;
  onEndDateChange?: (date: string) => void;
  onReset?: () => void;
}

export function PrescriptionFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset,
}: PrescriptionFiltersProps) {
  const statusOptions = [
    { value: 'ALL', label: 'All Prescriptions' },
    { value: 'DRAFT', label: 'Drafts' },
    { value: 'ACTIVE', label: 'Issued / Active' },
    { value: 'DISPENSED', label: 'Dispensed' },
    { value: 'DISCONTINUED', label: 'Discontinued' },
    { value: 'EXPIRED', label: 'Expired' },
  ];

  const hasActiveFilters =
    search.trim() !== '' ||
    status !== 'ALL' ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="p-3 rounded-xl border border-border/70 bg-card space-y-3">
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Rx number, medication name, or diagnosis..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Filter className="h-3 w-3" />
            <span className="hidden sm:inline">Status:</span>
          </div>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter prescriptions by status"
            className="text-xs py-1.5 px-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Date range inputs */}
          {onStartDateChange && (
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => onStartDateChange(e.target.value)}
              title="Start Date"
              aria-label="Start date filter"
              className="text-xs py-1 px-2 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          )}

          {onEndDateChange && (
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => onEndDateChange(e.target.value)}
              title="End Date"
              aria-label="End date filter"
              className="text-xs py-1 px-2 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          )}

          {hasActiveFilters && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}