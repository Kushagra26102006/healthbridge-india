'use client';

import React from 'react';
import { DashboardPlaceholder } from '@/components/dashboard/DashboardPlaceholder';

export default function LaboratoryDashboardPage() {
  return (
    <DashboardPlaceholder
      role="LABORATORY"
      title="Diagnostic Laboratory Portal"
      description="Publish structured pathology and radiology reports directly into patient health accounts with reference ranges."
    />
  );
}
