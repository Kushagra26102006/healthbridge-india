'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export function ScheduleSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted/60 rounded-lg" />
          <div className="h-4 w-80 bg-muted/40 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-muted/50 rounded-lg" />
          <div className="h-9 w-32 bg-muted/50 rounded-lg" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-border/40 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 bg-muted/50 rounded-md" />
        ))}
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-2 border border-border/60">
            <div className="h-3 w-20 bg-muted/60 rounded" />
            <div className="h-6 w-24 bg-muted/40 rounded" />
            <div className="h-3 w-32 bg-muted/30 rounded" />
          </Card>
        ))}
      </div>

      {/* Body Content Skeleton */}
      <Card className="p-6 border border-border/60 space-y-4">
        <div className="h-5 w-40 bg-muted/50 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl" />
          ))}
        </div>
      </Card>
    </div>
  );
}
export default ScheduleSkeleton;
