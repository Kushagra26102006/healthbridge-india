import * as React from 'react';
import { Calendar, Clock, Video, MapPin, Stethoscope } from 'lucide-react';
import type { AppointmentSummaryDto } from '@healthbridge/shared-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HealthcareStatusBadge } from './HealthcareStatusBadge';
import { cn } from '@/lib/utils';

export interface AppointmentCardProps {
  appointment: AppointmentSummaryDto;
  perspective?: 'patient' | 'doctor';
  onSelect?: (appointment: AppointmentSummaryDto) => void;
  actions?: React.ReactNode;
  className?: string;
}

export function AppointmentCard({
  appointment,
  perspective = 'patient',
  onSelect,
  actions,
  className,
}: AppointmentCardProps) {
  const scheduledDate = React.useMemo(() => {
    const parsed = new Date(appointment.scheduledAt);
    if (Number.isNaN(parsed.getTime())) {
      return { date: appointment.scheduledAt, time: appointment.startTime ?? '' };
    }
    return {
      date: parsed.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time:
        appointment.startTime ??
        parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  }, [appointment.scheduledAt, appointment.startTime]);

  const primaryTitle =
    perspective === 'doctor'
      ? appointment.patientName || 'Patient Consultation'
      : appointment.doctorName || 'Assigned Doctor';

  const isTele = appointment.consultationType === 'TELECONSULTATION';

  return (
    <Card
      variant={onSelect ? 'interactive' : 'default'}
      onClick={onSelect ? () => onSelect(appointment) : undefined}
      className={cn('p-5 flex flex-col gap-3.5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary"
            aria-hidden="true"
          >
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <h3 className="text-card-heading truncate">{primaryTitle}</h3>
            {appointment.doctorSpecialization && appointment.doctorSpecialization.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                {appointment.doctorSpecialization.join(' • ')}
              </p>
            )}
          </div>
        </div>
        <HealthcareStatusBadge status={appointment.status} size="sm" />
      </div>

      {appointment.reason && (
        <p className="text-sm text-muted-foreground line-clamp-2">{appointment.reason}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-border/80 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 text-foreground font-medium tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>{scheduledDate.date}</span>
        </span>
        {scheduledDate.time && (
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {scheduledDate.time}
              {appointment.endTime ? ` – ${appointment.endTime}` : ''}
            </span>
          </span>
        )}
        <Badge variant={isTele ? 'teal' : 'neutral'} size="sm">
          {isTele ? (
            <Video className="h-3 w-3" aria-hidden="true" />
          ) : (
            <MapPin className="h-3 w-3" aria-hidden="true" />
          )}
          <span>{isTele ? 'Teleconsultation' : appointment.facilityName || 'In-Person'}</span>
        </Badge>
      </div>

      {actions && (
        <div
          className="flex flex-wrap items-center justify-end gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </Card>
  );
}
