'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import type {
  LaboratoryTaskAssignmentDto,
  LaboratoryTaskStatus,
  TaskPriority,
} from '@healthbridge/shared-types';
import {
  useLaboratoryWorkload,
  useLaboratoryStaff,
  useLaboratoryDepartments,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { WorkloadBoard } from '@/features/laboratory/components/WorkloadBoard';
import { TaskAssignmentModal } from '@/features/laboratory/components/TaskAssignmentModal';
import { DepartmentWorkloadChart } from '@/features/laboratory/components/DepartmentWorkloadChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STATUS_FILTERS: LaboratoryTaskStatus[] = [
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
];

const PRIORITY_FILTERS: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function LaboratoryWorkloadPage() {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<LaboratoryTaskAssignmentDto | null>(null);
  const [newStaffId, setNewStaffId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const {
    dashboard,
    tasks,
    loading,
    error,
    filter,
    setFilter,
    refetch,
    createTask,
    reassignTask,
    updateTaskStatus,
  } = useLaboratoryWorkload({ limit: 25 });

  const { staffList } = useLaboratoryStaff({ limit: 100 });
  const { departments } = useLaboratoryDepartments();

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget || !newStaffId || !reassignReason.trim()) return;
    await reassignTask(reassignTarget.id, {
      newStaffId,
      reason: reassignReason.trim(),
    });
    setReassignTarget(null);
    setNewStaffId('');
    setReassignReason('');
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-teal-600" />
            Laboratory Workload Allocation & Operations Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time operational workload metrics across sample accessioning, testing benches, QC runs, and report reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setAssignModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <Plus className="h-4 w-4" /> Assign Task
          </Button>
        </div>
      </div>

      {/* Real-Time Persisted KPI Metrics */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Tasks</span>
              <ClipboardList className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {dashboard.totalTasks}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>In Progress</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600">{dashboard.inProgressTasks}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Completed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{dashboard.completedTasks}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Overdue</span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-rose-600">{dashboard.overdueTasks}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Blocked</span>
              <ShieldAlert className="h-4 w-4 text-orange-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-orange-600">{dashboard.blockedTasks}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Pending Reports</span>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {dashboard.pendingReportReviews + dashboard.pendingReportApprovals}
            </p>
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      {dashboard && (
        <DepartmentWorkloadChart
          departments={dashboard.departmentWorkloadDistribution}
          staffDistribution={dashboard.staffWorkloadDistribution}
        />
      )}

      {/* Task Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          value={filter.status || ''}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              status: (e.target.value as LaboratoryTaskStatus) || undefined,
            }))
          }
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          value={filter.priority || ''}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              priority: (e.target.value as TaskPriority) || undefined,
            }))
          }
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
        >
          <option value="">All Priorities</option>
          {PRIORITY_FILTERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={filter.departmentId || ''}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, departmentId: e.target.value || undefined }))
          }
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={filter.assignedStaffId || ''}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, assignedStaffId: e.target.value || undefined }))
          }
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
        >
          <option value="">All Staff</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Workload Board */}
      <WorkloadBoard
        tasks={tasks}
        loading={loading}
        onStatusChange={async (id, status, blockedReason) => {
          await updateTaskStatus(id, { status, blockedReason });
        }}
        onReassign={(task) => setReassignTarget(task)}
      />

      {/* Create Task Modal */}
      <TaskAssignmentModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        staffList={staffList}
        departments={departments}
        onSubmit={async (dto) => {
          await createTask(dto);
        }}
      />

      {/* Reassign Task Modal */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleReassignSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Reassign Task {reassignTarget.assignmentNumber}
            </h3>
            <p className="text-xs text-slate-500">
              {reassignTarget.title} — All reassignments are recorded in immutable task history.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Assignee *
              </label>
              <select
                value={newStaffId}
                onChange={(e) => setNewStaffId(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="">-- Select Staff Member --</option>
                {staffList
                  .filter((s) => s.status === 'ACTIVE' && s.id !== reassignTarget.assignedStaffId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role.replace('LAB_', '')})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reassignment Reason *
              </label>
              <Input
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g., Shift handover / bench load balancing"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setReassignTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                Confirm Reassignment
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
