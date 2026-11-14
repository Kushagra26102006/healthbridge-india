'use client';

import React from 'react';
import { Pill } from 'lucide-react';
import { DoctorEmptyState } from '@/components/doctor/DoctorEmptyState';

export default function DoctorPrescriptionsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Prescription & Medication Management
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Digital e-prescriptions, drug interaction alerts, dosage schedules, and pharmacy fulfillment tracking
        </p>
      </div>

      <DoctorEmptyState
        title="Electronic Prescriptions Repository"
        description="Prescriptions issued during consultations are digitally signed, anchored to patient ABDM health records, and shared with authorized pharmacies."
        icon={Pill}
        actionHref="/doctor/appointments"
        actionLabel="Go to Consultations"
      />
    </div>
  );
}
