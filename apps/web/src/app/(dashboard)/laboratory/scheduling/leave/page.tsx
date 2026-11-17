'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Plus, RefreshCw, Clock } from 'lucide-react';
import type { LeaveRequestStatus } from '@healthbridge/shared-types';
import {
  useLaboratoryLeave,
  useLaboratoryStaff,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { LeaveRequestTable } from '@/features/laboratory/components/LeaveRequestTable';
import { LeaveRequestModal } from '@/features/laboratory/components/LeaveRequestModal';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS: LeaveRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function LaboratoryLeaveManagementPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    leaveRequests,
    loading,
    error,
    filter,
    setFilter,
    refetch,
    submitLeave,
    reviewLeave,
  } = useLaboratoryLeave();
  const { staffList } = useLaboratoryStaff({ limit: 100 });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarCheck className="h-6 w-6 text-teal-600" />
            Leave Requests & Coverage Review
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review staff leave requests with automatic conflict checks against shifts and active clinical tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/laboratory/scheduling/availability">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Clock className="h-4 w-4" /> Weekly Availability
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <Plus className="h-4 w-4" /> Submit Leave
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={!filter.status ? 'default' : 'outline'}
          onClick={() => setFilter((prev) => ({ ...prev, status: undefined }))}
          className={!filter.status ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
        >
          All ({leaveRequests.length})
        </Button>
        {STATUS_OPTIONS.map((st) => (
          <Button
            key={st}
            size="sm"
            variant={filter.status === st ? 'default' : 'outline'}
            onClick={() => setFilter((prev) => ({ ...prev, status: st }))}
            className={filter.status === st ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
          >
            {st}
          </Button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <LeaveRequestTable
        leaveRequests={leaveRequests}
        loading={loading}
        onReview={async (id, status, rejectionReason) => {
          await reviewLeave(id, { status, rejectionReason });
        }}
      />

      <LeaveRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        staffList={staffList}
        onSubmit={async (dto) => {
          await submitLeave(dto);
        }}
      />
    </div>
  );
}
