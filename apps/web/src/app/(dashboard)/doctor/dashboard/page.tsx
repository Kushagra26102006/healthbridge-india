'use client';

import React from 'react';
import { DashboardPlaceholder } from '@/components/dashboard/DashboardPlaceholder';

export default function DoctorDashboardPage() {
  return (
    <DashboardPlaceholder
      role="DOCTOR"
      title="Doctor Clinical Workspace"
      description="Review patient longitudinal medical history with consent, write e-prescriptions, and manage consultations."
    />
  );
}
