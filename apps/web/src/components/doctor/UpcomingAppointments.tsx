'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DoctorAppointmentItemDto } from '@healthbridge/shared-types';

export interface UpcomingAppointmentsProps {
  appointments: DoctorAppointmentItemDto[];
  isLoading?: boolean;
  className?: string;
}

export function UpcomingAppointments({
  appointments,
  isLoading = false,
  className,
}: UpcomingAppointmentsProps) {
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <Card className={cn('border border-border/80 bg-card shadow-sm', className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Upcoming Consultations
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Next scheduled appointments
          </p>
        </div>

        <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400 gap-1">
          <Link href="/doctor/appointments">
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted/50 animate-pulse rounded-xl border border-border/40"
              />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Calendar className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs text-muted-foreground">
              No upcoming appointments scheduled.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {appointments.slice(0, 5).map((apt) => {
              const isTele = apt.consultationType === 'TELECONSULTATION';

              return (
                <div
                  key={apt.id}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex flex-col items-center justify-center shrink-0 leading-tight">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                        {formatDate(apt.scheduledAt).split(' ')[0]}
                      </span>
                      <span className="text-xs font-extrabold text-foreground">
                        {formatDate(apt.scheduledAt).split(' ')[1]}
                      </span>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {apt.patientName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1.5 py-0 flex items-center gap-0.5',
                            isTele ? 'text-indigo-600 border-indigo-400/40' : 'text-emerald-600 border-emerald-400/40'
                          )}
                        >
                          {isTele ? <Video className="h-2 w-2" /> : <MapPin className="h-2 w-2" />}
                          {isTele ? 'Tele' : 'Clinic'}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{apt.startTime} - {apt.endTime}</span>
                        <span>•</span>
                        <span className="truncate">{apt.reason || 'Consultation'}</span>
                      </p>
                    </div>
                  </div>

                  <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                    <Link href={`/doctor/appointments`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
