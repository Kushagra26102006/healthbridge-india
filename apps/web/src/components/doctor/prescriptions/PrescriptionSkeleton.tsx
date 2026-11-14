'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function PrescriptionListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border border-border/60 bg-card">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-3 w-24 bg-muted/60 rounded" />
                  <div className="h-3 w-20 bg-muted/60 rounded" />
                  <div className="h-3 w-32 bg-muted/60 rounded" />
                </div>
              </div>
              <div className="h-8 w-24 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PrescriptionDetailsSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="h-10 w-64 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-36 bg-muted/60 rounded-xl" />
        <div className="h-36 bg-muted/60 rounded-xl" />
        <div className="h-36 bg-muted/60 rounded-xl" />
      </div>
      <div className="h-96 bg-muted/40 rounded-2xl border border-border" />
    </div>
  );
}

export function PrescriptionBuilderSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl animate-pulse">
      <div className="h-12 bg-muted/60 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 h-96 bg-muted/50 rounded-2xl" />
        <div className="lg:col-span-8 h-96 bg-muted/50 rounded-2xl" />
      </div>
    </div>
  );
}