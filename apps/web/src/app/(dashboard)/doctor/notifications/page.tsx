'use client';

import React from 'react';
import { NotificationCenter } from '@/components/notifications';

export default function DoctorNotificationsPage() {
  return (
    <NotificationCenter
      roleTitle="Doctor Notification Center"
      roleSubtitle="Real-time clinical workflow updates for appointments, laboratory reports, and consent changes."
      preferencesUrl="/doctor/notifications/preferences"
    />
  );
}
