'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DoctorEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function DoctorEmptyState({
  title,
  description,
  icon: Icon = Stethoscope,
  actionHref,
  actionLabel,
  className,
}: DoctorEmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 sm:p-12 text-center space-y-4',
        className
      )}
    >
      <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
        <Icon className="h-6 w-6" />
      </div>

      <div className="space-y-1 max-w-md mx-auto">
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

export default DoctorEmptyState;

