'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { cn } from '@/lib/utils';

export interface DashboardStatCardProps {
  title: string;
  value: number | string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'blue' | 'teal' | 'amber' | 'emerald' | 'purple' | 'red';
  className?: string;
  onClick?: () => void;
}

export function DashboardStatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'blue',
  className,
  onClick,
}: DashboardStatCardProps) {
  const variantStyles = {
    blue: {
      bg: 'bg-primary/12',
      border: 'border-primary/20',
      icon: 'text-primary',
    },
    teal: {
      bg: 'bg-secondary/12',
      border: 'border-secondary/20',
      icon: 'text-secondary',
    },
    amber: {
      bg: 'bg-amber-500/12',
      border: 'border-amber-500/20',
      icon: 'text-amber-700 dark:text-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-500/12',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-700 dark:text-emerald-400',
    },
    purple: {
      bg: 'bg-cyan-500/12',
      border: 'border-cyan-500/20',
      icon: 'text-cyan-700 dark:text-cyan-400',
    },
    red: {
      bg: 'bg-red-500/12',
      border: 'border-red-500/20',
      icon: 'text-error',
    },
  }[variant];

  return (
    <Card
      onClick={onClick}
      className={cn(
        'hover-lift h-full',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <CardContent className="p-5 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <div className="text-metric">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </div>
          {subtext && <p className="text-xs text-muted-foreground truncate">{subtext}</p>}
        </div>
        <div
          className={cn(
            'p-2.5 rounded-md border flex items-center justify-center shrink-0',
            variantStyles.bg,
            variantStyles.border
          )}
          aria-hidden="true"
        >
          <Icon className={cn('w-5 h-5', variantStyles.icon)} />
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardStatCard;
