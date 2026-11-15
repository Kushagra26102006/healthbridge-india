'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Globe,
  Coffee,
  Ban,
  RefreshCw,
} from 'lucide-react';
import {
  usePharmacyOperatingHours,
  useUpdateOperatingHours,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type {
  DayOperatingSchedule,
  DayOfWeek,
  OperatingBreakInterval,
  HolidayDto,
} from '@healthbridge/shared-types';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DEFAULT_SCHEDULE: DayOperatingSchedule[] = DAYS_OF_WEEK.map((day) => ({
  dayOfWeek: day,
  isOpen: day !== 'SUNDAY',
  is24Hours: false,
  openTime: '08:00',
  closeTime: '22:00',
  breaks: [],
}));

export default function PharmacyOperatingHoursPage() {
  const { data: hoursData, isLoading, refetch } = usePharmacyOperatingHours();
  const updateMutation = useUpdateOperatingHours();

  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [is24HoursGlobal, setIs24HoursGlobal] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<DayOperatingSchedule[]>(DEFAULT_SCHEDULE);
  const [temporaryClosure, setTemporaryClosure] = useState({
    isTemporarilyClosed: false,
    reason: '',
    reopenDate: '',
  });
  const [holidays, setHolidays] = useState<HolidayDto[]>([]);

  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (hoursData) {
      setTimezone(hoursData.timezone || 'Asia/Kolkata');
      setIs24HoursGlobal(Boolean(hoursData.is24Hours));
      if (hoursData.weeklySchedule && hoursData.weeklySchedule.length > 0) {
        setWeeklySchedule(hoursData.weeklySchedule);
      }
      if (hoursData.temporaryClosure) {
        setTemporaryClosure({
          isTemporarilyClosed: Boolean(hoursData.temporaryClosure.isTemporarilyClosed),
          reason: hoursData.temporaryClosure.reason || '',
          reopenDate: hoursData.temporaryClosure.reopenDate
            ? hoursData.temporaryClosure.reopenDate.slice(0, 10)
            : '',
        });
      }
      if (hoursData.holidays) {
        setHolidays(hoursData.holidays);
      }
    }
  }, [hoursData]);

  const handleDayChange = (
    dayIndex: number,
    field: keyof DayOperatingSchedule,
    value: any
  ) => {
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      copy[dayIndex] = { ...copy[dayIndex]!, [field]: value };
      return copy;
    });
  };

  const handleAddBreak = (dayIndex: number) => {
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIndex]! };
      targetDay.breaks = [
        ...(targetDay.breaks || []),
        { breakName: 'Lunch Break', startTime: '13:00', endTime: '14:00' },
      ];
      copy[dayIndex] = targetDay;
      return copy;
    });
  };

  const handleRemoveBreak = (dayIndex: number, breakIndex: number) => {
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIndex]! };
      targetDay.breaks = targetDay.breaks.filter((_, idx) => idx !== breakIndex);
      copy[dayIndex] = targetDay;
      return copy;
    });
  };

  const handleBreakChange = (
    dayIndex: number,
    breakIndex: number,
    field: keyof OperatingBreakInterval,
    value: string
  ) => {
    setWeeklySchedule((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIndex]! };
      const breaksCopy = [...targetDay.breaks];
      breaksCopy[breakIndex] = { ...breaksCopy[breakIndex]!, [field]: value };
      targetDay.breaks = breaksCopy;
      copy[dayIndex] = targetDay;
      return copy;
    });
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate) return;

    setHolidays((prev) => [
      ...prev,
      {
        id: `HOL-${Date.now()}`,
        name: newHolidayName.trim(),
        date: newHolidayDate,
        isClosed: true,
      },
    ]);
    setNewHolidayName('');
    setNewHolidayDate('');
  };

  const handleRemoveHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSave = async () => {
    setFeedback(null);

    // Front-end validation: check opening < closing
    for (const day of weeklySchedule) {
      if (day.isOpen && !day.is24Hours) {
        if (day.openTime >= day.closeTime) {
          setFeedback({
            type: 'error',
            message: `Invalid hours on ${day.dayOfWeek}: Open time (${day.openTime}) must be earlier than close time (${day.closeTime}).`,
          });
          return;
        }
        for (const b of day.breaks) {
          if (b.startTime >= b.endTime) {
            setFeedback({
              type: 'error',
              message: `Invalid break on ${day.dayOfWeek}: Start time (${b.startTime}) must be earlier than end time (${b.endTime}).`,
            });
            return;
          }
        }
      }
    }

    try {
      await updateMutation.mutateAsync({
        timezone,
        is24Hours: is24HoursGlobal,
        weeklySchedule,
        temporaryClosure: {
          isTemporarilyClosed: temporaryClosure.isTemporarilyClosed,
          reason: temporaryClosure.reason.trim() || undefined,
          reopenDate: temporaryClosure.reopenDate
            ? new Date(temporaryClosure.reopenDate).toISOString()
            : undefined,
        },
        holidays,
      });

      setFeedback({ type: 'success', message: 'Operating hours schedule updated successfully' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update operating hours' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl w-full" />
        <div className="h-96 bg-slate-200 rounded-xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Dispensary Availability Management</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Operating Hours & Weekly Schedule
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure weekly counter hours, staff shift breaks, holiday closures, and real-time open status.
        </p>
      </div>

      <PharmacySettingsNav />

      {/* Real-time Status Banner */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              hoursData?.isOpenNow
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">
                Current Operational Status:
              </span>
              <Badge
                className={
                  hoursData?.isOpenNow
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }
              >
                {hoursData?.isOpenNow ? 'DISPENSARY OPEN' : 'DISPENSARY CLOSED'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {hoursData?.currentStatusReason || 'Calculated in real-time according to timezone & schedule'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{timezone}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Status
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Global Flags & Timezone */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          General Availability Preferences
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                24 Hours Continuous Dispensary
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pharmacy is open around the clock 24/7 without daily closing times.
              </p>
            </div>
            <Switch
              checked={is24HoursGlobal}
              onCheckedChange={setIs24HoursGlobal}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Store Timezone *
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+05:30)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST, UTC+04:00)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Used for evaluating operating hours and generating accurate pickup ready estimates.
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Operating Schedule */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Weekly Operating Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Set open/close times and configure staff break intervals for each day
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {weeklySchedule.map((daySchedule, dayIdx) => (
            <div key={daySchedule.dayOfWeek} className="py-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-36">
                  <Switch
                    checked={daySchedule.isOpen}
                    onCheckedChange={(val: boolean) => handleDayChange(dayIdx, 'isOpen', val)}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      daySchedule.isOpen ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {daySchedule.dayOfWeek.slice(0, 3)}
                  </span>
                </div>

                {daySchedule.isOpen ? (
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={daySchedule.is24Hours}
                        onChange={(e) =>
                          handleDayChange(dayIdx, 'is24Hours', e.target.checked)
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>24h</span>
                    </label>

                    {!daySchedule.is24Hours && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={daySchedule.openTime}
                          onChange={(e) =>
                            handleDayChange(dayIdx, 'openTime', e.target.value)
                          }
                          className="w-28 text-xs h-8"
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <Input
                          type="time"
                          value={daySchedule.closeTime}
                          onChange={(e) =>
                            handleDayChange(dayIdx, 'closeTime', e.target.value)
                          }
                          className="w-28 text-xs h-8"
                        />
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddBreak(dayIdx)}
                      className="text-xs text-slate-600 hover:text-indigo-600 h-8"
                    >
                      <Coffee className="w-3.5 h-3.5 mr-1" />
                      Add Break
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 text-xs text-slate-400 italic">
                    Dispensary Closed on {daySchedule.dayOfWeek}
                  </div>
                )}
              </div>

              {/* Break intervals */}
              {daySchedule.isOpen &&
                daySchedule.breaks &&
                daySchedule.breaks.length > 0 && (
                  <div className="pl-12 space-y-2">
                    {daySchedule.breaks.map((brk, brkIdx) => (
                      <div
                        key={brkIdx}
                        className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-lg"
                      >
                        <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <Input
                          value={brk.breakName || ''}
                          onChange={(e) =>
                            handleBreakChange(dayIdx, brkIdx, 'breakName', e.target.value)
                          }
                          placeholder="Break label"
                          className="text-xs h-7 w-32"
                        />
                        <Input
                          type="time"
                          value={brk.startTime}
                          onChange={(e) =>
                            handleBreakChange(dayIdx, brkIdx, 'startTime', e.target.value)
                          }
                          className="text-xs h-7 w-24"
                        />
                        <span className="text-slate-400">to</span>
                        <Input
                          type="time"
                          value={brk.endTime}
                          onChange={(e) =>
                            handleBreakChange(dayIdx, brkIdx, 'endTime', e.target.value)
                          }
                          className="text-xs h-7 w-24"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBreak(dayIdx, brkIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Temporary Closure & Holidays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temporary Closure */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Temporary Store Closure
              </h3>
            </div>
            <Switch
              checked={temporaryClosure.isTemporarilyClosed}
              onCheckedChange={(val: boolean) =>
                setTemporaryClosure((prev) => ({ ...prev, isTemporarilyClosed: val }))
              }
            />
          </div>

          <p className="text-xs text-slate-500">
            Temporarily pauses order acceptance and marks the pharmacy closed (e.g. for store renovation or audit).
          </p>

          {temporaryClosure.isTemporarilyClosed && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Temporary Closure
                </label>
                <Input
                  value={temporaryClosure.reason}
                  onChange={(e) =>
                    setTemporaryClosure((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="e.g. Annual inventory stocktake and sanitation"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Expected Reopen Date
                </label>
                <Input
                  type="date"
                  value={temporaryClosure.reopenDate}
                  onChange={(e) =>
                    setTemporaryClosure((prev) => ({
                      ...prev,
                      reopenDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Holidays */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Gazetted & Custom Holidays</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify days the dispensary is closed or operating on special hours
            </p>
          </div>

          <form onSubmit={handleAddHoliday} className="flex gap-2">
            <Input
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
              placeholder="Holiday name (e.g. Diwali)"
              className="text-xs h-8"
            />
            <Input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className="text-xs h-8 w-36"
            />
            <Button type="submit" size="sm" variant="outline" className="text-xs h-8">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {holidays.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No holidays configured.</p>
            ) : (
              holidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-100"
                >
                  <div>
                    <span className="font-medium text-slate-800">{h.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">
                      {h.date}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveHoliday(h.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {updateMutation.isPending ? 'Saving...' : 'Save Schedule Changes'}
        </Button>
      </div>
    </div>
  );
}
