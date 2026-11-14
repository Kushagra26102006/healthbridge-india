'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Video,
  MapPin,
  Phone,
  Building2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QueueStatusBadge } from './QueueStatusBadge';
import { AppointmentActions } from './AppointmentActions';
import { cn } from '@/lib/utils';
import type { DoctorAppointmentItemDto } from '@healthbridge/shared-types';

export interface AppointmentCardProps {
  appointment: DoctorAppointmentItemDto;
  onRefresh?: () => void;
}

export function AppointmentCard({ appointment, onRefresh }: AppointmentCardProps) {
  const isTele = appointment.consultationType === 'TELECONSULTATION';

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(appointment.scheduledAt));

  return (
    <Card className="border border-border/80 bg-card hover:bg-muted/20 transition-all shadow-sm">
      <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Time & Schedule Info */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-20 sm:w-24 shrink-0 text-center py-2 px-2 bg-muted/60 rounded-xl border border-border/80 leading-tight">
            <span className="text-xs sm:text-sm font-extrabold text-foreground block">
              {appointment.startTime}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {appointment.endTime}
            </span>
            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 block mt-1 uppercase truncate">
              {formattedDate.split(',')[0]}
            </span>
          </div>

          {/* Middle: Patient & Demographics */}
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/doctor/appointments/${appointment.id}`}
                className="text-sm font-bold text-foreground hover:underline truncate"
              >
                {appointment.patientName}
              </Link>

              {appointment.patientAge && (
                <span className="text-xs text-muted-foreground">
                  ({appointment.patientAge}y
                  {appointment.patientGender ? ` / ${appointment.patientGender}` : ''})
                </span>
              )}

              <QueueStatusBadge status={appointment.status} />

              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 flex items-center gap-1',
                  isTele
                    ? 'border-indigo-400/40 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-emerald-400/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                )}
              >
                {isTele ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
                {isTele ? 'Teleconsult' : 'In-Person'}
              </Badge>

              {appointment.queueNumber && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                  Token #{appointment.queueNumber}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1">
              <strong className="text-foreground/80">Reason:</strong>{' '}
              {appointment.reason || 'General clinical consultation'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {appointment.facilityName || 'Clinic'}
              </span>
              {appointment.patientPhone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {appointment.patientPhone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="self-end lg:self-center shrink-0">
          <AppointmentActions
            appointmentId={appointment.id}
            status={appointment.status}
            patientName={appointment.patientName}
            onSuccess={onRefresh}
          />
        </div>
      </CardContent>
    </Card>
  );
}
