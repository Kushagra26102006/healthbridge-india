'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export interface LabReportsSkeletonProps {
  count?: number;
}

export const LabReportsSkeleton: React.FC<LabReportsSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            </div>
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>

          <div className="space-y-2">
            <div className="h-5 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>

          <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
        </Card>
      ))}
    </div>
  );
};

