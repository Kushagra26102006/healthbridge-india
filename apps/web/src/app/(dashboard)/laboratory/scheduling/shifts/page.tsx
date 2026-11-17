'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Plus, Calendar, Moon, Sun, RefreshCw } from 'lucide-react';
import type { LaboratoryShiftAssignmentDto } from '@healthbridge/shared-types';
import {
  useLaboratoryScheduling,
  useLaboratoryStaff,
  useLaboratoryDepartments,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { ShiftCalendar } from '@/features/laboratory/components/ShiftCalendar';
import { ShiftAssignmentModal } from '@/features/laboratory/components/ShiftAssignmentModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LaboratoryShiftRosterPage() {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tmplName, setTmplName] = useState('');
  const [tmplCode, setTmplCode] = useState('');
  const [tmplStart, setTmplStart] = useState('08:00');
  const [tmplEnd, setTmplEnd] = useState('16:00');
  const [tmplBreak, setTmplBreak] = useState('30');
  const [tmplError, setTmplError] = useState<string | null>(null);
  const [swapTargetShift, setSwapTargetShift] = useState<LaboratoryShiftAssignmentDto | null>(null);
  const [swapWithStaffId, setSwapWithStaffId] = useState('');
  const [swapReason, setSwapReason] = useState('');

  const {
    templates,
    shifts,
    loading,
    error,
    refetch,
    createTemplate,
    assignShift,
    requestSwap,
    reviewSwap,
  } = useLaboratoryScheduling();
  const { staffList } = useLaboratoryStaff({ limit: 100 });
  const { departments } = useLaboratoryDepartments();

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTmplError(null);
      await createTemplate({
        name: tmplName.trim(),
        code: tmplCode.trim().toUpperCase(),
        startTime: tmplStart,
        endTime: tmplEnd,
        breakMinutes: Number(tmplBreak) || 0,
      });
      setTmplName('');
      setTmplCode('');
      setShowTemplateForm(false);
    } catch (err: any) {
      setTmplError(err?.response?.data?.message || err?.message || 'Failed to create shift template');
    }
  };

  const handleSubmitSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapTargetShift || !swapWithStaffId || !swapReason.trim()) return;
    await requestSwap(swapTargetShift.id, {
      targetStaffId: swapWithStaffId,
      reason: swapReason.trim(),
    });
    setSwapTargetShift(null);
    setSwapWithStaffId('');
    setSwapReason('');
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-teal-600" />
            Laboratory Shift Roster & Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure daytime and overnight shift templates, assign bench schedules, and approve shift swaps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/laboratory/scheduling/calendar">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Calendar className="h-4 w-4" /> Calendar View
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateForm((v) => !v)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> New Template
          </Button>
          <Button
            size="sm"
            onClick={() => setAssignModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <Plus className="h-4 w-4" /> Assign Shift
          </Button>
        </div>
      </div>

      {/* Create Shift Template Form */}
      {showTemplateForm && (
        <form
          onSubmit={handleCreateTemplate}
          className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Create Shift Template (Overnight shifts auto-detected when End &lt; Start)
          </h3>
          {tmplError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {tmplError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <Input
              placeholder="Name (e.g., Night Shift)"
              value={tmplName}
              onChange={(e) => setTmplName(e.target.value)}
              required
            />
            <Input
              placeholder="Code (e.g., NIGHT)"
              value={tmplCode}
              onChange={(e) => setTmplCode(e.target.value.toUpperCase())}
              required
            />
            <Input type="time" value={tmplStart} onChange={(e) => setTmplStart(e.target.value)} required />
            <Input type="time" value={tmplEnd} onChange={(e) => setTmplEnd(e.target.value)} required />
            <Input
              type="number"
              min={0}
              max={180}
              placeholder="Break (min)"
              value={tmplBreak}
              onChange={(e) => setTmplBreak(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowTemplateForm(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              Save Template
            </Button>
          </div>
        </form>
      )}

      {/* Templates Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {t.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t.startTime} – {t.endTime} ({t.breakMinutes}m break)
              </p>
            </div>
            {t.isOvernight ? (
              <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ShiftCalendar
        shifts={shifts}
        loading={loading}
        onRequestSwap={(shift) => setSwapTargetShift(shift)}
        onReviewSwap={async (shiftId, approved) => {
          await reviewSwap(shiftId, { approved });
        }}
      />

      <ShiftAssignmentModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        staffList={staffList}
        departments={departments}
        templates={templates}
        onAssign={async (dto) => {
          await assignShift(dto);
        }}
      />

      {/* Shift Swap Modal */}
      {swapTargetShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitSwap}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Request Shift Swap ({swapTargetShift.date})
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Swap With Staff Member *
              </label>
              <select
                value={swapWithStaffId}
                onChange={(e) => setSwapWithStaffId(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="">-- Select Colleague --</option>
                {staffList
                  .filter((s) => s.status === 'ACTIVE' && s.id !== swapTargetShift.staffId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.employeeId})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reason *
              </label>
              <Input
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                placeholder="Reason for requesting swap..."
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSwapTargetShift(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                Submit Swap Request
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
