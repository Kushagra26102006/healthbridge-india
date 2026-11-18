'use client';

import React from 'react';
import { NotificationPreferencesForm } from '@/components/notifications';

export default function AdminNotificationPreferencesPage() {
  return (
    <NotificationPreferencesForm
      roleTitle="Admin Operational Notification Preferences"
      backUrl="/admin/notifications"
    />
  );
}
