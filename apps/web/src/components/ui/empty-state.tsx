import * as React from 'react';
import { cn } from '@/lib/utils';
import { EmptyIllustration } from '@/components/ui/visual-asset';
import type { EmptyStateAssetKey } from '@/lib/assets/image-manifest';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  illustration?: EmptyStateAssetKey;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border bg-card/60',
        compact ? 'px-5 py-8 gap-3' : 'px-6 py-12 gap-4',
        className
      )}
      {...props}
    >
      {illustration ? (
        <EmptyIllustration asset={illustration} compact={compact} />
      ) : (
        icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15',
              compact ? 'h-10 w-10' : 'h-12 w-12'
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )
      )}

      <div className="flex flex-col gap-1.5 max-w-md">
        <h3 className="text-card-heading">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
