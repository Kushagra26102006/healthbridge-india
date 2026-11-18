import React from 'react';
import { Skeleton, SkeletonCard, SkeletonStatGrid } from '@/components/ui/skeleton';

export default function LaboratoryPortalLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading laboratory workspace">
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <Skeleton rounded="sm" className="h-4 w-44" />
        <Skeleton rounded="sm" className="h-7 w-72" />
        <Skeleton rounded="sm" className="h-4 w-96 max-w-full" />
      </div>
      <SkeletonStatGrid count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
