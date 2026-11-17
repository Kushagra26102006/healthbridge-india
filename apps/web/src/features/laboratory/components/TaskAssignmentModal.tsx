'use client';

import React, { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import type {
  LaboratoryStaffDto,
  LaboratoryDepartmentDto,
  LaboratoryTaskType,
  TaskPriority,
  CreateTaskAssignmentDto,
} from '@healthbridge/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface TaskAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  staffList: LaboratoryStaffDto[];
  departments: LaboratoryDepartmentDto[];
  onSubmit: (dto: CreateTaskAssignmentDto) => Promise<void>;
}

const TASK_TYPES: { type: LaboratoryTaskType; label: string }[] = [
  { type: 'SAMPLE_COLLECTION', label: 'Sample Collection' },
  { type: 'SAMPLE_ACCESSIONING', label: 'Sample Accessioning' },
  { type: 'TEST_PROCESSING', label: 'Test Processing' },
  { type: 'QC_RUN', label: 'QC Run' },
  { type: 'REPORT_REVIEW', label: 'Report Review' },
  { type: 'REPORT_APPROVAL', label: 'Report Approval' },
  { type: 'INSTRUMENT_MAINTENANCE', label: 'Instrument Maintenance' },
  { type: 'INVENTORY_ACTIVITY', label: 'Inventory Activity' },
  { type: 'QUALITY_INCIDENT', label: 'Quality Incident' },
  { type: 'CAPA_ACTION', label: 'CAPA Action' },
];

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function TaskAssignmentModal({
  open,
  onClose,
  staffList,
  departments,
  onSubmit,
}: TaskAssignmentModalProps) {
  const [taskType, setTaskType] = useState<LaboratoryTaskType>('TEST_PROCESSING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [relatedEntityType, setRelatedEntityType] = useState('LabOrder');
  const [relatedEntityId, setRelatedEntityId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedStaffId || !dueDate) {
      setError('Title, assigned staff member, and due date are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        taskType,
        title: title.trim(),
        description: description.trim() || undefined,
        departmentId: departmentId || undefined,
        assignedStaffId,
        priority,
        dueDate: dueDate.includes('T') ? dueDate : `${dueDate}T18:00:00.000Z`,
        relatedEntityType,
        relatedEntityId: relatedEntityId.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create task assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Assign Laboratory Task
              </h2>
              <p className="text-xs text-slate-500">
                Allocate clinical and operational activities with immutable audit tracking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Type *
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as LaboratoryTaskType)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              {TASK_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Process CBC & Peripheral Smear Batch #41"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Worklist details, instrument IDs, or priority instructions..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assign To Staff Member *
              </label>
              <select
                value={assignedStaffId}
                onChange={(e) => setAssignedStaffId(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="">-- Select Staff --</option>
                {staffList
                  .filter((s) => s.status === 'ACTIVE')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role.replace('LAB_', '')})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department Bench
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="">-- General / Unspecified --</option>
                {departments
                  .filter((d) => d.isActive)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date *
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Related Entity Type
              </label>
              <Input
                value={relatedEntityType}
                onChange={(e) => setRelatedEntityType(e.target.value)}
                placeholder="LabOrder / LabSample / LabReport"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Related Entity ID (Optional)
              </label>
              <Input
                value={relatedEntityId}
                onChange={(e) => setRelatedEntityId(e.target.value)}
                placeholder="ID reference"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
              {submitting ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
