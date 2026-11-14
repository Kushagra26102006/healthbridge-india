'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function AppointmentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-6xl">
      {/* 1. Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted rounded-xl" />
          <div className="h-9 w-32 bg-muted rounded-xl" />
        </div>
      </div>

      {/* 2. Summary Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-4 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-muted" />
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-6 w-10 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Filters Skeleton */}
      <div className="h-16 rounded-2xl bg-muted/50 border border-border" />

      {/* 4. List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/40 border border-border" />
        ))}
      </div>
    </div>
  );
}

