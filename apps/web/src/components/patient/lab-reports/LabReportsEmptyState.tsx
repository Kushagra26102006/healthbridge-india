'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyIllustration } from '@/components/ui/visual-asset';

export interface LabReportsEmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
  showOrdersLink?: boolean;
}

export const LabReportsEmptyState: React.FC<LabReportsEmptyStateProps> = ({
  title = 'No laboratory reports found',
  description = 'You currently have no diagnostic reports matching your active filters.',
  onResetFilters,
  showOrdersLink = true,
}) => {
  return (
    <div className="p-10 text-center bg-card border border-border rounded-2xl space-y-4 max-w-md mx-auto my-6 shadow-sm">
      <EmptyIllustration asset="no-lab-reports" compact />

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
        {onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs h-9 px-3.5 border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Filters
          </Button>
        )}

        {showOrdersLink && (
          <Button
            size="sm"
            asChild
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4 rounded-xl font-medium shadow-sm"
          >
            <Link href="/patient/lab-orders">
              <ClipboardList className="h-3.5 w-3.5 mr-1" />
              Check Diagnostic Orders
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

