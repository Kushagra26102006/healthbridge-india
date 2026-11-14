'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentList } from '@/components/doctor/appointments';
import { useDoctorAppointments } from '@/features/doctor/hooks/use-doctor';

export default function DoctorTodayAppointmentsPage() {
  const [page, setPage] = useState(1);

  const {
    appointments,
    pagination,
    isLoading,
    refetch,
  } = useDoctorAppointments({
    page,
    limit: 20,
    filterTab: 'today',
  });

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl">
            <Link href="/doctor/appointments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Today&apos;s Consultations
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scheduled clinical visits and teleconsultations for today
            </p>
          </div>
        </div>

        <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shadow-sm">
          <Link href="/doctor/queue">
            <Users className="h-3.5 w-3.5" />
            Go to Patient Queue
          </Link>
        </Button>
      </div>

      <AppointmentList
        appointments={appointments}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
        onRefresh={refetch}
        emptyMessage="No consultations scheduled for today."
      />
    </div>
  );
}
