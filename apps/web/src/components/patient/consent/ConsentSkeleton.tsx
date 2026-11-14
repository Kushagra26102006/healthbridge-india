'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export interface ConsentSkeletonProps {
  count?: number;
}

export const ConsentSkeleton: React.FC<ConsentSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            </div>
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>

          <div className="h-14 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />

          <div className="flex gap-2">
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>

          <div className="h-8 border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
};
