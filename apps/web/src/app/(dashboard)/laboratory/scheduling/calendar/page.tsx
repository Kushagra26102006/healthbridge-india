'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import {
  useLaboratoryScheduling,
  useLaboratoryDepartments,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { ShiftCalendar } from '@/features/laboratory/components/ShiftCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LaboratoryShiftCalendarPage() {
  const { shifts, loading, error, filter, setFilter, refetch, reviewSwap } =
    useLaboratoryScheduling();
  const { departments } = useLaboratoryDepartments();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-teal-600" />
            Laboratory Shift Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View chronological shift coverage across benches, overnight rotations, and pending swap requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/laboratory/scheduling/shifts">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Clock className="h-4 w-4" /> Manage Roster & Templates
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={filter.startDate || ''}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, startDate: e.target.value || undefined }))
            }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={filter.endDate || ''}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, endDate: e.target.value || undefined }))
            }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Department
          </label>
          <select
            value={filter.departmentId || ''}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, departmentId: e.target.value || undefined }))
            }
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ShiftCalendar
        shifts={shifts}
        loading={loading}
        onReviewSwap={async (id, approved) => {
          await reviewSwap(id, { approved });
        }}
      />
    </div>
  );
}
