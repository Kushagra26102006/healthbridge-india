'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppointmentList } from '@/components/doctor/appointments';
import { useDoctorAppointments } from '@/features/doctor/hooks/use-doctor';

export default function DoctorAppointmentsHistoryPage() {
  const [page, setPage] = useState(1);

  const {
    appointments,
    pagination,
    isLoading,
    refetch,
  } = useDoctorAppointments({
    page,
    limit: 20,
    filterTab: 'history',
  });

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl">
          <Link href="/doctor/appointments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Consultation History
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of completed, cancelled, and closed patient encounters
          </p>
        </div>
      </div>

      <AppointmentList
        appointments={appointments}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
        onRefresh={refetch}
        emptyMessage="No historical consultations recorded."
      />
    </div>
  );
}
