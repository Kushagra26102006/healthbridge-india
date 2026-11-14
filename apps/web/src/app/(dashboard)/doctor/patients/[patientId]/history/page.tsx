'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  PatientProfileHeader,
  ClinicalHistoryTimeline,
  PatientDetailsSkeleton,
  PatientEmptyState,
} from '@/components/doctor/patients';
import { useDoctorPatientProfile } from '@/features/doctor/hooks/use-doctor';

export default function DoctorPatientHistoryTimelinePage() {
  const params = useParams();
  const patientId = params?.patientId as string;

  const { profile, isLoading, isError, error, refetch } = useDoctorPatientProfile(patientId);

  if (isLoading) {
    return <PatientDetailsSkeleton />;
  }

  if (isError || !profile) {
    return (
      <PatientEmptyState
        title="Clinical History Unavailable"
        description={error?.message || 'You lack verified clinical authorization or active patient consent to access this health timeline.'}
        actionLabel="Back to Patients"
        onAction={() => {
          window.location.href = '/doctor/patients';
        }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      <PatientProfileHeader overview={profile} onRefresh={() => refetch()} />
      <ClinicalHistoryTimeline patientId={patientId} />
    </div>
  );
}
