import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      border: 'border-blue-500/20',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    teal: {
      bg: 'bg-teal-500/10 dark:bg-teal-500/15',
      border: 'border-teal-500/20',
      icon: 'text-teal-600 dark:text-teal-400',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      border: 'border-amber-500/20',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    purple: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
      border: 'border-purple-500/20',
      icon: 'text-purple-600 dark:text-purple-400',
    },
    red: {
      bg: 'bg-red-500/10 dark:bg-red-500/15',
      border: 'border-red-500/20',
      icon: 'text-red-600 dark:text-red-400',
    },
  }[variant];

  return (
    <Card
      onClick={onClick}
      className={cn(
        'border border-border/80 bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
        onClick && 'cursor-pointer hover:border-teal-500/50 hover:bg-card/90',
        className
      )}
    >
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          {subtext && <p className="text-[11px] text-muted-foreground">{subtext}</p>}
        </div>
        <div
          className={cn(
            'p-2.5 rounded-xl border flex items-center justify-center shrink-0',
            variantStyles.bg,
            variantStyles.border
          )}
        >
          <Icon className={cn('w-5 h-5', variantStyles.icon)} />
        </div>
      </CardContent>
    </Card>
  );
}
export default DashboardStatCard;

