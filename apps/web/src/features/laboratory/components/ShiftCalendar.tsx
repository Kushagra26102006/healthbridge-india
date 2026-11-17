'use client';

import React, { useMemo } from 'react';
import { Clock, Moon, Sun, ArrowLeftRight, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';
import type { LaboratoryShiftAssignmentDto, ShiftAssignmentStatus } from '@healthbridge/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ShiftCalendarProps {
  shifts: LaboratoryShiftAssignmentDto[];
  loading?: boolean;
  onRequestSwap?: (shift: LaboratoryShiftAssignmentDto) => void;
  onReviewSwap?: (shiftId: string, approved: boolean) => Promise<void>;
}

const STATUS_STYLE: Record<ShiftAssignmentStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  SWAP_REQUESTED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  SWAPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  COMPLETED: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  ABSENT: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  CANCELLED: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export function ShiftCalendar({
  shifts,
  loading = false,
  onRequestSwap,
  onReviewSwap,
}: ShiftCalendarProps) {
  const groupedByDate = useMemo(() => {
    const map = new Map<string, LaboratoryShiftAssignmentDto[]>();
    for (const shift of shifts) {
      const existing = map.get(shift.date) || [];
      existing.push(shift);
      map.set(shift.date, existing);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [shifts]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading shift schedule...</p>
      </div>
    );
  }

  if (groupedByDate.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
          No Scheduled Shifts
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Assign shift templates to laboratory technicians, supervisors, and pathologists.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedByDate.map(([date, dayShifts]) => (
        <div
          key={date}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{date}</span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {dayShifts.length} {dayShifts.length === 1 ? 'assignment' : 'assignments'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dayShifts.map((shift) => (
              <div
                key={shift.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                      shift.isOvernight
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                        : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {shift.isOvernight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {shift.staffName || shift.staffId}
                      </span>
                      {shift.staffRole && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {shift.staffRole.replace('LAB_', '')}
                        </span>
                      )}
                      {shift.departmentName && (
                        <span className="text-xs text-slate-500">• {shift.departmentName}</span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {shift.shiftTemplateName || 'Shift'} ({shift.startTime} – {shift.endTime})
                      </span>
                      {shift.isOvernight && (
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                          Overnight (+1 day)
                        </span>
                      )}
                    </div>

                    {shift.swapDetails && shift.swapDetails.status === 'PENDING' && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/70 dark:bg-amber-950/40 dark:border-amber-800 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">
                        Swap requested with{' '}
                        <strong>
                          {shift.swapDetails.requestedWithStaffName ||
                            shift.swapDetails.requestedWithStaffId}
                        </strong>
                        {shift.swapDetails.reason ? ` — "${shift.swapDetails.reason}"` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge className={`${STATUS_STYLE[shift.status]} border-none text-[11px]`}>
                    {shift.status.replace('_', ' ')}
                  </Badge>

                  {shift.status === 'SWAP_REQUESTED' && onReviewSwap && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => onReviewSwap(shift.id, true)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                        onClick={() => onReviewSwap(shift.id, false)}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}

                  {(shift.status === 'SCHEDULED' || shift.status === 'CONFIRMED') &&
                    onRequestSwap && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={() => onRequestSwap(shift)}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
