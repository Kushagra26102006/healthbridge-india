'use client';

import React, { useState } from 'react';
import { Filter, RotateCcw, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  MedicalRecordType,
  MedicalRecordSource,
  RecordVerificationStatus,
} from '@healthbridge/shared-types';
import { cn } from '@/lib/utils';

export interface RecordsFilterState {
  category?: MedicalRecordType | '';
  source?: MedicalRecordSource | '';
  verificationStatus?: RecordVerificationStatus | '';
  startDate?: string;
  endDate?: string;
  sortBy: 'recordDate' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface RecordsFiltersProps {
  filters: RecordsFilterState;
  onFilterChange: (filters: RecordsFilterState) => void;
  onReset: () => void;
  className?: string;
}

const CATEGORY_OPTIONS: Array<{ value: MedicalRecordType | ''; label: string }> = [
  { value: '', label: 'All Categories' },
  { value: 'OP_CONSULTATION', label: 'Doctor Consultations' },
  { value: 'DISCHARGE_SUMMARY', label: 'Discharge Summaries' },
  { value: 'DIAGNOSTIC_REPORT', label: 'Diagnostic & Lab Reports' },
  { value: 'PRESCRIPTION', label: 'Prescriptions' },
  { value: 'IMMUNIZATION_RECORD', label: 'Vaccination Records' },
  { value: 'WELLNESS_RECORD', label: 'Wellness & History' },
];

const SOURCE_OPTIONS: Array<{ value: MedicalRecordSource | ''; label: string }> = [
  { value: '', label: 'All Sources' },
  { value: 'ABDM_INGESTION', label: 'ABDM Ingestion' },
  { value: 'EHR_SYNC', label: 'EHR Sync' },
  { value: 'MANUAL_ENTRY', label: 'Manual Entry' },
];

const VERIFICATION_OPTIONS: Array<{ value: RecordVerificationStatus | ''; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'SELF_SUBMITTED', label: 'Self Submitted' },
  { value: 'PENDING', label: 'Pending Verification' },
];

const SORT_OPTIONS: Array<{
  sortBy: 'recordDate' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  label: string;
}> = [
  { sortBy: 'recordDate', sortOrder: 'desc', label: 'Newest First' },
  { sortBy: 'recordDate', sortOrder: 'asc', label: 'Oldest First' },
  { sortBy: 'title', sortOrder: 'asc', label: 'Title (A–Z)' },
];

export function RecordsFilters({
  filters,
  onFilterChange,
  onReset,
  className = '',
}: RecordsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate number of active non-default filters
  const activeCount = [
    Boolean(filters.category),
    Boolean(filters.source),
    Boolean(filters.verificationStatus),
    Boolean(filters.startDate || filters.endDate),
    filters.sortBy !== 'recordDate' || filters.sortOrder !== 'desc',
  ].filter(Boolean).length;

  const handleCategorySelect = (category: MedicalRecordType | '') => {
    onFilterChange({ ...filters, category });
  };

  const handleSortSelect = (option: (typeof SORT_OPTIONS)[number]) => {
    onFilterChange({
      ...filters,
      sortBy: option.sortBy,
      sortOrder: option.sortOrder,
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-xs">
        {CATEGORY_OPTIONS.map((cat) => {
          const isSelected = filters.category === cat.value;
          return (
            <button
              key={cat.value || 'ALL'}
              type="button"
              onClick={() => handleCategorySelect(cat.value)}
              className={cn(
                'px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap shrink-0 border text-xs',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground border-border/70 hover:border-border hover:text-foreground'
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filter Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Advanced Filters Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'h-8 px-2.5 text-xs gap-1.5',
              showAdvanced && 'bg-muted/60 border-primary/50 text-foreground'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeCount > 0 && (
              <Badge variant="teal" className="h-4 px-1.5 text-[10px] ml-0.5">
                {activeCount}
              </Badge>
            )}
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', showAdvanced && 'rotate-180')}
            />
          </Button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-card border border-border/80 rounded-xl px-2 py-1 text-xs">
            <span className="text-muted-foreground text-[11px] font-medium mr-1 hidden sm:inline">
              Sort:
            </span>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as [
                  'recordDate' | 'createdAt' | 'title',
                  'asc' | 'desc',
                ];
                handleSortSelect({ sortBy: sb, sortOrder: so, label: '' });
              }}
              className="bg-transparent text-foreground text-xs font-medium focus:outline-hidden cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option
                  key={`${opt.sortBy}-${opt.sortOrder}`}
                  value={`${opt.sortBy}-${opt.sortOrder}`}
                  className="bg-popover text-popover-foreground"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters CTA if any filter is active */}
          {activeCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Source and Verification Pill indicators if active */}
        <div className="hidden md:flex items-center gap-1.5">
          {filters.source && (
            <Badge variant="outline" className="text-[11px] py-0.5 bg-muted/40">
              Source: {filters.source}
            </Badge>
          )}
          {filters.verificationStatus && (
            <Badge variant="outline" className="text-[11px] py-0.5 bg-muted/40">
              Status: {filters.verificationStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvanced && (
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 animate-in fade-in-50 duration-200">
          {/* Source Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground block">
              Record Source
            </label>
            <select
              value={filters.source || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  source: (e.target.value as MedicalRecordSource) || '',
                })
              }
              className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value || 'ALL'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground block">
              Verification Status
            </label>
            <select
              value={filters.verificationStatus || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  verificationStatus: (e.target.value as RecordVerificationStatus) || '',
                })
              }
              className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40"
            >
              {VERIFICATION_OPTIONS.map((opt) => (
                <option key={opt.value || 'ALL'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>From Date</span>
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
              className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>To Date</span>
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
              className="w-full bg-background border border-border/80 rounded-xl px-2.5 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordsFilters;
