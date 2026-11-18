'use client';

import * as React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  description?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { container: string; icon: React.ReactNode; titleColor: string }
> = {
  info: {
    container:
      'border-blue-200/80 bg-blue-50/80 text-blue-950 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-100',
    icon: <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />,
    titleColor: 'text-blue-950 dark:text-blue-100',
  },
  success: {
    container:
      'border-emerald-200/80 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-100',
    icon: <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" aria-hidden="true" />,
    titleColor: 'text-emerald-950 dark:text-emerald-100',
  },
  warning: {
    container:
      'border-amber-200/80 bg-amber-50/85 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100',
    icon: <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />,
    titleColor: 'text-amber-950 dark:text-amber-100',
  },
  error: {
    container:
      'border-red-200/80 bg-red-50/85 text-red-950 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-100',
    icon: <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" aria-hidden="true" />,
    titleColor: 'text-red-950 dark:text-red-100',
  },
  neutral: {
    container: 'border-border bg-muted/60 text-foreground',
    icon: <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />,
    titleColor: 'text-foreground',
  },
};

export function Alert({
  variant = 'info',
  title,
  description,
  dismissible = false,
  onDismiss,
  action,
  className,
  children,
  ...props
}: AlertProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  const cfg = variantConfig[variant];

  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cn(
        'relative flex items-start gap-3 rounded-md border p-4 text-sm shadow-xs',
        cfg.container,
        className
      )}
      {...props}
    >
      {cfg.icon}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {title && <p className={cn('font-semibold leading-snug', cfg.titleColor)}>{title}</p>}
        {description && <div className="text-xs sm:text-sm opacity-90 leading-relaxed">{description}</div>}
        {children}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          aria-label="Dismiss alert"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
