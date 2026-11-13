'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function RecordsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-muted rounded-lg" />
          <div className="h-9 w-32 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Summary Cards Skeleton (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-muted/70 rounded" />
              <div className="h-8 w-8 rounded-xl bg-muted" />
            </div>
            <div className="h-7 w-12 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted/50 rounded" />
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar Skeleton */}
      <Card className="border-border/60 bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 bg-muted rounded-xl" />
          <div className="h-10 w-32 bg-muted rounded-xl" />
          <div className="h-10 w-32 bg-muted rounded-xl" />
        </div>
      </Card>

      {/* Records List Table / Cards Skeleton */}
      <Card className="border-border/60 bg-card overflow-hidden">
        <CardHeader className="p-4 border-b border-border/60">
          <div className="h-5 w-36 bg-muted rounded" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-44 bg-muted rounded" />
                    <div className="h-3 w-64 bg-muted/60 rounded" />
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-6">
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                  <div className="h-6 w-20 bg-muted rounded-full" />
                </div>
                <div className="h-8 w-24 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RecordDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-muted rounded-lg" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>

      {/* Main card */}
      <Card className="border-border/60 bg-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-2">
            <div className="h-6 w-24 bg-muted rounded-full" />
            <div className="h-7 w-80 bg-muted rounded-lg" />
            <div className="h-4 w-40 bg-muted/60 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-muted rounded-lg" />
            <div className="h-9 w-28 bg-muted rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-muted/40 rounded-xl" />
          <div className="h-24 bg-muted/40 rounded-xl" />
        </div>

        <div className="h-32 bg-muted/30 rounded-xl" />
        <div className="h-80 bg-muted/20 rounded-xl border border-dashed border-border" />
      </Card>
    </div>
  );
}

export default RecordsSkeleton;

