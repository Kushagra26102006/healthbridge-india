'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyIllustration } from '@/components/ui/visual-asset';

export interface AppointmentEmptyStateProps {
  title?: string;
  description?: string;
  showBookAction?: boolean;
  onResetFilters?: () => void;
}

export const AppointmentEmptyState: React.FC<AppointmentEmptyStateProps> = ({
  title = 'No appointments found',
  description = 'You currently have no scheduled appointments matching your active filters.',
  showBookAction = true,
  onResetFilters,
}) => {
  return (
    <div className="p-10 text-center bg-card border border-border rounded-2xl space-y-4 max-w-md mx-auto my-6 shadow-sm">
      <EmptyIllustration asset="no-appointments" compact />

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {description}
        </p>
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

        {showBookAction && (
          <Button
            size="sm"
            asChild
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4 rounded-xl font-medium shadow-sm"
          >
            <Link href="/patient/appointments/book">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Book New Appointment
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
