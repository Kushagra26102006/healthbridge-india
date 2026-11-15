'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

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
  const getVariantStyles = () => {
    switch (variant) {
      case 'teal':
        return {
          iconBg: 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400',
          hoverBorder: 'hover:border-teal-500/40',
        };
      case 'sky':
        return {
          iconBg: 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400',
          hoverBorder: 'hover:border-sky-500/40',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
          hoverBorder: 'hover:border-indigo-500/40',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          hoverBorder: 'hover:border-emerald-500/40',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
          hoverBorder: 'hover:border-amber-500/40',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
          hoverBorder: 'hover:border-rose-500/40',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-5 rounded-2xl bg-card border border-border/80 shadow-xs transition-all duration-200 flex flex-col justify-between',
        onClick && 'cursor-pointer hover:shadow-md',
        styles.hoverBorder,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0',
            styles.iconBg
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full',
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2 truncate">{subtitle}</p>
      )}
    </div>
  );
}

export default LaboratoryStatCard;
