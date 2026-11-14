'use client';

import React, { useState } from 'react';
import {
  Video,
  MapPin,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDoctorSchedule } from '@/features/doctor/hooks/use-doctor';
import type { UpdateDoctorScheduleDto } from '@healthbridge/shared-types';

const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

export interface ScheduleEditorProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export function ScheduleEditor({ onClose, onSuccess }: ScheduleEditorProps) {
  const { schedule, updateSchedule, isUpdating } = useDoctorSchedule();

  const [workingDays, setWorkingDays] = useState<string[]>(
    schedule?.workingDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
  );
  const [startTime, setStartTime] = useState(schedule?.workingHours?.start || '09:00');
  const [endTime, setEndTime] = useState(schedule?.workingHours?.end || '17:00');
  const [slotDuration, setSlotDuration] = useState<number>(schedule?.slotDurationMinutes || 30);
  const [consultationModes, setConsultationModes] = useState<('IN_PERSON' | 'TELECONSULTATION')[]>(
    schedule?.consultationModes || ['IN_PERSON', 'TELECONSULTATION']
  );
  const [blockedSlots, setBlockedSlots] = useState<
    Array<{ date: string; startTime: string; endTime: string; reason?: string }>
  >(
    (schedule?.existingBlocks || []).filter(
      (b) => b.reason !== 'Booked Patient Appointment'
    )
  );

  // New blocked slot form state
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('13:00');
  const [newBlockEnd, setNewBlockEnd] = useState('14:00');
  const [newBlockReason, setNewBlockReason] = useState('Lunch / Break');

  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day]
    );
  };

  const toggleMode = (mode: 'IN_PERSON' | 'TELECONSULTATION') => {
    setConsultationModes((prev) =>
      prev.includes(mode)
        ? prev.length > 1
          ? prev.filter((m) => m !== mode)
          : prev
        : [...prev, mode]
    );
  };

  const handleAddBlockedSlot = () => {
    if (!newBlockDate) {
      setFormError('Please select a date for the blocked period');
      return;
    }
    if (newBlockStart >= newBlockEnd) {
      setFormError('Block start time must be before end time');
      return;
    }

    setBlockedSlots((prev) => [
      ...prev,
      {
        date: newBlockDate,
        startTime: newBlockStart,
        endTime: newBlockEnd,
        reason: newBlockReason || 'Time off',
      },
    ]);
    setNewBlockDate('');
    setFormError(null);
  };

  const handleRemoveBlockedSlot = (idx: number) => {
    setBlockedSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaveSuccess(false);

    if (startTime >= endTime) {
      setFormError('Daily start time must be earlier than daily end time.');
      return;
    }

    try {
      const payload: UpdateDoctorScheduleDto = {
        workingDays,
        workingHours: {
          start: startTime,
          end: endTime,
        },
        slotDurationMinutes: slotDuration,
        consultationModes,
        blockedSlots,
      };

      await updateSchedule(payload);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update schedule');
    }
  };

  return (
    <Card className="border border-border/80 bg-card shadow-lg animate-fade-in">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Configure Consultation Availability
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Set your weekly working days, clinic operating hours, and planned absences
          </CardDescription>
        </div>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-5 text-xs">
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            Schedule and availability saved successfully!
          </div>
        )}

        {formError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Working Days */}
          <div className="space-y-2">
            <span className="font-bold text-foreground block">
              Working Days ({workingDays.length} Active)
            </span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const active = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Hours & Slot Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label htmlFor="sched-start" className="font-bold text-foreground block">
                Daily Start Time
              </label>
              <input
                id="sched-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sched-end" className="font-bold text-foreground block">
                Daily End Time
              </label>
              <input
                id="sched-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sched-duration" className="font-bold text-foreground block">
                Slot Duration
              </label>
              <select
                id="sched-duration"
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {SLOT_DURATIONS.map((dur) => (
                  <option key={dur} value={dur}>
                    {dur} Minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Consultation Modes */}
          <div className="space-y-1.5 pt-1">
            <span className="font-bold text-foreground block">Consultation Modes</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={consultationModes.includes('IN_PERSON')}
                  onChange={() => toggleMode('IN_PERSON')}
                  className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                In-Person Hospital Visit
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={consultationModes.includes('TELECONSULTATION')}
                  onChange={() => toggleMode('TELECONSULTATION')}
                  className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <Video className="h-3.5 w-3.5 text-indigo-600" />
                Teleconsultation (ABDM UHI)
              </label>
            </div>
          </div>

          {/* Blocked Periods / Leaves Section */}
          <div className="space-y-3 pt-3 border-t border-border/80">
            <span className="font-bold text-foreground block">
              Blocked Time & Clinic Leaves ({blockedSlots.length})
            </span>

            {/* Existing blocks list */}
            {blockedSlots.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {blockedSlots.map((block, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">{block.date}</span>
                      <span className="font-mono text-muted-foreground">
                        {block.startTime} - {block.endTime}
                      </span>
                      {block.reason && (
                        <span className="text-[11px] text-muted-foreground">({block.reason})</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveBlockedSlot(idx)}
                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new block inputs */}
            <div className="p-3 rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Add Temporary Time Block / Leave
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="date"
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
                />
                <input
                  type="time"
                  value={newBlockStart}
                  onChange={(e) => setNewBlockStart(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
                />
                <input
                  type="time"
                  value={newBlockEnd}
                  onChange={(e) => setNewBlockEnd(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder="Reason..."
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddBlockedSlot}
                className="text-xs gap-1 mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Block
              </Button>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            {onClose && (
              <Button type="button" size="sm" variant="outline" onClick={onClose} className="text-xs">
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-semibold px-4"
            >
              <Save className="h-3.5 w-3.5" />
              {isUpdating ? 'Saving Schedule...' : 'Save Availability'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
