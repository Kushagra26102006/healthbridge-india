'use client';

import React from 'react';
import { Building2, Users, ClipboardList, Phone, MapPin, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import type { LaboratoryDepartmentDto } from '@healthbridge/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface DepartmentManagementTableProps {
  departments: LaboratoryDepartmentDto[];
  loading?: boolean;
  onEdit?: (department: LaboratoryDepartmentDto) => void;
}

export function DepartmentManagementTable({
  departments,
  loading = false,
  onEdit,
}: DepartmentManagementTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading laboratory departments...</p>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
        <Building2 className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
          No Departments Configured
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Create clinical departments such as Hematology, Biochemistry, Microbiology, or Pathology.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <tr>
            <th className="px-5 py-3.5">Department</th>
            <th className="px-4 py-3.5">Code</th>
            <th className="px-4 py-3.5">Department Head</th>
            <th className="px-4 py-3.5">Staff / Workload</th>
            <th className="px-4 py-3.5">Location & Ext</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {departments.map((dept) => (
            <tr
              key={dept.id}
              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{dept.name}</div>
                    {dept.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                        {dept.description}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {dept.code}
                </span>
              </td>
              <td className="px-4 py-4">
                {dept.headOfDepartmentName ? (
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {dept.headOfDepartmentName}
                  </span>
                ) : (
                  <span className="text-xs italic text-slate-400">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    {dept.staffCount ?? 0} staff
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                    <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
                    {dept.activeWorkloadCount ?? 0} active
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="space-y-1">
                  {dept.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{dept.location}</span>
                    </div>
                  )}
                  {dept.contactExtension && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>Ext. {dept.contactExtension}</span>
                    </div>
                  )}
                  {!dept.location && !dept.contactExtension && (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                {dept.isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none gap-1">
                    <XCircle className="h-3 w-3" /> Inactive
                  </Badge>
                )}
              </td>
              <td className="px-4 py-4 text-right">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(dept)}
                    className="gap-1.5 text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
