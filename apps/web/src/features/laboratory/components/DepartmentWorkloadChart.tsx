'use client';

import React from 'react';
import { BarChart3, Users, CheckCircle2 } from 'lucide-react';
import type {
  DepartmentWorkloadDistributionDto,
  StaffWorkloadDistributionDto,
} from '@healthbridge/shared-types';

export interface DepartmentWorkloadChartProps {
  departments: DepartmentWorkloadDistributionDto[];
  staffDistribution: StaffWorkloadDistributionDto[];
}

export function DepartmentWorkloadChart({
  departments,
  staffDistribution,
}: DepartmentWorkloadChartProps) {
  const maxDeptTasks = Math.max(
    1,
    ...departments.map((d) => d.openTaskCount + d.completedTaskCount)
  );
  const maxStaffTasks = Math.max(
    1,
    ...staffDistribution.map((s) => s.activeTaskCount + s.completedTodayCount)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Department Distribution */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Workload by Department
            </h3>
          </div>
          <span className="text-xs text-slate-500">{departments.length} departments</span>
        </div>

        {departments.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No department workload metrics available yet.
          </p>
        ) : (
          <div className="space-y-4">
            {departments.map((dept) => {
              const total = dept.openTaskCount + dept.completedTaskCount;
              const openPct = Math.round((dept.openTaskCount / maxDeptTasks) * 100);
              const donePct = Math.round((dept.completedTaskCount / maxDeptTasks) * 100);

              return (
                <div key={dept.departmentId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dept.departmentName}
                    </span>
                    <span className="text-slate-500">
                      {dept.openTaskCount} open • {dept.completedTaskCount} completed • {dept.staffCount} staff
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${openPct}%` }}
                      className="bg-amber-500 transition-all"
                      title={`Open: ${dept.openTaskCount}`}
                    />
                    <div
                      style={{ width: `${donePct}%` }}
                      className="bg-emerald-500 transition-all"
                      title={`Completed: ${dept.completedTaskCount}`}
                    />
                  </div>
                  {total === 0 && (
                    <span className="text-[10px] text-slate-400">No tasks assigned</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff Distribution */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Staff Workload Allocation
            </h3>
          </div>
          <span className="text-xs text-slate-500">{staffDistribution.length} active staff</span>
        </div>

        {staffDistribution.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No active staff workload data recorded yet.
          </p>
        ) : (
          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {staffDistribution.map((member) => {
              const activePct = Math.round((member.activeTaskCount / maxStaffTasks) * 100);
              const donePct = Math.round((member.completedTodayCount / maxStaffTasks) * 100);

              return (
                <div key={member.staffId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          member.isAvailableToday ? 'bg-emerald-500' : 'bg-rose-400'
                        }`}
                        title={member.isAvailableToday ? 'Available today' : 'On leave / unavailable'}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {member.staffName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {member.role.replace('LAB_', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>{member.activeTaskCount} active</span>
                      <span className="inline-flex items-center gap-0.5 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> {member.completedTodayCount}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${activePct}%` }}
                      className="bg-blue-500 transition-all"
                    />
                    <div
                      style={{ width: `${donePct}%` }}
                      className="bg-emerald-500 transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
