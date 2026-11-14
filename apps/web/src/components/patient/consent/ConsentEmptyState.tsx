'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConsentEmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
  actionText?: string;
  actionHref?: string;
}

export const ConsentEmptyState: React.FC<ConsentEmptyStateProps> = ({
  title = 'No consent permissions found',
  description = 'You currently have no access requests or sharing permissions matching your selected criteria.',
  onResetFilters,
  actionText,
  actionHref,
}) => {
  return (
    <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto my-6 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
        <ShieldCheck className="h-7 w-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
        {onResetFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="gap-2 rounded-xl text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </Button>
        )}

        {actionText && actionHref && (
          <Button size="sm" asChild className="rounded-xl text-xs bg-teal-600 hover:bg-teal-700">
            <Link href={actionHref}>{actionText}</Link>
          </Button>
        )}
      </div>
    </div>
  );
};
