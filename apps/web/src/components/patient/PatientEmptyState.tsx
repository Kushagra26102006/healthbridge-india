'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PatientEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function PatientEmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: PatientEmptyStateProps) {
  return (
    <div
      className={cn(
        'p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center">
        <Icon className="h-6 w-6" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {actionLabel && (actionHref || onAction) && (
        <div className="pt-2">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="outline" size="sm" className="text-xs h-8 px-3">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={onAction} className="text-xs h-8 px-3">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default PatientEmptyState;
