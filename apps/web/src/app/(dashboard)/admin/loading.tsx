import React from 'react';
import { SkeletonCard, SkeletonStatGrid } from '@/components/ui/skeleton';

export default function AdminPortalLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading administrator workspace">
      <div className="h-24 rounded-xl bg-muted/60 animate-pulse border border-border/60" />
      <SkeletonStatGrid count={6} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
