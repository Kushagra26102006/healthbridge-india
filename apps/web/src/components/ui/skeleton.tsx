import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'pill';
}

const roundedMap: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  pill: 'rounded-pill',
};

export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-muted/90 dark:bg-surface-elevated', roundedMap[rounded], className)}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          rounded="sm"
          className={cn('h-3.5', idx === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      className={cn('rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col gap-4', className)}
    >
      <div className="flex items-center gap-3">
        <Skeleton rounded="pill" className="h-10 w-10 shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton rounded="sm" className="h-4 w-1/2" />
          <Skeleton rounded="sm" className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonStatGrid({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div
      aria-busy="true"
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton rounded="sm" className="h-3 w-24" />
            <Skeleton rounded="md" className="h-9 w-9" />
          </div>
          <Skeleton rounded="sm" className="h-8 w-20" />
          <Skeleton rounded="sm" className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div
      aria-busy="true"
      className="rounded-lg border border-border bg-card shadow-sm overflow-hidden"
    >
      <div className="border-b border-border bg-muted/40 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, idx) => (
          <Skeleton key={idx} rounded="sm" className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-4 py-3.5 flex gap-4">
            {Array.from({ length: columns }).map((__, cIdx) => (
              <Skeleton key={cIdx} rounded="sm" className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
