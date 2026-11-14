'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function DoctorDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* 1. Welcome Banner Skeleton */}
      <div className="h-44 sm:h-48 rounded-2xl bg-muted/60" />

      {/* 2. Doctor Profile Card Skeleton */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muted" />
              <div className="space-y-2">
                <div className="h-5 w-48 bg-muted rounded-lg" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            </div>
            <div className="h-8 w-24 bg-muted rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border">
            <div className="h-10 bg-muted/50 rounded-xl" />
            <div className="h-10 bg-muted/50 rounded-xl" />
            <div className="h-10 bg-muted/50 rounded-xl" />
            <div className="h-10 bg-muted/50 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Clinical Stat Cards Skeleton Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-5 space-y-3">
              <div className="h-9 w-9 rounded-2xl bg-muted" />
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-7 w-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Two-Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-80 rounded-2xl bg-muted/40 border border-border" />
          <div className="h-64 rounded-2xl bg-muted/40 border border-border" />
        </div>
        <div className="space-y-6">
          <div className="h-72 rounded-2xl bg-muted/40 border border-border" />
          <div className="h-72 rounded-2xl bg-muted/40 border border-border" />
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboardSkeleton;

