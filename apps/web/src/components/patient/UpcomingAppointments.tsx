'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, User, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientEmptyState } from './PatientEmptyState';
import type { PatientDashboardSummaryDto } from '@healthbridge/shared-types';

export interface UpcomingAppointmentsProps {
  appointments?: PatientDashboardSummaryDto['upcomingAppointments'];
  isLoading?: boolean;
}

export function UpcomingAppointments({
  appointments = [],
  isLoading = false,
}: UpcomingAppointmentsProps) {
  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const dateStr = new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
      const timeStr = new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
      return { dateStr, timeStr };
    } catch {
      return { dateStr: iso, timeStr: '' };
    }
  };

  return (
    <Card className="border-border/80 shadow-card bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
            <Calendar className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold text-foreground">
            Upcoming Consultations
          </CardTitle>
        </div>

        <Link
          href="/patient/appointments"
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-muted/40 border border-border animate-pulse space-y-2"
              >
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const { dateStr, timeStr } = formatDateTime(apt.scheduledAt);
              return (
                <div
                  key={apt.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/70 hover:border-teal-500/40 hover:bg-accent/40 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                          {apt.doctorName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {apt.specialty}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        apt.status === 'CONFIRMED'
                          ? 'success'
                          : apt.status === 'SCHEDULED'
                            ? 'abha'
                            : 'secondary'
                      }
                      className="text-[10px] font-mono capitalize"
                    >
                      {apt.status.toLowerCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>
                        {dateStr} • {timeStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{apt.facilityName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <PatientEmptyState
            icon={Calendar}
            title="No Upcoming Consultations"
            description="You don't have any appointments scheduled right now. Book a verified consultation with registered practitioners."
            actionLabel="Schedule Appointment"
            actionHref="/patient/appointments"
          />
        )}
      </CardContent>
    </Card>
  );
}

export default UpcomingAppointments;
