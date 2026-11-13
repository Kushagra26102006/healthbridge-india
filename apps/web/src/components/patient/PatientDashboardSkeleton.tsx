'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function PatientDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* 1. Welcome Banner Skeleton */}
      <div className="h-44 sm:h-48 rounded-3xl bg-muted/60" />

      {/* 2. ABHA Card Skeleton */}
      <Card className="border-border shadow-card bg-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 bg-muted rounded-lg" />
            <div className="h-5 w-24 bg-muted rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-16 bg-muted/50 rounded-2xl" />
            <div className="h-16 bg-muted/50 rounded-2xl" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Stat Cards Skeleton Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border shadow-card bg-card">
            <CardContent className="p-5 space-y-3">
              <div className="h-9 w-9 rounded-2xl bg-muted" />
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-7 w-14 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Content Blocks Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl bg-muted/40 border border-border" />
        <div className="h-72 rounded-2xl bg-muted/40 border border-border" />
      </div>
    </div>
  );
}

export default PatientDashboardSkeleton;
