'use client';

import React from 'react';
import { NotificationCenter } from '@/components/notifications';

export default function AdminNotificationsPage() {
  return (
    <NotificationCenter
      roleTitle="Admin Operational Notification Center"
      roleSubtitle="Platform service alerts, integration status updates, event-processing notices, and authorized security alerts (zero patient clinical PHI)."
      preferencesUrl="/admin/notifications/preferences"
    />
  );
}
