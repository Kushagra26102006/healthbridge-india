'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Building2,
  Video,
  Users,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AppointmentDetailDto, AppointmentStatus } from '@healthbridge/shared-types';

export interface AppointmentCardProps {
  appointment: AppointmentDetailDto;
  onCancelClick?: (appointment: AppointmentDetailDto) => void;
  onRescheduleClick?: (appointment: AppointmentDetailDto) => void;
}

export const getStatusBadge = (status: AppointmentStatus) => {
  switch (status) {
    case 'CONFIRMED':
      return {
        label: 'Confirmed',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: CheckCircle2,
      };
    case 'REQUESTED':
    case 'SCHEDULED':
      return {
        label: 'Scheduled',
        bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        icon: Clock,
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        icon: CheckCircle2,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        icon: XCircle,
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: Clock,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: AlertCircle,
      };
  }
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancelClick,
  onRescheduleClick,
}) => {
  const statusInfo = getStatusBadge(appointment.status);
  const StatusIcon = statusInfo.icon;

  const isFuture = new Date(appointment.scheduledAt) > new Date();
  const canModify =
    isFuture && (appointment.status === 'CONFIRMED' || appointment.status === 'REQUESTED');

  const scheduledDate = new Date(appointment.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Header: Date badge + Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Badge className={`${statusInfo.bg} border text-xs font-medium flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              <span>{statusInfo.label}</span>
            </Badge>

            {appointment.consultationType === 'IN_PERSON' ? (
              <Badge
                variant="outline"
                className="text-xs border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-300 flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                <span>In-Person</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 flex items-center gap-1"
              >
                <Video className="h-3 w-3" />
                <span>Teleconsult</span>
              </Badge>
            )}
          </div>

          <div className="text-right text-xs text-slate-500 font-medium">
            Slot: <span className="text-slate-900 dark:text-slate-100 font-semibold">{appointment.startTime}</span> (IST)
          </div>
        </div>

        {/* Doctor and Facility Information */}
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
            {appointment.doctorName
              .replace('Dr. ', '')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <Link
                href={`/patient/appointments/${appointment.id}`}
                className="font-semibold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors truncate"
              >
                {appointment.doctorName}
              </Link>
              <ShieldCheck className="h-4 w-4 text-teal-600 flex-shrink-0" />
            </div>

            {appointment.doctorSpecialization && (
              <p className="text-xs text-slate-500 truncate">
                {appointment.doctorSpecialization.join(', ')}
              </p>
            )}

            {appointment.facilityName && (
              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{appointment.facilityName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Schedule & Reason Banner */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-teal-600" />
              <span>{formattedDate}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{appointment.startTime} – {appointment.endTime}</span>
            </span>
          </div>

          {appointment.reason && (
            <p className="text-slate-600 dark:text-slate-400 truncate pt-0.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Reason: </span>
              {appointment.reason}
            </p>
          )}

          {appointment.cancellationReason && (
            <p className="text-rose-600 dark:text-rose-400 text-[11px] truncate pt-0.5">
              <span className="font-semibold">Cancellation: </span>
              {appointment.cancellationReason}
            </p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <Link href={`/patient/appointments/${appointment.id}`}>
            <span>View Details</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>

        {canModify && (
          <div className="flex items-center space-x-1.5">
            {onRescheduleClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRescheduleClick(appointment)}
                className="text-xs h-8 px-2.5 border-slate-200 dark:border-slate-700"
              >
                Reschedule
              </Button>
            )}

            {onCancelClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelClick(appointment)}
                className="text-xs h-8 px-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
