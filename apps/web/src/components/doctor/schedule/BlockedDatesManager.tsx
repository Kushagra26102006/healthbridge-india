'use client';

import React, { useState } from 'react';
import {
  ShieldBan,
  Calendar,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDoctorBlockedDates } from '@/features/doctor/hooks/use-doctor';
import { ScheduleConflictDialog } from './ScheduleConflictDialog';
import { ScheduleSkeleton } from './ScheduleSkeleton';
import type { AffectedAppointmentSummaryDto } from '@healthbridge/shared-types';

export function BlockedDatesManager() {
  const {
    blockedDates,
    isLoading,
    isError,
    error,
    createBlockedDate,
    deleteBlockedDate,
    isCreating,
    isDeleting,
  } = useDoctorBlockedDates();

  // New Block Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');

  // Conflict Dialog State
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictAppointments, setConflictAppointments] = useState<AffectedAppointmentSummaryDto[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  if (isError) {
    return (
      <Card className="p-8 text-center border-dashed border-border/80">
        <p className="text-sm font-semibold text-destructive">Failed to load blocked dates</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message}</p>
      </Card>
    );
  }

  const validateForm = (): boolean => {
    if (!startDate) {
      setFormError('Please select a start date');
      return false;
    }
    if (!endDate) {
      setFormError('Please select an end date');
      return false;
    }
    if (startDate > endDate) {
      setFormError('Start date cannot be after end date');
      return false;
    }
    if (!isAllDay) {
      if (!startTime || !endTime) {
        setFormError('Please specify start and end times for partial day block');
        return false;
      }
      if (startTime >= endTime) {
        setFormError('Start time must be before end time');
        return false;
      }
    }
    if (!reason || reason.trim().length < 3) {
      setFormError('Please provide a reason (minimum 3 characters)');
      return false;
    }
    return true;
  };

  const handleCreate = async (force: boolean = false) => {
    if (!validateForm()) return;

    try {
      setFormError(null);
      const result = await createBlockedDate({
        startDate,
        endDate,
        isAllDay,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        reason: reason.trim(),
        forceWithConflicts: force,
      });

      if (result.hasConflicts && !result.success) {
        setConflictAppointments(result.affectedAppointments || []);
        setShowConflictDialog(true);
        return;
      }

      setShowConflictDialog(false);
      setShowAddForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setSuccessMessage(result.message || 'Time period blocked successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create blocked date');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBlockedDate(id);
      setSuccessMessage('Blocked period removed successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to remove blocked date');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <ShieldBan className="h-4 w-4 text-amber-600" />
            Blocked Dates & Leave Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Block full days, partial days, or custom vacation intervals. Prevents new patient bookings.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          {showAddForm ? 'Close Form' : 'Block New Period'}
        </Button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Add Block Form Card */}
      {showAddForm && (
        <Card className="border border-border/80 bg-card animate-fade-in shadow-md">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-bold text-foreground">
              Configure Leave or Blocked Time
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Define the dates, duration, and clinical reason for unavailability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {formError && (
              <div className="p-3 rounded-lg border border-destructive/60 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            {/* Date Range Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="isAllDay"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isAllDay" className="text-xs font-semibold text-foreground cursor-pointer">
                All-Day Block (Entire Day Off)
              </label>
            </div>

            {/* Partial Day Time Inputs */}
            {!isAllDay && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg border border-border/60 bg-muted/20 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Reason / Note
              </label>
              <Input
                type="text"
                placeholder="e.g. Attending Annual Cardiology Summit / Personal Leave"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleCreate(false)}
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
              >
                {isCreating ? 'Validating Conflicts...' : 'Save Blocked Period'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocked Dates List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Active Blocked Periods ({blockedDates.length})
        </h3>

        {blockedDates.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-border/80">
            <ShieldBan className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-xs font-bold text-foreground">No Blocked Dates on File</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Your weekly availability is currently open with zero holiday or leave overrides.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blockedDates.map((block) => (
              <Card key={block.id} className="p-4 border border-border/80 bg-card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono text-[10px]"
                      >
                        {block.isAllDay ? 'All Day' : `${block.startTime} - ${block.endTime}`}
                      </Badge>
                      {block.affectedAppointmentCount && block.affectedAppointmentCount > 0 ? (
                        <Badge
                          variant="destructive"
                          className="text-[9px] gap-1"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {block.affectedAppointmentCount} Conflicting
                        </Badge>
                      ) : null}
                    </div>

                    <h4 className="text-xs font-bold text-foreground">{block.reason}</h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3" />
                      {block.startDate === block.endDate
                        ? block.startDate
                        : `${block.startDate} to ${block.endDate}`}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(block.id)}
                    disabled={isDeleting}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Conflict Dialog */}
      <ScheduleConflictDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        affectedAppointments={conflictAppointments}
        onConfirmOverride={() => handleCreate(true)}
        isSubmitting={isCreating}
      />
    </div>
  );
}

export default BlockedDatesManager;
