'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  LABORATORY_STAFF_ROLES,
  type LaboratoryStaffRole,
  type LaboratoryStaffStatus,
} from '@healthbridge/shared-types';
import {
  useLaboratoryStaff,
  useLaboratoryDepartments,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { LaboratoryStaffTable } from '@/features/laboratory/components/LaboratoryStaffTable';
import { StaffInvitationModal } from '@/features/laboratory/components/StaffInvitationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STAFF_STATUSES: LaboratoryStaffStatus[] = [
  'ACTIVE',
  'INVITED',
  'PENDING_ACCEPTANCE',
  'SUSPENDED',
  'DEACTIVATED',
  'EXPIRED',
];

export default function LaboratoryStaffDirectoryPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const {
    staffList,
    total,
    page,
    totalPages,
    loading,
    error,
    filter,
    setFilter,
    setPage,
    refetch,
    inviteStaff,
    updateStaffStatus,
  } = useLaboratoryStaff({ limit: 15 });

  const { departments } = useLaboratoryDepartments();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilter((prev) => ({ ...prev, search: searchInput.trim() || undefined }));
  };

  const handleStatusChange = async (
    id: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  ) => {
    await updateStaffStatus(id, { status });
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-teal-600" />
            Laboratory Staff Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage laboratory personnel, laboratory-scoped roles, onboarding invitations, and access status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/laboratory/staff/permissions">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Shield className="h-4 w-4 text-teal-600" /> Role Matrix
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <UserPlus className="h-4 w-4" /> Invite Staff
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or employee ID..."
              className="pl-9"
            />
          </div>

          <select
            value={filter.role || ''}
            onChange={(e) => {
              setPage(1);
              setFilter((prev) => ({
                ...prev,
                role: (e.target.value as LaboratoryStaffRole) || undefined,
              }));
            }}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="">All Roles</option>
            {LABORATORY_STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace('LAB_', '')}
              </option>
            ))}
          </select>

          <select
            value={filter.departmentId || ''}
            onChange={(e) => {
              setPage(1);
              setFilter((prev) => ({
                ...prev,
                departmentId: e.target.value || undefined,
              }));
            }}
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
            value={filter.status || ''}
            onChange={(e) => {
              setPage(1);
              setFilter((prev) => ({
                ...prev,
                status: (e.target.value as LaboratoryStaffStatus) || undefined,
              }));
            }}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            {STAFF_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </form>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <LaboratoryStaffTable
        staff={staffList}
        loading={loading}
        onStatusChange={handleStatusChange}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page {page} of {totalPages} ({total} total staff)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <StaffInvitationModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        departments={departments}
        onSubmit={async (dto) => {
          const res = await inviteStaff(dto);
          return { invitationToken: res.invitationToken };
        }}
      />
    </div>
  );
}
