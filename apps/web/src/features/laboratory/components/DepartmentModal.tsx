'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import type {
  LaboratoryDepartmentDto,
  LaboratoryStaffDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@healthbridge/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  department?: LaboratoryDepartmentDto | null;
  staffList: LaboratoryStaffDto[];
  onSubmit: (dto: CreateDepartmentDto | UpdateDepartmentDto, id?: string) => Promise<void>;
}

export function DepartmentModal({
  open,
  onClose,
  department,
  staffList,
  onSubmit,
}: DepartmentModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headOfDepartmentId, setHeadOfDepartmentId] = useState('');
  const [location, setLocation] = useState('');
  const [contactExtension, setContactExtension] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (department) {
      setName(department.name);
      setCode(department.code);
      setDescription(department.description || '');
      setHeadOfDepartmentId(department.headOfDepartmentId || '');
      setLocation(department.location || '');
      setContactExtension(department.contactExtension || '');
      setIsActive(department.isActive);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setHeadOfDepartmentId('');
      setLocation('');
      setContactExtension('');
      setIsActive(true);
    }
    setError(null);
  }, [department, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Department name and code are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      if (department) {
        await onSubmit(
          {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description.trim() || undefined,
            headOfDepartmentId: headOfDepartmentId || null,
            location: location.trim() || undefined,
            contactExtension: contactExtension.trim() || undefined,
            isActive,
          },
          department.id
        );
      } else {
        await onSubmit({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || undefined,
          headOfDepartmentId: headOfDepartmentId || undefined,
          location: location.trim() || undefined,
          contactExtension: contactExtension.trim() || undefined,
          isActive,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save department');
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
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {department ? 'Edit Laboratory Department' : 'Create Laboratory Department'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure operational unit, department head, and bench location.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Clinical Hematology"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Code *
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="HEM"
                maxLength={12}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope of testing benches and diagnostic workflows..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Department Head
            </label>
            <select
              value={headOfDepartmentId}
              onChange={(e) => setHeadOfDepartmentId(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Unassigned --</option>
              {staffList
                .filter((s) => s.status === 'ACTIVE')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.role.replace('LAB_', '')})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bench / Floor Location
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Floor 2, Wing B"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Extension
              </label>
              <Input
                value={contactExtension}
                onChange={(e) => setContactExtension(e.target.value)}
                placeholder="e.g., 2104"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="dept-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="dept-active" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Department is active and accepting staff & workload assignments
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
              {submitting ? 'Saving...' : department ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
