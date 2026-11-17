'use client';

import React from 'react';
import { Activity, Clock, Shield, FileText } from 'lucide-react';
import type { StaffActivityDto } from '@healthbridge/shared-types';

export interface StaffActivityTimelineProps {
  activities: StaffActivityDto[];
  loading?: boolean;
}

export function StaffActivityTimeline({
  activities,
  loading = false,
}: StaffActivityTimelineProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading immutable staff activity audit trail...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
        <Activity className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
          No Activity Recorded
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Actions performed by or on this laboratory staff member appear here in chronological order.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="relative space-y-5 before:absolute before:inset-y-2 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {activities.map((item) => (
          <div key={item.id} className="relative pl-11">
            <div className="absolute left-1.5 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400">
              <Shield className="h-3 w-3" />
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                  {item.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3 text-slate-400" />
                  {item.resourceType} ({item.resourceId.slice(-8)})
                </span>
                {item.actorRole && (
                  <span className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium">
                    Actor Role: {item.actorRole}
                  </span>
                )}
              </div>
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <pre className="mt-2 overflow-x-auto rounded bg-slate-100 dark:bg-slate-950 p-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
