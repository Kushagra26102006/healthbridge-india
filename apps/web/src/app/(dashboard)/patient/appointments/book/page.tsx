'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentBookingWizard } from '@/components/patient/appointments';

export default function BookAppointmentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Book Clinical Appointment</span>
            </h1>
            <p className="text-xs text-slate-500">
              Step-by-step specialist selection and atomic real-time slot reservation
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
          <ShieldCheck className="h-4 w-4" />
          <span>ABHA Protected</span>
        </div>
      </div>

      {/* Booking Wizard with Suspense wrapper for Next.js searchParams */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-slate-400">
            Loading booking wizard...
          </div>
        }
      >
        <AppointmentBookingWizard />
      </Suspense>
    </div>
  );
}

