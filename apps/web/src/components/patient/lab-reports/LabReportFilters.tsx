'use client';

import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, X, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { LabTestCategory, LabReportStatus } from '@healthbridge/shared-types';

export interface LabReportFiltersState {
  search?: string;
  category?: LabTestCategory;
  status?: LabReportStatus | 'ALL';
  startDate?: string;
  endDate?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LabReportFiltersProps {
  filters: LabReportFiltersState;
  onFilterChange: (filters: LabReportFiltersState) => void;
  onReset: () => void;
}

const CATEGORIES: Array<{ key: LabTestCategory; label: string }> = [
  { key: 'BLOOD_TESTS', label: 'Blood Tests' },
  { key: 'URINE_TESTS', label: 'Urine Tests' },
  { key: 'BIOCHEMISTRY', label: 'Biochemistry' },
  { key: 'HEMATOLOGY', label: 'Hematology' },
  { key: 'IMAGING', label: 'Imaging & X-Ray' },
  { key: 'MICROBIOLOGY', label: 'Microbiology' },
  { key: 'OTHER', label: 'Other Tests' },
];

export const LabReportFilters: React.FC<LabReportFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  const activeCount = Object.entries(filters).filter(
    ([key, value]) => Boolean(value) && !(key === 'sortOrder' && value === 'desc') && !(key === 'status' && value === 'ALL')
  ).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchTerm.trim() || undefined });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    onFilterChange({ ...filters, search: undefined });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by test name, lab (e.g. Lal PathLabs), or ref ID (LBR-...)"
          className="pl-10 pr-24 h-11 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder:text-slate-400 focus-visible:ring-teal-500"
        />
        <div className="absolute right-2 flex items-center space-x-1">
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="h-7 text-xs px-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Category Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Diagnostic Categories</span>
          {activeCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-6 text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center p-0"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset all
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, category: undefined })}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              !filters.category
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    category: isSelected ? undefined : cat.key,
                  })
                }
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status, Date & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Status Toggle */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-medium mr-1">Status:</span>
          {(['ALL', 'COMPLETED', 'PENDING', 'PRELIMINARY'] as const).map((st) => {
            const isSelected = (filters.status || 'ALL') === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    status: st === 'ALL' ? undefined : (st as LabReportStatus),
                  })
                }
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* Sort Order */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium">Sort:</span>
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                ...filters,
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
              })
            }
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-medium"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>{filters.sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
