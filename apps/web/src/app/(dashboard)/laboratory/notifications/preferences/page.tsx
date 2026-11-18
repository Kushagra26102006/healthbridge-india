'use client';

import React from 'react';
import { NotificationPreferencesForm } from '@/components/notifications';

export default function LaboratoryNotificationPreferencesPage() {
  return (
    <NotificationPreferencesForm
      roleTitle="Laboratory Notification Preferences"
      backUrl="/laboratory/notifications"
    />
  );
}
