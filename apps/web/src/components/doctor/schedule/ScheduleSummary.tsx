'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CalendarCheck,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDoctorScheduleOverview } from '@/features/doctor/hooks/use-doctor';
import { ScheduleSkeleton } from './ScheduleSkeleton';

export function ScheduleSummary() {
  const { overview, isLoading, isError, error, refetch } = useDoctorScheduleOverview();

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  if (isError || !overview) {
    return (
      <Card className="p-8 text-center border-dashed border-border/80">
        <p className="text-sm font-semibold text-destructive">Failed to load schedule overview</p>
        <p className="text-xs text-muted-foreground mt-1">{error?.message || 'Unknown error occurred'}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4 text-xs">
          Try Again
        </Button>
      </Card>
    );
  }

  const {
    todayWorkingHours,
    todayAppointmentsCount,
    todayAvailableSlotsCount,
    todayBlockedPeriodsCount,
    nextWorkingDay,
    weeklyScheduleSummary,
    activeFacility,
  } = overview;

  return (
    <div className="space-y-6">
      {/* 4 Overview Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Working Hours */}
        <Card className="border border-border/80 bg-card p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Today&apos;s Hours
            </span>
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-foreground flex items-center gap-2">
              {todayWorkingHours.isWorking ? (
                <>
                  <span>{todayWorkingHours.start}</span>
                  <span className="text-xs font-normal text-muted-foreground">to</span>
                  <span>{todayWorkingHours.end}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Day Off / Clinic Closed</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {todayWorkingHours.isWorking ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Active Clinic Hours
                </span>
              ) : (
                'No consultations scheduled for today'
              )}
            </p>
          </div>
        </Card>

        {/* Today's Appointments */}
        <Card className="border border-border/80 bg-card p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Today&apos;s Bookings
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-foreground">
              {todayAppointmentsCount}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">Patients Scheduled</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Across In-person & Video appointments
            </p>
          </div>
        </Card>

        {/* Available Slots Today */}
        <Card className="border border-border/80 bg-card p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Available Slots Today
            </span>
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-teal-700 dark:text-teal-400">
              {todayAvailableSlotsCount}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">Bookable Slots</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Excluding breaks and booked slots
            </p>
          </div>
        </Card>

        {/* Blocked / Leave Status */}
        <Card className="border border-border/80 bg-card p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Blocked Periods
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-foreground">
              {todayBlockedPeriodsCount}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">Active Block(s)</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Breaks, administrative, or leave time
            </p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Weekly Schedule Matrix & Next Working Day Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Schedule Summary (2 columns) */}
        <Card className="lg:col-span-2 border border-border/80 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                Weekly Schedule Overview
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {weeklyScheduleSummary.totalWorkingDays} Active Working Days &bull; ~
                {weeklyScheduleSummary.totalWeeklyHours} Hours Scheduled / Week
              </CardDescription>
            </div>
            <Link href="/doctor/schedule/weekly">
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                Edit Schedule <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/40">
              {weeklyScheduleSummary.days.map((item) => (
                <div
                  key={item.day}
                  className="py-2.5 flex items-center justify-between text-xs transition-colors hover:bg-muted/30 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-2.5">
                    {item.isEnabled ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/60" />
                    )}
                    <span className="font-semibold text-foreground capitalize">
                      {item.day.toLowerCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.isEnabled ? (
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-mono text-[11px]"
                      >
                        {item.hours}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground/80 text-[11px]"
                      >
                        Closed / Day Off
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Working Day & Active Practice Facility */}
        <div className="space-y-4">
          {/* Next Working Day Card */}
          <Card className="border border-border/80 bg-card p-4 space-y-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Next Consultation Day
            </span>
            {nextWorkingDay ? (
              <div className="space-y-1.5">
                <div className="text-lg font-black text-foreground capitalize">
                  {nextWorkingDay.day.toLowerCase()}
                </div>
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {nextWorkingDay.date} &bull; {nextWorkingDay.hours}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Patients can book appointments according to this window.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No upcoming working days configured.</p>
            )}

            <div className="pt-2">
              <Link href="/doctor/schedule/availability">
                <Button size="sm" variant="secondary" className="w-full text-xs h-8 gap-1.5">
                  View Booking Calendar
                </Button>
              </Link>
            </div>
          </Card>

          {/* Active Facility Association */}
          <Card className="border border-border/80 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Practice Facility
              </span>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>

            {activeFacility ? (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">{activeFacility.name}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {activeFacility.address || 'Integrated Healthcare Center'}
                </p>
                <div className="pt-2 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-600/30">
                    Active Location
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No primary facility associated.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ScheduleSummary;
