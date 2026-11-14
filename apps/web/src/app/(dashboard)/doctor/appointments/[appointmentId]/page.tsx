'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentDetails, AppointmentSkeleton } from '@/components/doctor/appointments';
import { useDoctorAppointmentDetail } from '@/features/doctor/hooks/use-doctor';

export default function DoctorAppointmentDetailPage() {
  const params = useParams();
  const appointmentId = params?.appointmentId as string;

  const { appointment, isLoading, isError, error, refetch } =
    useDoctorAppointmentDetail(appointmentId);

  if (isLoading) {
    return <AppointmentSkeleton />;
  }

  if (isError || !appointment) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Appointment Not Found</h2>
          <p className="text-xs text-muted-foreground">
            {error?.message || 'This consultation could not be located or you lack clinical authorization.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/doctor/appointments">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Appointments
            </Link>
          </Button>
          <Button size="sm" onClick={() => refetch()} className="text-xs">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return <AppointmentDetails appointment={appointment} onRefresh={refetch} />;
}

