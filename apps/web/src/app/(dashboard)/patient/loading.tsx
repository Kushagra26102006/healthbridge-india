import React from 'react';
import { Skeleton, SkeletonCard, SkeletonStatGrid } from '@/components/ui/skeleton';

export default function PatientPortalLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading patient portal view">
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <Skeleton rounded="sm" className="h-4 w-36" />
        <Skeleton rounded="sm" className="h-7 w-64" />
        <Skeleton rounded="sm" className="h-4 w-96 max-w-full" />
      </div>
      <SkeletonStatGrid count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="lg:col-span-5 space-y-4">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
