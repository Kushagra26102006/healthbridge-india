'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function EncounterSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Summary Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/60" />
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="h-12 rounded-xl bg-muted/50" />

      {/* List items Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border border-border/70 p-4">
            <CardContent className="p-0 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 rounded bg-muted/80" />
                <div className="h-3 w-64 rounded bg-muted/50" />
              </div>
              <div className="h-8 w-24 rounded-lg bg-muted/60" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function EncounterWorkspaceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-6xl">
      <div className="h-20 rounded-2xl bg-muted/60" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-96 rounded-2xl bg-muted/50" />
        <div className="lg:col-span-2 space-y-4">
          <div className="h-12 rounded-xl bg-muted/50" />
          <div className="h-72 rounded-2xl bg-muted/40" />
          <div className="h-48 rounded-2xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
