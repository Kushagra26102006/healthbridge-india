'use client';

import React from 'react';
import { NotificationCenter } from '@/components/notifications';

export default function PatientNotificationsPage() {
  return (
    <NotificationCenter
      roleTitle="Patient Notification Center"
      preferencesUrl="/patient/notifications/preferences"
    />
  );
}
