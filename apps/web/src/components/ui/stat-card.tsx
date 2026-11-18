import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { cn } from '@/lib/utils';

export interface StatisticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  /** Optional numeric value to enable smooth count-up transition */
  numericValue?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  sublabel?: string;
  icon?: React.ReactNode;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  trend?: {
    value: string;
    direction?: 'up' | 'down' | 'neutral';
    label?: string;
  };
  loading?: boolean;
  interactive?: boolean;
}

const iconToneClasses: Record<NonNullable<StatisticCardProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary dark:bg-primary/15',
  secondary: 'bg-secondary/10 text-secondary dark:bg-secondary/15',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  error: 'bg-red-500/10 text-red-700 dark:text-red-400',
  neutral: 'bg-muted text-muted-foreground',
};

export function StatisticCard({
  label,
  value,
  numericValue,
  valuePrefix,
  valueSuffix,
  sublabel,
  icon,
  tone = 'primary',
  trend,
  loading = false,
  interactive = false,
  className,
  ...props
}: StatisticCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col gap-3',
          className
        )}
        aria-busy="true"
      >
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded-sm bg-muted animate-pulse" />
          <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="h-8 w-20 rounded-sm bg-muted animate-pulse" />
        <div className="h-3 w-32 rounded-sm bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-150 flex flex-col gap-3 hover:border-foreground/15 hover:shadow-md',
        interactive && 'hover:-translate-y-0.5 hover:shadow-hover hover:border-primary/30 cursor-pointer',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-transform duration-150',
              iconToneClasses[tone]
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-metric">
          {numericValue !== undefined ? (
            <AnimatedCounter value={numericValue} prefix={valuePrefix} suffix={valueSuffix} />
          ) : (
            value
          )}
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-semibold tabular-nums',
              trend.direction === 'up' &&
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
              trend.direction === 'down' &&
                'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
              (!trend.direction || trend.direction === 'neutral') &&
                'bg-muted text-muted-foreground'
            )}
          >
            {trend.direction === 'up' && <TrendingUp className="h-3 w-3" aria-hidden="true" />}
            {trend.direction === 'down' && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
            {(!trend.direction || trend.direction === 'neutral') && (
              <Minus className="h-3 w-3" aria-hidden="true" />
            )}
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      {(sublabel || trend?.label) && (
        <p className="text-xs text-muted-foreground leading-snug">
          {sublabel}
          {sublabel && trend?.label ? ' · ' : ''}
          {trend?.label}
        </p>
      )}
    </div>
  );
}
