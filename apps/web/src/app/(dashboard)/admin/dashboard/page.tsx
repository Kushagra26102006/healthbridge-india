'use client';

import React from 'react';
import { DashboardPlaceholder } from '@/components/dashboard/DashboardPlaceholder';

export default function AdminDashboardPage() {
  return (
    <DashboardPlaceholder
      role="ADMIN"
      title="Administrative Governance Portal"
      description="Oversee healthcare facility onboarding, monitor ABDM webhook events, and inspect system audit trails."
    />
  );
}
