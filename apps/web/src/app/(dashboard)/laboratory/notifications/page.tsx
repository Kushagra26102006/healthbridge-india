'use client';

import React from 'react';
import { NotificationCenter } from '@/components/notifications';

export default function LaboratoryNotificationsPage() {
  return (
    <NotificationCenter
      roleTitle="Laboratory Notification Center"
      roleSubtitle="Real-time updates for assigned laboratory orders, sample tracking, report reviews, QC incidents, and instrument maintenance."
      preferencesUrl="/laboratory/notifications/preferences"
    />
  );
}
