'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsultationType } from '@healthbridge/shared-types';

export interface AppointmentFiltersProps {
  filterTab: 'all' | 'today' | 'upcoming' | 'history' | 'pending';
  onFilterTabChange: (tab: 'all' | 'today' | 'upcoming' | 'history' | 'pending') => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  consultationType?: ConsultationType;
  onConsultationTypeChange: (type?: ConsultationType) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date?: string) => void;
  onEndDateChange: (date?: string) => void;
  onReset: () => void;
}

export function AppointmentFilters({
  filterTab,
  onFilterTabChange,
  searchQuery,
  onSearchChange,
  consultationType,
  onConsultationTypeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
}: AppointmentFiltersProps) {
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'pending', label: 'Pending' },
    { key: 'history', label: 'History' },
  ] as const;

  const hasActiveCustomFilters =
    Boolean(searchQuery) ||
    Boolean(consultationType) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    filterTab !== 'all';

  return (
    <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-sm space-y-3">
      {/* Top Bar: Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl overflow-x-auto text-xs font-semibold scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilterTabChange(tab.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap',
                filterTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search patient name or ID..."
            className="w-full bg-muted/40 text-xs rounded-xl pl-9 pr-3 py-2 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Bottom Bar: Mode Selector & Date Range */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60 text-xs">
        {/* Consultation Mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">Mode:</span>
          <select
            value={consultationType || ''}
            onChange={(e) =>
              onConsultationTypeChange(
                e.target.value ? (e.target.value as ConsultationType) : undefined
              )
            }
            className="bg-muted/40 text-xs rounded-lg px-2.5 py-1 border border-input text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Modes</option>
            <option value="IN_PERSON">In-Person Clinic</option>
            <option value="TELECONSULTATION">Teleconsultation</option>
          </select>
        </div>

        {/* Date Range Start */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">From:</span>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onStartDateChange(e.target.value || undefined)}
            className="bg-muted/40 text-xs rounded-lg px-2 py-1 border border-input text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Date Range End */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">To:</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onEndDateChange(e.target.value || undefined)}
            className="bg-muted/40 text-xs rounded-lg px-2 py-1 border border-input text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Reset Filters */}
        {hasActiveCustomFilters && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
