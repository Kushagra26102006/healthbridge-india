'use client';

import React from 'react';
import { NotificationPreferencesForm } from '@/components/notifications';

export default function DoctorNotificationPreferencesPage() {
  return (
    <NotificationPreferencesForm
      roleTitle="Doctor Notification Preferences"
      backUrl="/doctor/notifications"
    />
  );
}
