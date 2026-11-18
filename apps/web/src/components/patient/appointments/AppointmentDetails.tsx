'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  Video,
  Users,
  ShieldCheck,
  ArrowLeft,
  FileText,
  AlertCircle,
  RotateCcw,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatusBadge } from './AppointmentCard';
import type { AppointmentDetailDto } from '@healthbridge/shared-types';

export interface AppointmentDetailsProps {
  appointment: AppointmentDetailDto;
  onCancelClick: () => void;
  onRescheduleClick: () => void;
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 -ml-2"
        >
          <Link href="/patient/appointments">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to All Appointments
          </Link>
        </Button>
      </div>

      {/* Main Appointment Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${statusInfo.bg} border text-xs font-medium flex items-center gap-1`}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span>{statusInfo.label}</span>
              </Badge>

              {appointment.consultationType === 'IN_PERSON' ? (
                <Badge
                  variant="outline"
                  className="text-xs border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-300 flex items-center gap-1"
                >
                  <Users className="h-3 w-3" />
                  <span>In-Person Clinic Visit</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 flex items-center gap-1"
                >
                  <Video className="h-3 w-3" />
                  <span>Secure Teleconsultation</span>
                </Badge>
              )}

              {appointment.rescheduleCount && appointment.rescheduleCount > 0 ? (
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                  Rescheduled {appointment.rescheduleCount}x
                </Badge>
              ) : null}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 pt-1">
              Appointment with {appointment.doctorName}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Ref ID: {appointment.id}
            </p>
          </div>

          {canModify && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onRescheduleClick}
                className="text-xs h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-700 flex-1 sm:flex-initial"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reschedule
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelClick}
                className="text-xs h-9 px-3.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex-1 sm:flex-initial"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Cancel Appointment
              </Button>
            </div>
          )}
        </div>

        {/* Date, Time & Mode Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 space-y-1">
            <span className="text-[11px] font-medium text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-teal-600" />
              <span>Consultation Schedule</span>
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              {formattedDate}
            </p>
            <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
              {appointment.startTime} – {appointment.endTime} (IST)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
              {appointment.consultationType === 'IN_PERSON' ? (
                <Building2 className="h-3.5 w-3.5 text-teal-600" />
              ) : (
                <Video className="h-3.5 w-3.5 text-blue-600" />
              )}
              <span>Location / Access</span>
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {appointment.consultationType === 'IN_PERSON'
                ? appointment.facilityName || 'Clinic Consultation'
                : 'Encrypted Teleconsultation Room'}
            </p>
            <p className="text-xs text-slate-500">
              {appointment.consultationType === 'IN_PERSON'
                ? `${appointment.facilityAddress || ''} ${appointment.facilityCity || ''}`
                : 'WebRTC DTLS-SRTP encrypted room • Recording disabled • Audio-only fallback supported'}
            </p>
          </div>
        </div>

        {/* Patient Join Video Consultation Action Banner */}
        {appointment.consultationType === 'TELECONSULTATION' &&
          ['CONFIRMED', 'SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'].includes(appointment.status) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-teal-50/70 to-cyan-50/60 dark:from-blue-950/35 dark:via-teal-950/25 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                    Video Consultation Ready
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Enter the encrypted waiting room with {appointment.doctorName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Test your camera and microphone before connecting, or join in Audio-Only mode. Not
                  for medical emergencies (dial 112 / 108).
                </p>
              </div>
              <Button variant="teal" size="default" asChild className="shrink-0 shadow-sm">
                <Link href={`/patient/appointments/${appointment.id}/consultation`}>
                  <Video className="h-4 w-4 mr-1.5" />
                  <span>Join Video Consultation</span>
                </Link>
              </Button>
            </div>
          )}

        {/* Doctor and Facility Information */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Doctor Information
            </h2>
            {appointment.doctorId && (
              <Button variant="ghost" size="sm" asChild className="text-xs h-7 text-teal-600 hover:text-teal-700">
                <Link href={`/patient/doctors/${appointment.doctorId}`}>
                  <span>View Full Profile</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>

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

            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {appointment.doctorName}
                </span>
                <ShieldCheck className="h-4 w-4 text-teal-600" />
              </div>

              {appointment.doctorSpecialization && (
                <p className="text-xs text-slate-500">
                  {appointment.doctorSpecialization.join(', ')}
                </p>
              )}

              {appointment.doctorQualifications && (
                <p className="text-xs text-slate-400">
                  {appointment.doctorQualifications.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Reason and Notes */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-slate-400" />
            <span>Clinical Reason</span>
          </h2>
          <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            {appointment.reason}
          </p>

          {appointment.notes && (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic pl-1 pt-1">
              Patient Notes: {appointment.notes}
            </div>
          )}
        </div>

        {/* Cancellation Details if Cancelled */}
        {appointment.status === 'CANCELLED' && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span>Cancellation Notice</span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              Reason: {appointment.cancellationReason || 'No reason specified'}
            </p>
            {appointment.cancelledAt && (
              <p className="text-[11px] text-rose-500">
                Cancelled on {new Date(appointment.cancelledAt).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        )}

        {/* Policy Notice */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-start space-x-2.5 text-xs text-slate-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-slate-400" />
          <p>
            HealthBridge India appointments follow hospital policy. Free cancellation or rescheduling
            is available up to 2 hours before the scheduled time slot. Please arrive 10 minutes prior
            with any recent diagnostic test results.
          </p>
        </div>
      </Card>
    </div>
  );
};
