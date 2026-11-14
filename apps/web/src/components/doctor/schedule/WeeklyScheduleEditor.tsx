'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDoctorSchedule } from '@/features/doctor/hooks/use-doctor';
import { WorkingDayEditor } from './WorkingDayEditor';
import { ScheduleSkeleton } from './ScheduleSkeleton';
import type { DayScheduleDto } from '@healthbridge/shared-types';

export function WeeklyScheduleEditor() {
  const { schedule, isLoading, isError, error, refetch, updateSchedule, isUpdating } =
    useDoctorSchedule();

  const [weeklySchedule, setWeeklySchedule] = useState<DayScheduleDto[]>([]);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(30);
  const [bufferMinutes, setBufferMinutes] = useState<number>(5);
  const [isDirty, setIsDirty] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form state when schedule data is loaded
  useEffect(() => {
    if (schedule) {
      if (schedule.weeklySchedule && schedule.weeklySchedule.length > 0) {
        setWeeklySchedule(schedule.weeklySchedule);
      }
      setSlotDurationMinutes(schedule.slotDurationMinutes || 30);
      setBufferMinutes(schedule.bufferMinutes || 5);
      setIsDirty(false);
      setValidationError(null);
    }
  }, [schedule]);

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  if (isError || !schedule) {
    return (
      <Card className="p-8 text-center border-dashed border-border/80">
        <p className="text-sm font-semibold text-destructive">Failed to load weekly schedule</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message || 'Unknown error'}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4 text-xs">
          Retry
        </Button>
      </Card>
    );
  }

  const handleDayChange = (updatedDay: DayScheduleDto) => {
    setWeeklySchedule((prev) =>
      prev.map((d) => (d.day === updatedDay.day ? updatedDay : d))
    );
    setIsDirty(true);
    setSaveSuccess(false);
    setValidationError(null);
  };

  const handleReset = () => {
    if (schedule?.weeklySchedule) {
      setWeeklySchedule(schedule.weeklySchedule);
    }
    setSlotDurationMinutes(schedule?.slotDurationMinutes || 30);
    setBufferMinutes(schedule?.bufferMinutes || 5);
    setIsDirty(false);
    setValidationError(null);
    setSaveSuccess(false);
  };

  const validateSchedule = (): string | null => {
    // Check at least one enabled day
    const enabledDays = weeklySchedule.filter((d) => d.isEnabled);
    if (enabledDays.length === 0) {
      return 'At least one day of the week must be configured as a working day.';
    }

    // Validate each enabled day
    for (const day of enabledDays) {
      if (day.workingWindows.length === 0) {
        return `${day.day} is enabled but has no working windows defined. Please add working hours or mark as Day Off.`;
      }

      // Check working windows start < end
      for (const w of day.workingWindows) {
        if (w.start >= w.end) {
          return `${day.day} has an invalid working window: ${w.start} to ${w.end}. Start time must be before end time.`;
        }
      }

      // Check working windows overlap
      const sortedWindows = [...day.workingWindows].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sortedWindows.length - 1; i++) {
        if (sortedWindows[i]!.end > sortedWindows[i + 1]!.start) {
          return `${day.day} has overlapping working windows: ${sortedWindows[i]!.start}-${sortedWindows[i]!.end} overlaps with ${sortedWindows[i + 1]!.start}-${sortedWindows[i + 1]!.end}.`;
        }
      }

      // Check breaks
      for (const b of day.breaks) {
        if (b.start >= b.end) {
          return `${day.day} has an invalid break interval: ${b.start} to ${b.end}. Start time must be before end time.`;
        }

        // Break must be within at least one working window
        const insideWindow = day.workingWindows.some(
          (w) => b.start >= w.start && b.end <= w.end
        );
        if (!insideWindow) {
          return `${day.day} break (${b.start} - ${b.end}) is positioned outside of configured working hours. Breaks must fall inside active working hours.`;
        }
      }
    }

    return null;
  };

  const handleSave = async () => {
    const errorMsg = validateSchedule();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    try {
      setValidationError(null);
      await updateSchedule({
        timezone: schedule.timezone || 'Asia/Kolkata',
        slotDurationMinutes,
        bufferMinutes,
        weeklySchedule,
      });

      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to update weekly schedule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Save / Status Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Weekly Consultation Hours
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your standard weekly schedule, daily consultation shifts, and break intervals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={isUpdating}
              className="text-xs h-8 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Discard
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isUpdating ? 'Saving Schedule...' : 'Save Weekly Schedule'}
          </Button>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-3.5 rounded-xl border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="font-semibold">{validationError}</div>
        </div>
      )}

      {/* Success Alert */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="font-semibold">
            Weekly consultation schedule saved successfully! Availability slots are now updated for patient bookings.
          </div>
        </div>
      )}

      {/* 7-Day Editor Cards */}
      <div className="space-y-3">
        {weeklySchedule.map((day) => (
          <WorkingDayEditor
            key={day.day}
            dayConfig={day}
            onChange={handleDayChange}
          />
        ))}
      </div>
    </div>
  );
}

export default WeeklyScheduleEditor;
