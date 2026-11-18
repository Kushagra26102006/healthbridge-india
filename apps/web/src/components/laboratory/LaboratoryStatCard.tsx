'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { cn } from '@/lib/utils';

export interface LaboratoryStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'teal' | 'sky' | 'indigo' | 'emerald' | 'amber' | 'rose';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function LaboratoryStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'teal',
  trend,
  onClick,
  className,
}: LaboratoryStatCardProps) {
  const styles = {
    teal: {
      iconBg: 'bg-secondary/12 border-secondary/20 text-secondary',
      hoverBorder: 'hover:border-secondary/40',
    },
    sky: {
      iconBg: 'bg-primary/12 border-primary/20 text-primary',
      hoverBorder: 'hover:border-primary/40',
    },
    indigo: {
      iconBg: 'bg-indigo-500/12 border-indigo-500/20 text-indigo-700 dark:text-indigo-400',
      hoverBorder: 'hover:border-indigo-500/40',
    },
    emerald: {
      iconBg: 'bg-emerald-500/12 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/40',
    },
    amber: {
      iconBg: 'bg-amber-500/12 border-amber-500/20 text-amber-700 dark:text-amber-400',
      hoverBorder: 'hover:border-amber-500/40',
    },
    rose: {
      iconBg: 'bg-red-500/12 border-red-500/20 text-error',
      hoverBorder: 'hover:border-error/40',
    },
  }[variant];

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-5 hover-lift h-full flex flex-col justify-between',
        onClick && 'cursor-pointer',
        styles.hoverBorder,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div
          className={cn(
            'w-9 h-9 rounded-md border flex items-center justify-center shrink-0',
            styles.iconBg
          )}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-metric">
          {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-pill tabular-nums',
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-500/10 text-error'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-muted-foreground mt-2 truncate">{subtitle}</p>}
    </Card>
  );
}

export default LaboratoryStatCard;
