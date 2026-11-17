'use client';

import React, { useState } from 'react';
import { Building2, Plus, RefreshCw, Users, ClipboardList, CheckCircle2 } from 'lucide-react';
import type {
  LaboratoryDepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@healthbridge/shared-types';
import {
  useLaboratoryDepartments,
  useLaboratoryStaff,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { DepartmentManagementTable } from '@/features/laboratory/components/DepartmentManagementTable';
import { DepartmentModal } from '@/features/laboratory/components/DepartmentModal';
import { Button } from '@/components/ui/button';

export default function LaboratoryDepartmentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<LaboratoryDepartmentDto | null>(null);

  const {
    departments,
    loading,
    error,
    refetch,
    createDepartment,
    updateDepartment,
  } = useLaboratoryDepartments();
  const { staffList } = useLaboratoryStaff({ limit: 100 });

  const activeCount = departments.filter((d) => d.isActive).length;
  const totalStaffAssigned = departments.reduce((sum, d) => sum + (d.staffCount ?? 0), 0);
  const totalActiveWorkload = departments.reduce(
    (sum, d) => sum + (d.activeWorkloadCount ?? 0),
    0
  );

  const handleSave = async (dto: CreateDepartmentDto | UpdateDepartmentDto, id?: string) => {
    if (id) {
      await updateDepartment(id, dto as UpdateDepartmentDto);
    } else {
      await createDepartment(dto as CreateDepartmentDto);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-teal-600" />
            Laboratory Departments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize diagnostic sections, department heads, bench locations, and operational workloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingDept(null);
              setModalOpen(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Departments</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeCount}{' '}
              <span className="text-xs font-normal text-slate-400">/ {departments.length}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Departmental Staff</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStaffAssigned}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Departmental Tasks</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalActiveWorkload}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DepartmentManagementTable
        departments={departments}
        loading={loading}
        onEdit={(dept) => {
          setEditingDept(dept);
          setModalOpen(true);
        }}
      />

      <DepartmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDept(null);
        }}
        department={editingDept}
        staffList={staffList}
        onSubmit={handleSave}
      />
    </div>
  );
}
