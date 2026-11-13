import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-xs',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-xs',
        outline: 'text-foreground border-border bg-background/50',
        success:
          'border-emerald-200/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
        warning:
          'border-amber-200/50 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        info: 'border-sky-200/50 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
        teal: 'border-teal-200/50 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
        blue: 'border-blue-200/50 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
        abha: 'border-orange-300/60 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 dark:from-orange-950/40 dark:to-amber-950/40 dark:text-orange-300 dark:border-orange-800/60 font-mono tracking-wide',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
