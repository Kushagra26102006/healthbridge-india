'use client';

import React from 'react';
import { Stethoscope } from 'lucide-react';
import { DoctorEmptyState } from '@/components/doctor/DoctorEmptyState';

export default function DoctorEncountersPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Clinical Encounters & EMR
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Patient examination notes, diagnosis ICD-10 coding, clinical observations, and longitudinal chart
        </p>
      </div>

      <DoctorEmptyState
        title="Clinical Encounters Engine"
        description="Select an active consultation from your appointments schedule to initiate clinical documentation, record vitals, and issue digital prescriptions."
        icon={Stethoscope}
        actionHref="/doctor/appointments"
        actionLabel="View Today's Appointments"
      />
    </div>
  );
}
