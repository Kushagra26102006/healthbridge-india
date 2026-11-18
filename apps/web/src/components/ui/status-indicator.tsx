import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusIndicatorTone =
  | 'online'
  | 'verified'
  | 'success'
  | 'pending'
  | 'warning'
  | 'busy'
  | 'error'
  | 'info'
  | 'offline'
  | 'neutral';

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusIndicatorTone;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const toneStyles: Record<StatusIndicatorTone, { dot: string; ring: string; text: string }> = {
  online: {
    dot: 'bg-success',
    ring: 'bg-success/40',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  verified: {
    dot: 'bg-secondary',
    ring: 'bg-secondary/40',
    text: 'text-teal-800 dark:text-teal-300',
  },
  success: {
    dot: 'bg-success',
    ring: 'bg-success/40',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  pending: {
    dot: 'bg-warning',
    ring: 'bg-warning/40',
    text: 'text-amber-800 dark:text-amber-300',
  },
  warning: {
    dot: 'bg-warning',
    ring: 'bg-warning/40',
    text: 'text-amber-800 dark:text-amber-300',
  },
  busy: {
    dot: 'bg-error',
    ring: 'bg-error/40',
    text: 'text-red-700 dark:text-red-300',
  },
  error: {
    dot: 'bg-error',
    ring: 'bg-error/40',
    text: 'text-red-700 dark:text-red-300',
  },
  info: {
    dot: 'bg-primary',
    ring: 'bg-primary/40',
    text: 'text-blue-700 dark:text-blue-300',
  },
  offline: {
    dot: 'bg-muted-foreground/50',
    ring: 'bg-muted-foreground/20',
    text: 'text-muted-foreground',
  },
  neutral: {
    dot: 'bg-muted-foreground/60',
    ring: 'bg-muted-foreground/20',
    text: 'text-muted-foreground',
  },
};

const sizeMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function StatusIndicator({
  status,
  label,
  pulse = false,
  size = 'md',
  className,
  ...props
}: StatusIndicatorProps) {
  const tone = toneStyles[status];

  return (
    <span
      className={cn('inline-flex items-center gap-2 text-xs font-medium', className)}
      {...props}
    >
      <span className={cn('relative inline-flex shrink-0', sizeMap[size])} aria-hidden="true">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-pill opacity-75 animate-ping motion-reduce:hidden',
              tone.ring
            )}
          />
        )}
        <span className={cn('relative inline-flex h-full w-full rounded-pill', tone.dot)} />
      </span>
      {label && <span className={cn('leading-none', tone.text)}>{label}</span>}
    </span>
  );
}
