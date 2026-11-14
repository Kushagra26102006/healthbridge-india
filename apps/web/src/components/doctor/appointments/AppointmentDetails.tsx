'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Building2,
  User,
  Phone,
  Mail,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QueueStatusBadge } from './QueueStatusBadge';
import { AppointmentActions } from './AppointmentActions';
import { cn } from '@/lib/utils';
import type { DoctorAppointmentDetailDto } from '@healthbridge/shared-types';

export interface AppointmentDetailsProps {
  appointment: DoctorAppointmentDetailDto;
  onRefresh?: () => void;
}

export function AppointmentDetails({ appointment, onRefresh }: AppointmentDetailsProps) {
  const isTele = appointment.consultationType === 'TELECONSULTATION';

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(appointment.scheduledAt));

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl">
            <Link href="/doctor/appointments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Appointment #{appointment.id.slice(-6).toUpperCase()}
              </h1>
              <QueueStatusBadge status={appointment.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scheduled for {formattedDate}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="self-start sm:self-center">
          <AppointmentActions
            appointmentId={appointment.id}
            status={appointment.status}
            patientName={appointment.patientName}
            onSuccess={onRefresh}
          />
        </div>
      </div>

      {/* Grid: Patient Details & Clinical Consultation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Authorized Patient Demographics */}
        <Card className="border border-border/80 bg-card shadow-sm md:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-bold text-foreground">
                Authorized Patient
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-3.5 text-xs">
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/60">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {appointment.patientName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <span className="font-bold text-foreground block truncate">
                  {appointment.patientName}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {appointment.patientAge ? `${appointment.patientAge} Years` : 'Age N/A'}
                  {appointment.patientGender ? ` • ${appointment.patientGender}` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-muted-foreground">
              {appointment.patientPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="text-foreground">{appointment.patientPhone}</span>
                </div>
              )}

              {appointment.patientEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="text-foreground truncate">{appointment.patientEmail}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">
                  ABDM Privacy Scope Verified
                </span>
              </div>
            </div>

            {appointment.previousEncounterId && (
              <div className="p-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 text-[11px] space-y-1">
                <span className="font-bold text-teal-800 dark:text-teal-200 block">
                  Prior Consultation History
                </span>
                <p className="text-muted-foreground">Patient has previously consulted with your clinic.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Columns: Appointment Information & Timeline */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-border/80 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Consultation Schedule & Facility
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Time Slot
                  </span>
                  <span className="text-sm font-extrabold text-foreground block">
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </div>

                <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Mode
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] mt-0.5',
                      isTele
                        ? 'border-indigo-400 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-emerald-400 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                    )}
                  >
                    {isTele ? 'Teleconsultation' : 'In-Person Hospital'}
                  </Badge>
                </div>

                <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Queue Token
                  </span>
                  <span className="text-sm font-extrabold text-foreground block">
                    {appointment.queueNumber ? `#${appointment.queueNumber}` : 'Not Checked In'}
                  </span>
                </div>
              </div>

              {appointment.facility && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                  <Building2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground block">
                      {appointment.facility.name}
                    </span>
                    <span className="text-muted-foreground text-[11px] block">
                      {appointment.facility.address?.line1
                        ? `${appointment.facility.address.line1}, ${appointment.facility.address.city}`
                        : 'Healthcare Center'}
                    </span>
                  </div>
                </div>
              )}

              {/* Reason & Notes */}
              <div className="space-y-2 pt-2 border-t border-border/80">
                <div>
                  <span className="font-bold text-foreground block">
                    Chief Complaint / Reason for Visit
                  </span>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    {appointment.reason}
                  </p>
                </div>

                {appointment.notes && (
                  <div>
                    <span className="font-bold text-foreground block">
                      Patient Clinical Notes
                    </span>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed italic bg-muted/20 p-2.5 rounded-xl border border-border/60">
                      &quot;{appointment.notes}&quot;
                    </p>
                  </div>
                )}

                {appointment.rejectionReason && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-0.5">
                    <span className="font-bold block">Rejection Reason</span>
                    <p>{appointment.rejectionReason}</p>
                  </div>
                )}

                {appointment.cancellationReason && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-0.5">
                    <span className="font-bold block">Cancellation Reason</span>
                    <p>{appointment.cancellationReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps & Audit Trail */}
          <Card className="border border-border/80 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Workflow Lifecycle & Timestamps
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
              <div>
                <span className="text-[10px] uppercase font-bold block">Booked At</span>
                <span className="font-mono text-foreground">
                  {new Date(appointment.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold block">Check-in</span>
                <span className="font-mono text-foreground">
                  {appointment.checkedInAt
                    ? new Date(appointment.checkedInAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Pending'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold block">Started At</span>
                <span className="font-mono text-foreground">
                  {appointment.consultationStartedAt
                    ? new Date(appointment.consultationStartedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Not Started'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold block">Completed At</span>
                <span className="font-mono text-foreground">
                  {appointment.completedAt
                    ? new Date(appointment.completedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Active'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
