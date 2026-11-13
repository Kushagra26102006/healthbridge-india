'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useDoctorProfile } from '@/features/appointments/hooks/use-appointments';
import { DoctorProfile } from '@/components/patient/appointments';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Stethoscope, ArrowLeft } from 'lucide-react';

export default function PatientDoctorProfilePage() {
  const params = useParams();
  const doctorId = Array.isArray(params.doctorId)
    ? params.doctorId[0]
    : params.doctorId;

  const { doctor, isLoading, isError } = useDoctorProfile(doctorId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <Stethoscope className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Doctor Profile Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested doctor profile could not be retrieved or is not verified on the network.
        </p>
        <Button size="sm" asChild className="text-xs h-9">
          <Link href="/patient/doctors">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Doctors Directory
          </Link>
        </Button>
      </div>
    );
  }

  return <DoctorProfile doctor={doctor} />;
}
