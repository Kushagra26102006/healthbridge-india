'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AppointmentEmptyStateProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function AppointmentEmptyState({
  title = 'No Appointments Found',
  description = 'You currently have no scheduled patient consultations in this category.',
  actionHref,
  actionLabel,
}: AppointmentEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
        <Calendar className="h-6 w-6" />
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm sm:text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {actionHref && actionLabel && (
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
