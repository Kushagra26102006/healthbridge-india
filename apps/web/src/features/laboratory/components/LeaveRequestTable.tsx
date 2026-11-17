'use client';

import React from 'react';
import { CalendarOff, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { LaboratoryLeaveRequestDto, LeaveRequestStatus } from '@healthbridge/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface LeaveRequestTableProps {
  leaveRequests: LaboratoryLeaveRequestDto[];
  loading?: boolean;
  onReview?: (id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) => Promise<void>;
}

const LEAVE_STATUS_BADGE: Record<LeaveRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  CANCELLED: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export function LeaveRequestTable({
  leaveRequests,
  loading = false,
  onReview,
}: LeaveRequestTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading leave requests...</p>
      </div>
    );
  }

  if (leaveRequests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
        <CalendarOff className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
          No Leave Requests
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Submit or track staff leave requests and review operational shift impacts.
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
            <th className="px-4 py-3.5">Leave Type</th>
            <th className="px-4 py-3.5">Date Range</th>
            <th className="px-4 py-3.5">Reason & Impact</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {leaveRequests.map((req) => (
            <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
              <td className="px-5 py-4">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {req.staffName || req.staffId}
                </div>
                {req.staffEmployeeId && (
                  <div className="text-xs font-mono text-slate-500">{req.staffEmployeeId}</div>
                )}
              </td>
              <td className="px-4 py-4">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {req.leaveType}
                </span>
              </td>
              <td className="px-4 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                {req.startDate} → {req.endDate}
              </td>
              <td className="px-4 py-4">
                <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xs">{req.reason}</p>
                {((req.affectedShiftCount ?? 0) > 0 || (req.affectedTaskCount ?? 0) > 0) && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Impacts {req.affectedShiftCount ?? 0} shifts, {req.affectedTaskCount ?? 0} active tasks
                  </div>
                )}
              </td>
              <td className="px-4 py-4">
                <Badge className={`${LEAVE_STATUS_BADGE[req.status]} border-none text-[11px]`}>
                  {req.status}
                </Badge>
              </td>
              <td className="px-4 py-4 text-right">
                {req.status === 'PENDING' && onReview ? (
                  <div className="inline-flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => onReview(req.id, 'APPROVED')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                      onClick={() => onReview(req.id, 'REJECTED', 'Insufficient bench coverage')}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    {req.approvedByName ? `By ${req.approvedByName}` : 'Reviewed'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
