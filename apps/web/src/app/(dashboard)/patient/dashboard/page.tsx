'use client';

import React from 'react';
import { DashboardPlaceholder } from '@/components/dashboard/DashboardPlaceholder';

export default function PatientDashboardPage() {
  return (
    <DashboardPlaceholder
      role="PATIENT"
      title="Patient Health Locker"
      description="Access your longitudinal medical records, connect your ABHA address, and manage doctor consent."
    />
  );
}
