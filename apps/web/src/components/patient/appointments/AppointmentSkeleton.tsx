'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export interface AppointmentSkeletonProps {
  count?: number;
}

export const AppointmentSkeleton: React.FC<AppointmentSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-3 w-56 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>

          <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
        </Card>
      ))}
    </div>
  );
};

export const DoctorSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl animate-pulse space-y-4"
        >
          <div className="flex items-start space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
          <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
        </Card>
      ))}
    </div>
  );
};

