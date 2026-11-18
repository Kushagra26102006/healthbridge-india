'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { cn } from '@/lib/utils';

export interface AdminStatCardProps {
  label: string;
  value: number | string;
  helperText?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  href?: string;
  loading?: boolean;
  className?: string;
}

const TONE_MAP = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  error: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
} as const;

export function AdminStatCard({
  label,
  value,
  helperText,
  icon: Icon,
  tone = 'primary',
  href,
  loading = false,
  className,
}: AdminStatCardProps) {
  const cardBody = (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover-lift h-full flex flex-col justify-between gap-3',
        href && 'hover:border-primary/40 cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-lg border shrink-0',
            TONE_MAP[tone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {href && (
          <ArrowUpRight
            className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0"
            aria-hidden="true"
          />
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <div className="mt-2 h-7 w-20 rounded-md bg-muted animate-pulse" />
        ) : (
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
        )}
        {helperText && (
          <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{helperText}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-ring rounded-xl">
        {cardBody}
      </Link>
    );
  }

  return cardBody;
}

export default AdminStatCard;
