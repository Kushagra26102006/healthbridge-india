'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScheduleEditor } from './ScheduleEditor';
import { useDoctorSchedule } from '@/features/doctor/hooks/use-doctor';

export function DoctorSchedule() {
  const { schedule, isLoading, isError, error, refetch } = useDoctorSchedule();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl">
        <div className="h-28 rounded-2xl bg-muted/60" />
        <div className="h-64 rounded-2xl bg-muted/40" />
        <div className="h-48 rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center space-y-3">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm font-bold text-foreground">Failed to load schedule</p>
        <p className="text-xs text-muted-foreground">{error?.message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  const workingDays = schedule?.workingDays || [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
  ];
  const workingHours = schedule?.workingHours || { start: '09:00', end: '17:00' };
  const slotDuration = schedule?.slotDurationMinutes || 30;
  const consultationModes = schedule?.consultationModes || ['IN_PERSON', 'TELECONSULTATION'];
  const blocks = schedule?.existingBlocks || [];

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Consultation Schedule & Availability
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your active clinic days, daily consultation hours, and slot booking windows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Edit className="h-3.5 w-3.5" />
            {isEditing ? 'Close Editor' : 'Edit Availability'}
          </Button>
        </div>
      </div>

      {/* Inline Editor when open */}
      {isEditing && (
        <ScheduleEditor
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            refetch();
          }}
        />
      )}

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
            Active Days
          </span>
          <span className="text-lg font-extrabold text-foreground block">
            {workingDays.length} Days / Week
          </span>
          <span className="text-[11px] text-muted-foreground truncate block">
            {workingDays.map((d) => d.slice(0, 3)).join(', ')}
          </span>
        </Card>

        <Card className="border border-border/80 bg-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
            Operating Hours
          </span>
          <span className="text-lg font-extrabold text-foreground block">
            {workingHours.start} - {workingHours.end}
          </span>
          <span className="text-[11px] text-muted-foreground">Standard Clinic Window</span>
        </Card>

        <Card className="border border-border/80 bg-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
            Slot Duration
          </span>
          <span className="text-lg font-extrabold text-foreground block">
            {slotDuration} Minutes
          </span>
          <span className="text-[11px] text-muted-foreground">Per consultation slot</span>
        </Card>

        <Card className="border border-border/80 bg-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
            Consultation Modes
          </span>
          <div className="flex items-center gap-1.5 pt-1">
            {consultationModes.includes('IN_PERSON') && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-600">
                In-Person
              </Badge>
            )}
            {consultationModes.includes('TELECONSULTATION') && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-500/40 text-indigo-600">
                Teleconsult
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Weekly Matrix */}
      <Card className="border border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-bold text-foreground">
              Weekly Consultation Matrix
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Slots are published to patients dynamically based on this weekly availability template
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {[
              'MONDAY',
              'TUESDAY',
              'WEDNESDAY',
              'THURSDAY',
              'FRIDAY',
              'SATURDAY',
              'SUNDAY',
            ].map((day) => {
              const active = workingDays.includes(day);

              return (
                <div
                  key={day}
                  className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all ${
                    active
                      ? 'border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-border/60 bg-muted/20 opacity-60'
                  }`}
                >
                  <span className="text-xs font-bold text-foreground block">
                    {day.slice(0, 3)}
                  </span>
                  {active ? (
                    <>
                      <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0">
                        Active
                      </Badge>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {workingHours.start} - {workingHours.end}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground block">
                      Off Duty
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Existing Blocks & Leaves */}
      <Card className="border border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base font-bold text-foreground">
              Blocked Time & Scheduled Clinic Leaves ({blocks.length})
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Personal leave, hospital administrative duties, or booked consultation reservations
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          {blocks.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="h-7 w-7 text-teal-600 dark:text-teal-400 mx-auto" />
              <p className="text-xs text-muted-foreground">
                No active slot blocks or leaves scheduled. Your regular consultation hours are open.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {blocks.map((block, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">{block.date}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {block.reason || 'Blocked Slot'}
                    </span>
                  </div>
                  <span className="font-mono text-muted-foreground">
                    {block.startTime} - {block.endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
