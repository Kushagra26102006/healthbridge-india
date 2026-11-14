'use client';

import React from 'react';
import { NotificationCenter } from '@/components/notifications';

export default function PharmacyNotificationsPage() {
  return (
    <NotificationCenter
      roleTitle="Pharmacy Notification Center"
      preferencesUrl="/pharmacy/notifications/preferences"
      historyUrl="/pharmacy/notifications/history"
    />
  );
}
