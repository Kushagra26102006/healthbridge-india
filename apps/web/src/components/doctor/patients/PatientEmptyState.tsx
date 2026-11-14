'use client';

import React from 'react';
import { LucideIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PatientEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const PatientEmptyState: React.FC<PatientEmptyStateProps> = ({
  icon: Icon = FileText,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`py-12 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mx-auto text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button onClick={onAction} size="sm" variant="outline" className="text-xs h-8">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
