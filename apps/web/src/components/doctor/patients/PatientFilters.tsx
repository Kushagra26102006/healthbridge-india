'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DirectoryFilterType = 'all' | 'recently-seen' | 'upcoming-appointments' | 'active-care';

interface PatientFiltersProps {
  activeFilter: DirectoryFilterType;
  onFilterChange: (filter: DirectoryFilterType) => void;
  totalCount?: number;
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  activeFilter,
  onFilterChange,
  totalCount,
}) => {
  const tabs: Array<{ id: DirectoryFilterType; label: string }> = [
    { id: 'all', label: 'All Patients' },
    { id: 'recently-seen', label: 'Recently Seen' },
    { id: 'upcoming-appointments', label: 'Upcoming Consultations' },
    { id: 'active-care', label: 'Active ABDM Consent' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium text-xs transition-all',
                isActive
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {totalCount !== undefined && (
        <Badge variant="outline" className="text-xs px-2.5 py-1 border-border font-mono">
          {totalCount} Authorized Patient{totalCount === 1 ? '' : 's'}
        </Badge>
      )}
    </div>
  );
};
