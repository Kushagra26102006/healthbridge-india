'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AppointmentDetails,
  CancelAppointmentDialog,
  RescheduleAppointmentDialog,
} from '@/components/patient/appointments';
import { useAppointmentDetails } from '@/features/appointments/hooks/use-appointments';

export default function PatientAppointmentDetailPage() {
  const params = useParams();
  const appointmentId = Array.isArray(params.appointmentId)
    ? params.appointmentId[0]
    : params.appointmentId;

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const { appointment, isLoading, isError, refetch } = useAppointmentDetails(appointmentId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Appointment Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested appointment record does not exist or you do not have permission to access it.
        </p>
        <Button size="sm" asChild className="text-xs h-9">
          <Link href="/patient/appointments">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Appointments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <AppointmentDetails
        appointment={appointment}
        onCancelClick={() => setIsCancelOpen(true)}
        onRescheduleClick={() => setIsRescheduleOpen(true)}
      />

      <CancelAppointmentDialog
        isOpen={isCancelOpen}
        appointment={appointment}
        onClose={() => setIsCancelOpen(false)}
        onSuccess={() => refetch()}
      />

      <RescheduleAppointmentDialog
        isOpen={isRescheduleOpen}
        appointment={appointment}
        onClose={() => setIsRescheduleOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  );
}
