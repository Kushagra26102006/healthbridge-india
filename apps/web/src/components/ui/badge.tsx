import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-xs',
        primary: 'border-transparent bg-primary text-primary-foreground shadow-xs',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-xs',
        error:
          'border-red-200/80 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/70',
        outline: 'text-foreground border-border bg-surface',
        neutral:
          'border-border bg-muted/80 text-muted-foreground dark:bg-surface-elevated dark:text-muted-foreground',
        success:
          'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/70',
        warning:
          'border-amber-200/80 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/70',
        info: 'border-blue-200/80 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/70',
        teal: 'border-teal-200/80 bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900/70',
        blue: 'border-blue-200/80 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/70',
        abha: 'border-orange-300/70 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-900 dark:from-orange-950/50 dark:to-amber-950/40 dark:text-orange-300 dark:border-orange-800/60 font-mono tracking-wide',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px] leading-4',
        md: 'px-2.5 py-0.5 text-xs leading-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotClassName?: string;
}

function Badge({ className, variant, size, dot, dotClassName, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 rounded-pill bg-current opacity-85 shrink-0', dotClassName)}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
