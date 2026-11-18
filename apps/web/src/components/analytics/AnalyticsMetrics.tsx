'use client';

import React from 'react';
import { m } from 'framer-motion';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

export interface AnalyticsKpiCardProps {
  label: string;
  value: number | string;
  helperText?: string;
  badgeText?: string;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
  className?: string;
}

const TONE_STYLE = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  error: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
} as const;

export function AnalyticsKpiCard({
  label,
  value,
  helperText,
  badgeText,
  badgeVariant = 'neutral',
  icon: Icon,
  tone = 'primary',
  loading = false,
  className,
}: AnalyticsKpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-xs hover-lift flex flex-col justify-between gap-3 h-full',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-lg border shrink-0',
            TONE_STYLE[tone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {badgeText && (
          <Badge variant={badgeVariant} size="sm">
            {badgeText}
          </Badge>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <div className="mt-2 h-7 w-20 rounded bg-muted animate-pulse" />
        ) : (
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
        )}
        {helperText && <p className="mt-1 text-[11px] text-muted-foreground">{helperText}</p>}
      </div>
    </div>
  );
}

export interface AnalyticsProgressIndicatorProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  targetLabel?: string;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

const BAR_TONES = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
} as const;

export function AnalyticsProgressIndicator({
  label,
  value,
  max = 100,
  unit = '%',
  targetLabel,
  tone = 'secondary',
  className,
}: AnalyticsProgressIndicatorProps) {
  const safeMax = Math.max(1, max);
  const ratio = Math.min(1, Math.max(0, value / safeMax));
  const pct = Math.round(ratio * 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-muted-foreground tabular-nums">
          <strong className="text-foreground">
            {value}
            {unit}
          </strong>
          {targetLabel ? ` · ${targetLabel}` : ''}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuetext={`${value}${unit} (${pct}%)`}
        className="h-2.5 w-full rounded-pill bg-muted overflow-hidden"
      >
        <m.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0.02, ratio) }}
          transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard }}
          style={{ transformOrigin: 'left center' }}
          className={cn('h-full w-full rounded-pill', BAR_TONES[tone])}
        />
      </div>
    </div>
  );
}

export interface ComparisonItem {
  label: string;
  value: number;
  sublabel?: string;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function AnalyticsComparisonCard({
  title,
  description,
  items,
  unit = '',
  className,
}: {
  title: string;
  description?: string;
  items: ComparisonItem[];
  unit?: string;
  className?: string;
}) {
  const total = items.reduce((acc, i) => acc + i.value, 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3.5">
        {items.map((item) => {
          const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <AnalyticsProgressIndicator
              key={item.label}
              label={item.label}
              value={item.value}
              max={Math.max(1, total)}
              unit={unit ? ` ${unit}` : ''}
              targetLabel={`${share}%${item.sublabel ? ` · ${item.sublabel}` : ''}`}
              tone={item.tone ?? 'primary'}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
