'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EncounterType } from '@healthbridge/shared-types';

export interface EncounterFiltersProps {
  filterTab: 'all' | 'today' | 'draft' | 'completed' | 'pending';
  onFilterTabChange: (tab: 'all' | 'today' | 'draft' | 'completed' | 'pending') => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
  encounterType?: EncounterType;
  onEncounterTypeChange: (type?: EncounterType) => void;
  startDate?: string;
  onStartDateChange: (date?: string) => void;
  endDate?: string;
  onEndDateChange: (date?: string) => void;
  status?: string;
  onStatusChange: (status?: string) => void;
  onReset: () => void;
}

export function EncounterFilters({
  filterTab,
  onFilterTabChange,
  searchQuery,
  onSearchChange,
  encounterType,
  onEncounterTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  status,
  onStatusChange,
  onReset,
}: EncounterFiltersProps) {
  const tabs = [
    { id: 'all' as const, label: 'All Encounters' },
    { id: 'today' as const, label: 'Today' },
    { id: 'draft' as const, label: 'Drafts' },
    { id: 'completed' as const, label: 'Completed' },
    { id: 'pending' as const, label: 'Pending Doc' },
  ];

  const hasActiveFilters =
    searchQuery ||
    encounterType ||
    startDate ||
    endDate ||
    (status && status !== 'ALL') ||
    filterTab !== 'all';

  return (
    <div className="space-y-3.5 bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
      {/* Top row: Tab Switcher & Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/40 rounded-xl border border-border/50 text-xs self-start md:self-center">
          {tabs.map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterTabChange(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Patient / Chief Complaint Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient or diagnosis..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Type, Status, Date Range */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-border/50 text-xs">
        {/* Encounter Mode */}
        <select
          value={encounterType || ''}
          onChange={(e) =>
            onEncounterTypeChange((e.target.value as EncounterType) || undefined)
          }
          className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
        >
          <option value="">All Care Settings</option>
          <option value="AMBULATORY">Ambulatory (Clinic)</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="INPATIENT">Inpatient</option>
          <option value="HOME">Home Care</option>
          <option value="VIRTUAL">Virtual / Telehealth</option>
        </select>

        {/* Status Dropdown */}
        <select
          value={status || ''}
          onChange={(e) => onStatusChange(e.target.value || undefined)}
          className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="DRAFT">Draft</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onStartDateChange(e.target.value || undefined)}
            className="px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onEndDateChange(e.target.value || undefined)}
            className="px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        {/* Reset CTA */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground underline ml-auto transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
