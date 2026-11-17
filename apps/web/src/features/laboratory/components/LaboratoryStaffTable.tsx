'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Mail,
  Building,
  Shield,
  MoreHorizontal,
  UserCheck,
  UserX,
  KeyRound,
  Activity,
} from 'lucide-react';
import type { LaboratoryStaffDto, LaboratoryStaffStatus } from '@healthbridge/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface LaboratoryStaffTableProps {
  staff: LaboratoryStaffDto[];
  loading?: boolean;
  onStatusChange?: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED') => Promise<void>;
}

const STATUS_BADGE: Record<LaboratoryStaffStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  INVITED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  PENDING_ACCEPTANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
  DEACTIVATED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
};

export function LaboratoryStaffTable({
  staff,
  loading = false,
  onStatusChange,
}: LaboratoryStaffTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading laboratory staff directory...</p>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
        <Users className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
          No Staff Members Found
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Invite technicians, pathologists, and quality managers to build your laboratory team.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <tr>
            <th className="px-5 py-3.5">Staff Member</th>
            <th className="px-4 py-3.5">Employee ID</th>
            <th className="px-4 py-3.5">Department</th>
            <th className="px-4 py-3.5">Role</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {staff.map((member) => (
            <tr
              key={member.id}
              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-900/10 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 font-semibold text-xs">
                    {member.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/laboratory/staff/${member.id}`}
                      className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-teal-400"
                    >
                      {member.fullName}
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                {member.employeeId}
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  {member.departmentName || 'Unassigned'}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-800 dark:text-slate-200">
                  <Shield className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  {member.role.replace('LAB_', '').replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-4">
                <Badge className={`border-0 text-xs font-medium ${STATUS_BADGE[member.status]}`}>
                  {member.status.replace('_', ' ')}
                </Badge>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Link href={`/laboratory/staff/${member.id}/permissions`}>
                    <Button variant="ghost" size="sm" title="Manage Permissions">
                      <KeyRound className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                  </Link>
                  <Link href={`/laboratory/staff/${member.id}/activity`}>
                    <Button variant="ghost" size="sm" title="Audit Activity">
                      <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                  </Link>
                  <Link href={`/laboratory/staff/${member.id}`}>
                    <Button variant="ghost" size="sm" title="View Profile">
                      <MoreHorizontal className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                  </Link>
                  {onStatusChange && !member.isPrimaryOwner && (
                    member.status === 'ACTIVE' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Deactivate Staff"
                        onClick={() => onStatusChange(member.id, 'DEACTIVATED')}
                      >
                        <UserX className="h-4 w-4 text-red-500" />
                      </Button>
                    ) : member.status === 'DEACTIVATED' || member.status === 'SUSPENDED' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Reactivate Staff"
                        onClick={() => onStatusChange(member.id, 'ACTIVE')}
                      >
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      </Button>
                    ) : null
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
