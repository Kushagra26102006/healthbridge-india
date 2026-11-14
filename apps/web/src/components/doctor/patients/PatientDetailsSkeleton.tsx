'use client';

import React from 'react';

export const PatientDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse max-w-6xl">
      {/* Top Header Skeleton */}
      <div className="h-28 rounded-2xl bg-muted/60 border border-border/60" />

      {/* Demographics Bar Skeleton */}
      <div className="h-16 rounded-2xl bg-muted/40 border border-border/40" />

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="h-44 rounded-2xl bg-muted/40 border border-border/40" />
          <div className="h-56 rounded-2xl bg-muted/40 border border-border/40" />
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="h-64 rounded-2xl bg-muted/40 border border-border/40" />
          <div className="h-64 rounded-2xl bg-muted/40 border border-border/40" />
        </div>
      </div>
    </div>
  );
};
