'use client';

import React, { useState } from 'react';
import { Plus, Sparkles, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeIntervalEditor } from './TimeIntervalEditor';
import { useDoctorScheduleOverrides } from '@/features/doctor/hooks/use-doctor';

interface ScheduleOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleOverrideDialog({ open, onOpenChange }: ScheduleOverrideDialogProps) {
  const { createOverride, isCreating } = useDoctorScheduleOverrides();

  const [date, setDate] = useState('');
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [reason, setReason] = useState('');
  const [workingWindows, setWorkingWindows] = useState<Array<{ start: string; end: string }>>([
    { start: '09:00', end: '13:00' },
  ]);
  const [breaks, setBreaks] = useState<Array<{ start: string; end: string; label?: string }>>([]);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!date) {
      setFormError('Please select a date for the override');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setFormError('Please provide a reason for the special day override');
      return;
    }
    if (isWorkingDay && workingWindows.length === 0) {
      setFormError('A special working day must define at least one working time window');
      return;
    }

    try {
      setFormError(null);
      await createOverride({
        date,
        isWorkingDay,
        reason: reason.trim(),
        workingWindows: isWorkingDay ? workingWindows : [],
        breaks: isWorkingDay ? breaks : [],
      });

      onOpenChange(false);
      setDate('');
      setReason('');
      setWorkingWindows([{ start: '09:00', end: '13:00' }]);
      setBreaks([]);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create schedule override');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Special Working Day Override
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set custom clinic hours or a temporary day off that overrides your weekly schedule.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 py-1 text-xs">
          {formError && (
            <div className="p-3 rounded-lg border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Target Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Day Type
              </label>
              <select
                value={isWorkingDay ? 'WORKING' : 'OFF'}
                onChange={(e) => setIsWorkingDay(e.target.value === 'WORKING')}
                className="w-full h-8 text-xs rounded-lg border border-border bg-background px-2.5 font-medium"
              >
                <option value="WORKING">Special Working Day (Custom Hours)</option>
                <option value="OFF">Temporary Day Off (Clinic Closed)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Reason / Occasion
            </label>
            <Input
              type="text"
              placeholder="e.g. Sunday Morning Free Camp, Reduced Evening Hours"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {isWorkingDay && (
            <div className="space-y-3 pt-2 border-t border-border/40">
              <TimeIntervalEditor
                label="Custom Working Windows"
                type="WINDOW"
                items={workingWindows}
                onChange={(windows) => setWorkingWindows(windows as any)}
              />

              <TimeIntervalEditor
                label="Break Intervals"
                type="BREAK"
                items={breaks}
                onChange={(b) => setBreaks(b as any)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            {isCreating ? 'Saving...' : 'Save Override'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleOverrideDialog;
