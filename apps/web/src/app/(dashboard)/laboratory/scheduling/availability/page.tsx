'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import type { WeeklyAvailabilityWindowDto } from '@healthbridge/shared-types';
import {
  useLaboratoryStaff,
  useStaffAvailability,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DAYS: WeeklyAvailabilityWindowDto['dayOfWeek'][] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DEFAULT_SCHEDULE: WeeklyAvailabilityWindowDto[] = DAYS.map((day) => ({
  dayOfWeek: day,
  isAvailable: day !== 'SUNDAY',
  maxHours: 8,
}));

export default function LaboratoryStaffAvailabilityPage() {
  const { staffList, loading: staffLoading } = useLaboratoryStaff({ limit: 100 });
  const [selectedStaffId, setSelectedStaffId] = useState('');

  useEffect(() => {
    if (!selectedStaffId && staffList.length > 0) {
      const firstActive = staffList.find((s) => s.status === 'ACTIVE') || staffList[0];
      if (firstActive) setSelectedStaffId(firstActive.id);
    }
  }, [staffList, selectedStaffId]);

  const { availability, loading, updateAvailability } = useStaffAvailability(selectedStaffId);

  const [weeklySchedule, setWeeklySchedule] =
    useState<WeeklyAvailabilityWindowDto[]>(DEFAULT_SCHEDULE);
  const [blackouts, setBlackouts] = useState<Array<{ date: string; reason?: string }>>([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [newBlackoutReason, setNewBlackoutReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (availability) {
      setWeeklySchedule(
        availability.weeklySchedule.length > 0 ? availability.weeklySchedule : DEFAULT_SCHEDULE
      );
      setBlackouts(availability.customBlackouts || []);
    }
  }, [availability]);

  const toggleDay = (day: WeeklyAvailabilityWindowDto['dayOfWeek']) => {
    setWeeklySchedule((prev) =>
      prev.map((row) =>
        row.dayOfWeek === day ? { ...row, isAvailable: !row.isAvailable } : row
      )
    );
  };

  const updateHours = (day: WeeklyAvailabilityWindowDto['dayOfWeek'], maxHours: number) => {
    setWeeklySchedule((prev) =>
      prev.map((row) => (row.dayOfWeek === day ? { ...row, maxHours } : row))
    );
  };

  const addBlackout = () => {
    if (!newBlackoutDate) return;
    setBlackouts((prev) => [
      ...prev,
      { date: newBlackoutDate, reason: newBlackoutReason.trim() || undefined },
    ]);
    setNewBlackoutDate('');
    setNewBlackoutReason('');
  };

  const handleSave = async () => {
    if (!selectedStaffId) return;
    try {
      setSaving(true);
      setMessage(null);
      await updateAvailability({
        timezone: 'Asia/Kolkata',
        weeklySchedule,
        customBlackouts: blackouts,
      });
      setMessage('Staff availability schedule updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/laboratory/scheduling/leave">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Leave Requests
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-6 w-6 text-teal-600" />
              Staff Weekly Availability & Blackouts
            </h1>
            <p className="text-xs text-slate-500">
              Define weekly duty windows and custom unavailable dates for scheduling conflict checks.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !selectedStaffId}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Availability'}
        </Button>
      </div>

      {/* Staff Selector */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Select Laboratory Staff Member
        </label>
        <select
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          disabled={staffLoading}
          className="w-full max-w-md rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
        >
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.employeeId}) — {s.role.replace('LAB_', '')}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Schedule */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Weekly Duty Windows (IST / Asia/Kolkata)
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {weeklySchedule.map((row) => (
                <div key={row.dayOfWeek} className="flex items-center justify-between py-2.5">
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={row.isAvailable}
                      onChange={() => toggleDay(row.dayOfWeek)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600"
                    />
                    <span>{row.dayOfWeek}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Max hrs:</span>
                    <Input
                      type="number"
                      min={0}
                      max={16}
                      value={row.maxHours ?? 8}
                      disabled={!row.isAvailable}
                      onChange={(e) => updateHours(row.dayOfWeek, Number(e.target.value))}
                      className="w-20 h-8 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Blackouts */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Custom Unavailable / Blackout Dates
            </h3>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="date"
                value={newBlackoutDate}
                onChange={(e) => setNewBlackoutDate(e.target.value)}
                className="sm:w-40"
              />
              <Input
                placeholder="Reason (e.g., CME Seminar)"
                value={newBlackoutReason}
                onChange={(e) => setNewBlackoutReason(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" onClick={addBlackout}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {blackouts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No custom blackout dates configured.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {blackouts.map((b, idx) => (
                  <div key={`${b.date}-${idx}`} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200">
                        {b.date}
                      </span>
                      {b.reason && (
                        <span className="ml-2 text-xs text-slate-500">— {b.reason}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setBlackouts((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
