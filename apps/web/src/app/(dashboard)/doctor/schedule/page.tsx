'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDoctorSchedule } from '@/features/doctor/hooks/use-doctor';

export default function DoctorSchedulePage() {
  const { schedule, isLoading, isError, error, refetch } = useDoctorSchedule();

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
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm font-bold text-foreground">Failed to load schedule</p>
        <p className="text-xs text-muted-foreground">{error?.message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const workingDays = schedule?.workingDays?.length
    ? schedule.workingDays
    : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  const workingHours = schedule?.workingHours || { start: '09:00', end: '17:00' };
  const slotDuration = schedule?.slotDurationMinutes || 30;
  const consultationModes = schedule?.consultationModes || ['IN_PERSON', 'TELECONSULTATION'];
  const blocks = schedule?.existingBlocks || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Clinical Schedule & Availability
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure consultation hours, working days, and slot capacity for patients
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="text-xs gap-1.5 self-start sm:self-center">
          <Link href="/doctor/profile">
            <Edit className="h-3.5 w-3.5" />
            Edit Availability in Profile
          </Link>
        </Button>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
            Working Days
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
            Daily Hours
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

      {/* Weekly Schedule Visual Grid */}
      <Card className="border border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-bold text-foreground">
              Weekly Consultation Matrix
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Slots are automatically published to patients based on this template
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

      {/* Blocked Slots & Leaves Foundation */}
      <Card className="border border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base font-bold text-foreground">
              Blocked Time & Clinic Leaves
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Emergency blocks, clinical conferences, or scheduled personal leave periods
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
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{block.date}</span>
                  <span className="font-mono text-muted-foreground">{block.startTime} - {block.endTime}</span>
                  <Badge variant="outline" className="text-[10px] text-amber-600">
                    {block.reason || 'Blocked'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
