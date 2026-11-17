'use client';

import React from 'react';
import {
  ClipboardList,
  AlertCircle,
  Clock,
  User,
  CheckCircle2,
  Building,
} from 'lucide-react';
import type {
  LaboratoryTaskAssignmentDto,
  LaboratoryTaskStatus,
  TaskPriority,
  LaboratoryTaskType,
} from '@healthbridge/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface WorkloadBoardProps {
  tasks: LaboratoryTaskAssignmentDto[];
  loading?: boolean;
  onStatusChange?: (id: string, status: LaboratoryTaskStatus, blockedReason?: string) => Promise<void>;
  onReassign?: (task: LaboratoryTaskAssignmentDto) => void;
}

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse',
};

const STATUS_BADGE: Record<LaboratoryTaskStatus, string> = {
  UNASSIGNED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  ACCEPTED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  BLOCKED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
};

const TASK_TYPE_LABELS: Record<LaboratoryTaskType, string> = {
  SAMPLE_COLLECTION: 'Sample Collection',
  SAMPLE_ACCESSIONING: 'Sample Accessioning',
  TEST_PROCESSING: 'Test Processing',
  QC_RUN: 'QC Run',
  REPORT_REVIEW: 'Report Review',
  REPORT_APPROVAL: 'Report Approval',
  INSTRUMENT_MAINTENANCE: 'Instrument Maintenance',
  INVENTORY_ACTIVITY: 'Inventory Activity',
  QUALITY_INCIDENT: 'Quality Incident',
  CAPA_ACTION: 'CAPA Action',
};

export function WorkloadBoard({
  tasks,
  loading = false,
  onStatusChange,
  onReassign,
}: WorkloadBoardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading laboratory workload assignments...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
          No Workload Tasks Assigned
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Create operational task assignments for sample accessioning, testing, reviews, or QC runs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <tr>
            <th className="px-5 py-3.5">Task Assignment</th>
            <th className="px-4 py-3.5">Type & Department</th>
            <th className="px-4 py-3.5">Assignee</th>
            <th className="px-4 py-3.5">Priority & Due Date</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
              <td className="px-5 py-4">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="font-mono text-xs text-teal-600 dark:text-teal-400">
                    {task.assignmentNumber}
                  </span>
                  <span>•</span>
                  <span>{task.title}</span>
                </div>
                {task.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-sm">
                    {task.description}
                  </p>
                )}
                {task.blockedReason && task.status === 'BLOCKED' && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-700 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>Blocked: {task.blockedReason}</span>
                  </div>
                )}
              </td>

              <td className="px-4 py-4">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {TASK_TYPE_LABELS[task.taskType] || task.taskType}
                </div>
                {task.departmentName && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="h-3 w-3" />
                    <span>{task.departmentName}</span>
                  </div>
                )}
              </td>

              <td className="px-4 py-4">
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>{task.assignedStaffName || 'Assigned Staff'}</span>
                </div>
                {task.assignedStaffRole && (
                  <span className="text-[10px] text-slate-500">
                    {task.assignedStaffRole.replace('LAB_', '')}
                  </span>
                )}
              </td>

              <td className="px-4 py-4">
                <div className="flex flex-col gap-1 items-start">
                  <Badge className={`${PRIORITY_BADGE[task.priority]} border-none text-[10px]`}>
                    {task.priority}
                  </Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.dueDate?.slice(0, 10)}
                  </span>
                </div>
              </td>

              <td className="px-4 py-4">
                <Badge className={`${STATUS_BADGE[task.status]} border-none text-[11px]`}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </td>

              <td className="px-4 py-4 text-right">
                <div className="inline-flex items-center gap-1.5">
                  {task.status === 'ASSIGNED' && onStatusChange && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => onStatusChange(task.id, 'ACCEPTED')}
                    >
                      Accept
                    </Button>
                  )}
                  {(task.status === 'ACCEPTED' || task.status === 'ASSIGNED') && onStatusChange && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                      onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
                    >
                      Start
                    </Button>
                  )}
                  {task.status === 'IN_PROGRESS' && onStatusChange && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => onStatusChange(task.id, 'COMPLETED')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                    </Button>
                  )}
                  {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && onReassign && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
                      onClick={() => onReassign(task)}
                    >
                      Reassign
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
