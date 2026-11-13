'use client';

import React from 'react';
import { SearchX, FolderPlus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RecordsEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  onUploadClick?: () => void;
  className?: string;
}

export function RecordsEmptyState({
  isFiltered = false,
  onResetFilters,
  onUploadClick,
  className,
}: RecordsEmptyStateProps) {
  if (isFiltered) {
    return (
      <div
        className={cn(
          'p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/15 flex flex-col items-center justify-center space-y-3.5',
          className
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center">
          <SearchX className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h4 className="text-sm font-bold text-foreground">No matching health records</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We couldn’t find any medical records matching your search or active filter criteria. Try
            adjusting the date range or category.
          </p>
        </div>
        {onResetFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs h-8 px-3 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/15 flex flex-col items-center justify-center space-y-3.5',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
        <FolderPlus className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-foreground">No Health Records Available</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your personal health record repository is currently empty. You can securely upload your
          past prescriptions, lab reports, or link your ABDM Health Account.
        </p>
      </div>
      {onUploadClick && (
        <Button
          variant="teal"
          size="sm"
          onClick={onUploadClick}
          className="text-xs h-8 px-3.5 gap-1.5"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          Upload First Health Record
        </Button>
      )}
    </div>
  );
}

export default RecordsEmptyState;

